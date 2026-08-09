import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { fellowshipMeetups, type FellowshipCategory } from "@/lib/demo-data";
import type { Viewer } from "@/lib/auth/viewer";
import type { FellowshipMeetupView, FellowshipResponse } from "@/lib/fellowship-contract";
import { createClient } from "@/lib/supabase/server";

interface MeetupRow {
  id: string;
  creator_profile_id: string;
  title: string;
  category: FellowshipCategory;
  description: string;
  visibility: "church" | "ministry" | "group";
  audience_label: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  general_location_name: string;
  general_area: string;
  family_friendly: boolean;
  spontaneous: boolean;
  capacity: number | null;
  allow_waitlist: boolean;
  status: string;
  accessibility_note: string | null;
  cost_note: string | null;
  weather_plan: string | null;
}

interface MembershipRow {
  meetup_id: string;
  profile_id: string;
  status: FellowshipResponse | "host";
  party_size: number;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
}

const categoryLabels: Record<FellowshipCategory, string> = {
  prayer: "Prayer",
  families: "Families",
  outdoors: "Outdoors",
  food: "Coffee & meals",
  service: "Service",
  sports: "Sports",
  "young-adults": "Young adults",
  "whole-church": "Whole church",
};

function displayDate(value: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: timezone,
  }).format(new Date(value));
}

function displayTimeRange(startsAt: string, endsAt: string, timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  });
  return `${formatter.format(new Date(startsAt))}–${formatter.format(new Date(endsAt))}`;
}

function fallbackHostLabel(profileId: string): string {
  return `Member ${profileId.slice(0, 4).toUpperCase()}`;
}

export async function loadFellowshipMeetups(viewer: Viewer): Promise<FellowshipMeetupView[]> {
  if (viewer.demo) {
    return fellowshipMeetups.map((meetup) => ({
      ...meetup,
      visibility: "church",
      memberResponse: meetup.id === "meetup-2" ? "going" : null,
      canOpenThread: meetup.id === "meetup-2",
      canManage: false,
    }));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fellowship_meetups")
    .select(
      "id,creator_profile_id,title,category,description,visibility,audience_label,starts_at,ends_at,timezone,general_location_name,general_area,family_friendly,spontaneous,capacity,allow_waitlist,status,accessibility_note,cost_note,weather_plan",
    )
    .in("status", ["active", "paused", "cancelled"])
    .gte("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(100);
  if (error) throw new Error("Fellowship invitations could not be loaded.");

  const rows = (data ?? []) as MeetupRow[];
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const creatorIds = [...new Set(rows.map((row) => row.creator_profile_id))];

  const [{ data: memberships }, { data: profiles }] = await Promise.all([
    supabase
      .from("fellowship_meetup_members")
      .select("meetup_id,profile_id,status,party_size")
      .in("meetup_id", ids),
    supabase.from("profiles").select("id,display_name").in("id", creatorIds),
  ]);
  const membershipRows = (memberships ?? []) as MembershipRow[];
  const profileRows = (profiles ?? []) as ProfileRow[];
  const profileLabels = new Map(
    profileRows.map((profile) => [
      profile.id,
      profile.display_name?.trim() || fallbackHostLabel(profile.id),
    ]),
  );
  const myResponses = new Map(
    membershipRows
      .filter((membership) => membership.profile_id === viewer.id)
      .map((membership) => [membership.meetup_id, membership.status]),
  );
  const counts = new Map<string, number>();
  for (const membership of membershipRows) {
    if (!["host", "going"].includes(membership.status)) continue;
    counts.set(
      membership.meetup_id,
      (counts.get(membership.meetup_id) ?? 0) + Math.max(1, membership.party_size),
    );
  }

  return rows.map((row) => {
    const host =
      profileLabels.get(row.creator_profile_id) ?? fallbackHostLabel(row.creator_profile_id);
    const memberResponse = myResponses.get(row.id) ?? null;
    const tags = [categoryLabels[row.category]];
    if (row.family_friendly) tags.push("Kids welcome");
    if (row.accessibility_note) tags.push("Accessibility info");
    if (row.cost_note) tags.push("Cost details");

    return {
      id: row.id,
      title: row.title,
      category: row.category,
      host,
      hostInitial: host.slice(0, 1).toUpperCase(),
      dateLabel: displayDate(row.starts_at, row.timezone),
      timeLabel: displayTimeRange(row.starts_at, row.ends_at, row.timezone),
      locationName: row.general_location_name,
      area: row.general_area,
      description: row.description,
      audience: row.audience_label,
      attendeeCount: counts.get(row.id) ?? 1,
      capacity: row.capacity ?? undefined,
      familyFriendly: row.family_friendly,
      spontaneous: row.spontaneous,
      exactLocationAfterJoin: true,
      tags,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      timezone: row.timezone,
      visibility: row.visibility,
      accessibilityNote: row.accessibility_note,
      costNote: row.cost_note,
      weatherPlan: row.weather_plan,
      memberResponse,
      canOpenThread: ["host", "interested", "going", "waitlisted"].includes(memberResponse ?? ""),
      canManage: row.creator_profile_id === viewer.id,
    };
  });
}

export async function countMeetupParticipants(
  supabase: SupabaseClient,
  meetupId: string,
): Promise<number> {
  const { data, error } = await supabase.rpc("fellowship_meetup_attendee_count", {
    requested_meetup_id: meetupId,
  });
  if (error) return 0;
  return Number(data ?? 0);
}
