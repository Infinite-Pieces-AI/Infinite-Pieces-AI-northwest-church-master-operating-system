import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getApiViewer } from "@/lib/auth/api-viewer";
import { createClient } from "@/lib/supabase/server";

const category = z.enum(["prayer","families","outdoors","food","service","sports","young-adults","whole-church"]);
const inputSchema = z.object({
  title: z.string().trim().min(3).max(100), category, description: z.string().trim().min(10).max(1000), visibility: z.enum(["church","ministry","group"]).default("church"),
  ministryId: z.string().uuid().nullable().optional(), groupId: z.string().uuid().nullable().optional(), audienceLabel: z.string().trim().min(2).max(80).default("Church members"),
  startsAt: z.string().refine((value) => !Number.isNaN(Date.parse(value))), endsAt: z.string().refine((value) => !Number.isNaN(Date.parse(value))), timezone: z.string().trim().min(3).max(80).default("America/New_York"),
  generalLocationName: z.string().trim().min(2).max(120), generalArea: z.string().trim().min(2).max(100).default("Lowell area"), familyFriendly: z.boolean().default(false), capacity: z.number().int().min(2).max(500).nullable().optional(), allowWaitlist: z.boolean().default(true), spontaneous: z.boolean().default(false),
  exactMeetingInstructions: z.string().trim().max(1200).optional(), virtualJoinUrl: z.string().url().max(2000).optional(), hostContactNote: z.string().trim().max(500).optional(),
  accessibilityNotes: z.string().trim().max(800).optional(), foodNotes: z.string().trim().max(800).optional(), costNotes: z.string().trim().max(500).optional(), transportationNotes: z.string().trim().max(800).optional(), recurrenceRule: z.string().trim().max(500).optional(), weatherPlan: z.string().trim().max(800).optional(),
}).superRefine((value, context) => {
  if (new Date(value.endsAt) <= new Date(value.startsAt)) context.addIssue({ code: "custom", path: ["endsAt"], message: "End time must be after start time." });
  if (value.visibility === "ministry" && !value.ministryId) context.addIssue({ code: "custom", path: ["ministryId"], message: "Select an authorized ministry." });
  if (value.visibility === "group" && !value.groupId) context.addIssue({ code: "custom", path: ["groupId"], message: "Select an authorized group." });
});

export async function POST(request: NextRequest) {
  const viewer = await getApiViewer();
  if (!viewer) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  const body: unknown = await request.json().catch(() => null);
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Check the invitation details and try again.", issues: parsed.error.issues }, { status: 400 });
  if (viewer.demo) return NextResponse.json({ id: `local-${Date.now()}`, mode: "demo" }, { status: 201 });

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", viewer.id).maybeSingle();
  const value = parsed.data;
  const { data: meetup, error } = await supabase.from("fellowship_meetups").insert({
    creator_profile_id: viewer.id, host_display_name: profile?.display_name ?? "Church member", title: value.title, category: value.category, description: value.description,
    visibility: value.visibility, ministry_id: value.visibility === "ministry" ? value.ministryId : null, group_id: value.visibility === "group" ? value.groupId : null,
    audience_label: value.audienceLabel, starts_at: new Date(value.startsAt).toISOString(), ends_at: new Date(value.endsAt).toISOString(), timezone: value.timezone,
    general_location_name: value.generalLocationName, general_area: value.generalArea, family_friendly: value.familyFriendly, capacity: value.capacity ?? null, allow_waitlist: value.allowWaitlist,
    spontaneous: value.spontaneous, status: "active", accessibility_notes: value.accessibilityNotes || null, food_notes: value.foodNotes || null, cost_notes: value.costNotes || null,
    transportation_notes: value.transportationNotes || null, recurrence_rule: value.recurrenceRule || null, weather_plan: value.weatherPlan || null,
  }).select("id").single();
  if (error || !meetup) return NextResponse.json({ message: "The invitation could not be created." }, { status: 403 });

  if (value.exactMeetingInstructions || value.virtualJoinUrl || value.hostContactNote) {
    const { error: detailError } = await supabase.from("fellowship_meetup_private_details").insert({ meetup_id: meetup.id, exact_meeting_instructions: value.exactMeetingInstructions || null, virtual_join_url: value.virtualJoinUrl || null, host_contact_note: value.hostContactNote || null, updated_by: viewer.id });
    if (detailError) return NextResponse.json({ message: "The invitation was created, but private instructions need review.", id: meetup.id }, { status: 202 });
  }
  return NextResponse.json({ id: meetup.id, mode: "database" }, { status: 201 });
}
