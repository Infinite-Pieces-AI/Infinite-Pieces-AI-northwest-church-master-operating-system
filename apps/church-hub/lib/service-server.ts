import "server-only";

import type { Viewer } from "@/lib/auth/viewer";
import type { ServiceOpportunityView, ServiceSignupStatus } from "@/lib/service-contract";
import { createClient } from "@/lib/supabase/server";

const demoServiceOpportunities: ServiceOpportunityView[] = [
  {
    id: "service-demo-1",
    title: "Pack community care supplies",
    summary:
      "Work side by side to prepare fictional care kits for a synthetic community-service demonstration.",
    needStatement:
      "This demo illustrates how a real opportunity would begin with a partner-confirmed community need rather than a publicity goal.",
    impactDescription:
      "The production record would describe how the approved partner uses the supplies and how impact is verified.",
    partnerName: "Synthetic Lowell Community Partner",
    dateLabel: "Saturday, August 15",
    timeLabel: "10:00 AM–12:00 PM",
    startsAt: "2026-08-15T14:00:00.000Z",
    endsAt: "2026-08-15T16:00:00.000Z",
    locationName: "Approved public service site",
    area: "Lowell",
    minimumAge: 8,
    familyFriendly: true,
    capacity: 40,
    signupCount: 18,
    memberStatus: null,
    physicalRequirements: "Seated and standing tasks are available.",
    skillsNeeded: ["No special skills", "Packing", "Organization"],
    accessibilityNote: "Accessible work surfaces and seated tasks are available in this demo.",
    suppliesNote: "All synthetic supplies are provided.",
    transportationNote:
      "The production opportunity would list approved parking and transportation help.",
    safeguardingRequirements: "Children participate with an approved guardian.",
    visibility: "members",
    canOpenThread: false,
  },
  {
    id: "service-demo-2",
    title: "Neighborhood cleanup and prayer walk",
    summary:
      "Combine a public-space cleanup with a short optional prayer for Lowell and time to meet members from other groups.",
    needStatement:
      "A real version would identify the approved area, municipal or partner guidance, safety plan, and disposal process.",
    impactDescription: "Collect litter responsibly while building relationships across groups.",
    partnerName: "Synthetic Public-Space Partner",
    dateLabel: "Saturday, August 22",
    timeLabel: "9:00–11:00 AM",
    startsAt: "2026-08-22T13:00:00.000Z",
    endsAt: "2026-08-22T15:00:00.000Z",
    locationName: "Public meeting point",
    area: "Lowell",
    minimumAge: 12,
    familyFriendly: true,
    capacity: 30,
    signupCount: 12,
    memberStatus: "interested",
    physicalRequirements:
      "Walking, bending, and carrying light bags; alternate support tasks available.",
    skillsNeeded: ["Outdoor activity", "Teamwork"],
    accessibilityNote: "Contact the service leader to select an accessible role.",
    suppliesNote: "Gloves, bags, and safety instructions are provided in the demo.",
    transportationNote: "Carpool coordination remains inside the participant thread.",
    safeguardingRequirements: "Minors remain with guardians or approved ministry leaders.",
    visibility: "members",
    canOpenThread: true,
  },
  {
    id: "service-demo-3",
    title: "Welcome-table support for a public community event",
    summary:
      "Help guests find current information, accessibility support, and approved next steps at a fictional public event.",
    needStatement:
      "The production opportunity would identify the real event, partner, role boundaries, and training required.",
    impactDescription: "Make public participation easier through clear and respectful hospitality.",
    partnerName: "Synthetic Event Partner",
    dateLabel: "Sunday, August 30",
    timeLabel: "1:00–4:00 PM",
    startsAt: "2026-08-30T17:00:00.000Z",
    endsAt: "2026-08-30T20:00:00.000Z",
    locationName: "Approved public venue",
    area: "Lowell",
    minimumAge: 16,
    familyFriendly: false,
    capacity: 12,
    signupCount: 7,
    memberStatus: null,
    physicalRequirements: "Seated and standing welcome roles available.",
    skillsNeeded: ["Hospitality", "Clear communication"],
    accessibilityNote: "Role selection can account for mobility and communication needs.",
    suppliesNote: "Training materials and approved information are provided.",
    transportationNote: "Public directions appear after the opportunity is approved.",
    safeguardingRequirements: "Follow the event’s approved public-interaction and escalation plan.",
    visibility: "members",
    canOpenThread: false,
  },
];

