import type { Viewer } from "@/lib/auth/viewer";
import { fellowshipMeetups, type FellowshipCategory, type FellowshipMeetup } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";

export type FellowshipResponseStatus = "host" | "interested" | "going" | "waitlisted" | "cancelled";

export interface FellowshipMeetupView extends FellowshipMeetup {
  startsAt?: string;
  endsAt?: string;
  visibility?: "church" | "ministry" | "group";
  joinedStatus?: FellowshipResponseStatus | null;
  accessibilityNote?: string | null;
  foodNote?: string | null;
  costNote?: string | null;
  transportationNote?: string | null;
  recurrenceLabel?: string | null;
  weatherPlan?: string | null;
}

export interface FellowshipMessageView {
  id: string;
  authorProfileId: string;
  authorLabel: string;
  body: string;
  createdAt: string;
}

export interface FellowshipMeetupDetail {
  meetup: FellowshipMeetupView;
  exactMeetingInstructions: string | null;
  virtualJoinUrl: string | null;
  hostContactNote: string | null;
  messages: FellowshipMessageView[];
}

function formatMeetupDate(
  value: string,
  timeZone: string,
): { dateLabel: string; timeLabel: string } {
  const date = new Date(value);
  return {
    dateLabel: new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone,
    }).format(date),
    timeLabel: new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    }).format(date),
  };
}

function demoMeetups(): FellowshipMeetupView[] {
  return fellowshipMeetups.map((meetup) => ({
    ...meetup,
    visibility: "church",
    joinedStatus: meetup.id === "meetup-2" ? "going" : null,
    accessibilityNote: meetup.tags.includes("Accessible")
      ? "Accessible roles or routes are available."
      : null,
    foodNote:
      meetup.category === "food" || meetup.category === "whole-church"
        ? "Members choose and purchase their own food unless the host says otherwise."
        : null,
    costNote:
      meetup.category === "food"
        ? "Typical public coffee-shop pricing."
        : "No known required cost in this synthetic invitation.",
    transportationNote:
      "Transportation is arranged by each household unless an approved host offers an opt-in coordination thread.",
    recurrenceLabel: meetup.id === "meetup-6" ? "Recurring after selected Sunday gatherings" : null,
    weatherPlan:
      meetup.category === "prayer" || meetup.category === "sports"
        ? "Host will post a weather decision in the meetup thread."
        : null,
  }));
}

export async function loadFellowshipMeetups(viewer: Viewer): Promise<FellowshipMeetupView[]> {
  if (viewer.demo) return demoMeetups();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fellowship_meetups")
    .select(
      "id,title,category,description,visibility,audience_label,starts_at,ends_at,timezone,general_location_name,general_area,family_friendly,spontaneous,capacity,host_display_name,accessibility_notes,food_notes,cost_notes,transportation_notes,recurrence_rule,weather_plan",
    )
    .in("status", ["active", "paused", "cancelled"])
    .gte("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(100);
  if (error) throw error;

  const { data: memberships } = await supabase
    .from("fellowship_meetup_members")
    .select("meetup_id,status")
    .eq("profile_id", viewer.id)
    .in("status", ["host", "interested", "going", "waitlisted"]);
  const membershipMap = new Map(
    (memberships ?? []).map((item) => [
      String(item.meetup_id),
      String(item.status) as FellowshipResponseStatus,
    ]),
  );

  return Promise.all(
    (data ?? []).map(async (row) => {
      const date = formatMeetupDate(String(row.starts_at), String(row.timezone));
      const { data: count } = await supabase.rpc("fellowship_meetup_attendee_count", {
        requested_meetup_id: row.id,
      });
      const category = String(row.category) as FellowshipCategory;
      return {
        id: String(row.id),
        title: String(row.title),
        category,
        host: String(row.host_display_name),
        hostInitial: String(row.host_display_name).slice(0, 1).toUpperCase(),
        dateLabel: date.dateLabel,
        timeLabel: date.timeLabel,
        locationName: String(row.general_location_name),
        area: String(row.general_area),
        description: String(row.description),
        audience: String(row.audience_label),
        attendeeCount: Number(count ?? 0),
        capacity: row.capacity === null ? undefined : Number(row.capacity),
        familyFriendly: Boolean(row.family_friendly),
        spontaneous: Boolean(row.spontaneous),
        exactLocationAfterJoin: true,
        tags: [
          category.replaceAll("-", " "),
          row.family_friendly ? "Kids welcome" : "Member invitation",
        ],
        startsAt: String(row.starts_at),
        endsAt: String(row.ends_at),
        visibility: String(row.visibility) as FellowshipMeetupView["visibility"],
        joinedStatus: membershipMap.get(String(row.id)) ?? null,
        accessibilityNote: row.accessibility_notes ? String(row.accessibility_notes) : null,
        foodNote: row.food_notes ? String(row.food_notes) : null,
        costNote: row.cost_notes ? String(row.cost_notes) : null,
        transportationNote: row.transportation_notes ? String(row.transportation_notes) : null,
        recurrenceLabel: row.recurrence_rule ? String(row.recurrence_rule) : null,
        weatherPlan: row.weather_plan ? String(row.weather_plan) : null,
      } satisfies FellowshipMeetupView;
    }),
  );
}

export async function loadFellowshipMeetupDetail(
  viewer: Viewer,
  id: string,
): Promise<FellowshipMeetupDetail | null> {
  const meetup = (await loadFellowshipMeetups(viewer)).find((item) => item.id === id);
  if (!meetup) return null;
  if (viewer.demo) {
    const joined = Boolean(meetup.joinedStatus);
    return {
      meetup,
      exactMeetingInstructions: joined
        ? "Synthetic participant meeting point: follow the host’s fictional thread update."
        : null,
      virtualJoinUrl: null,
      hostContactNote: joined
        ? "Use the meetup thread rather than posting private phone numbers."
        : null,
      messages: joined
        ? [
            {
              id: "message-demo-1",
              authorProfileId: "host-demo",
              authorLabel: meetup.host,
              body: "Looking forward to seeing everyone. Please check this thread before leaving in case the weather changes.",
              createdAt: new Date().toISOString(),
            },
          ]
        : [],
    };
  }
  const supabase = await createClient();
  const [{ data: details }, { data: messages }] = await Promise.all([
    supabase
      .from("fellowship_meetup_private_details")
      .select("exact_meeting_instructions,virtual_join_url,host_contact_note")
      .eq("meetup_id", id)
      .maybeSingle(),
    supabase
      .from("fellowship_meetup_messages")
      .select("id,author_profile_id,body,created_at")
      .eq("meetup_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(200),
  ]);
  return {
    meetup,
    exactMeetingInstructions: details?.exact_meeting_instructions
      ? String(details.exact_meeting_instructions)
      : null,
    virtualJoinUrl: details?.virtual_join_url ? String(details.virtual_join_url) : null,
    hostContactNote: details?.host_contact_note ? String(details.host_contact_note) : null,
    messages: (messages ?? []).map((message) => ({
      id: String(message.id),
      authorProfileId: String(message.author_profile_id),
      authorLabel: message.author_profile_id === viewer.id ? "You" : "Meetup participant",
      body: String(message.body),
      createdAt: String(message.created_at),
    })),
  };
}