interface OpportunityRow {
  id: string;
  title: string;
  summary: string;
  need_statement: string;
  impact_description: string | null;
  partner_name: string | null;
  starts_at: string;
  ends_at: string;
  timezone: string;
  general_location_name: string;
  general_area: string;
  minimum_age: number | null;
  family_friendly: boolean;
  capacity: number | null;
  physical_requirements: string | null;
  skills_needed: string[] | null;
  accessibility_note: string | null;
  supplies_note: string | null;
  transportation_note: string | null;
  safeguarding_requirements: string | null;
  visibility: "public" | "members" | "ministry" | "group";
}

interface SignupRow {
  opportunity_id: string;
  profile_id: string;
  status: ServiceSignupStatus;
  party_size: number;
}

function dateLabel(value: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: timezone,
  }).format(new Date(value));
}

function timeLabel(start: string, end: string, timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  });
  return `${formatter.format(new Date(start))}–${formatter.format(new Date(end))}`;
}

export async function loadServiceOpportunities(viewer: Viewer): Promise<ServiceOpportunityView[]> {
  if (viewer.demo) return demoServiceOpportunities;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("service_opportunities")
    .select(
      "id,title,summary,need_statement,impact_description,partner_name,starts_at,ends_at,timezone,general_location_name,general_area,minimum_age,family_friendly,capacity,physical_requirements,skills_needed,accessibility_note,supplies_note,transportation_note,safeguarding_requirements,visibility",
    )
    .in("status", ["published", "full", "cancelled"])
    .gte("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(100);
  if (error) throw new Error("Service opportunities could not be loaded.");
  const rows = (data ?? []) as OpportunityRow[];
  if (!rows.length) return [];

  const ids = rows.map((row) => row.id);
  const { data: signups, error: signupError } = await supabase
    .from("service_opportunity_signups")
    .select("opportunity_id,profile_id,status,party_size")
    .in("opportunity_id", ids);
  if (signupError) throw new Error("Service signup status could not be loaded.");
  const signupRows = (signups ?? []) as SignupRow[];
  const counts = new Map<string, number>();
  const mine = new Map<string, ServiceSignupStatus>();
  for (const signup of signupRows) {
    if (signup.profile_id === viewer.id) mine.set(signup.opportunity_id, signup.status);
    if (["going", "attended"].includes(signup.status)) {
      counts.set(
        signup.opportunity_id,
        (counts.get(signup.opportunity_id) ?? 0) + Math.max(1, signup.party_size),
      );
    }
  }

  return rows.map((row) => {
    const memberStatus = mine.get(row.id) ?? null;
    return {
      id: row.id,
      title: row.title,
      summary: row.summary,
      needStatement: row.need_statement,
      impactDescription: row.impact_description,
      partnerName: row.partner_name,
      dateLabel: dateLabel(row.starts_at, row.timezone),
      timeLabel: timeLabel(row.starts_at, row.ends_at, row.timezone),
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      locationName: row.general_location_name,
      area: row.general_area,
      minimumAge: row.minimum_age,
      familyFriendly: row.family_friendly,
      capacity: row.capacity,
      signupCount: counts.get(row.id) ?? 0,
      memberStatus,
      physicalRequirements: row.physical_requirements,
      skillsNeeded: row.skills_needed ?? [],
      accessibilityNote: row.accessibility_note,
      suppliesNote: row.supplies_note,
      transportationNote: row.transportation_note,
      safeguardingRequirements: row.safeguarding_requirements,
      visibility: row.visibility,
      canOpenThread: ["going", "waitlisted", "attended"].includes(memberStatus ?? ""),
    };
  });
}
