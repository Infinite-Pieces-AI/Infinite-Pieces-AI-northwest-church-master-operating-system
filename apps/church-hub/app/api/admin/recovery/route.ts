import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasPermission } from "@church/authorization";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;
const programStatuses = new Set(["draft", "active", "paused", "retired"]);
const decisions = new Set(["approved", "declined"]);

function dynamicClient(client: Awaited<ReturnType<typeof createClient>>): SupabaseClient {
  return client as unknown as SupabaseClient;
}

function text(value: unknown, maximum: number, required = false): string | null {
  const normalized = typeof value === "string" ? value.trim().slice(0, maximum) : "";
  if (required && !normalized) throw new Error("Complete the required information.");
  return normalized || null;
}

async function authorizedViewer() {
  const viewer = await getViewer();
  if (!viewer || viewer.demo) return null;
  const allowed =
    hasPermission(viewer.roles, "content.draft") ||
    hasPermission(viewer.roles, "safeguarding.review") ||
    hasPermission(viewer.roles, "moderation.review");
  return allowed ? viewer : null;
}

async function loadPayload(client: SupabaseClient) {
  const { data: programData, error: programError } = await client
    .from("recovery_programs")
    .select("id,display_name,program_type,official_program_confirmation,public_summary,meeting_day,meeting_time,general_location,status")
    .order("created_at", { ascending: false });
  if (programError) throw programError;
  const programs = (programData ?? []) as Row[];
  const programIds = programs.map((program) => String(program.id));

  const [membershipResult, sessionResult, accessResult] = await Promise.all([
    programIds.length
      ? client
          .from("recovery_memberships")
          .select("program_id,profile_id,membership_role,ended_at")
          .in("program_id", programIds)
          .is("ended_at", null)
      : Promise.resolve({ data: [], error: null }),
    programIds.length
      ? client
          .from("recovery_sessions")
          .select("program_id,id,status")
          .in("program_id", programIds)
      : Promise.resolve({ data: [], error: null }),
    programIds.length
      ? client
          .from("recovery_access_requests")
          .select("id,program_id,profile_id,request_message,status,created_at")
          .in("program_id", programIds)
          .order("created_at", { ascending: false })
          .limit(250)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (membershipResult.error) throw membershipResult.error;
  if (sessionResult.error) throw sessionResult.error;
  if (accessResult.error) throw accessResult.error;

  const accessRows = (accessResult.data ?? []) as Row[];
  const profileIds = Array.from(
    new Set(accessRows.map((request) => String(request.profile_id ?? "")).filter(Boolean)),
  );
  const profileResult = profileIds.length
    ? await client.from("profiles").select("id,display_name").in("id", profileIds)
    : { data: [], error: null };
  if (profileResult.error) throw profileResult.error;
  const profileMap = new Map(
    ((profileResult.data ?? []) as Row[]).map((profile) => [
      String(profile.id),
      String(profile.display_name ?? "Member"),
    ]),
  );
  const programNameMap = new Map(
    programs.map((program) => [String(program.id), String(program.display_name)]),
  );

  return {
    programs: programs.map((program) => ({
      id: String(program.id),
      displayName: String(program.display_name),
      programType: String(program.program_type),
      officialProgramConfirmation: program.official_program_confirmation === true,
      publicSummary: String(program.public_summary),
      meetingDay: typeof program.meeting_day === "string" ? program.meeting_day : undefined,
      meetingTime: typeof program.meeting_time === "string" ? program.meeting_time : undefined,
      generalLocation:
        typeof program.general_location === "string" ? program.general_location : undefined,
      status: String(program.status),
      participantCount: ((membershipResult.data ?? []) as Row[]).filter(
        (membership) => String(membership.program_id) === String(program.id),
      ).length,
      sessionCount: ((sessionResult.data ?? []) as Row[]).filter(
        (session) =>
          String(session.program_id) === String(program.id) &&
          ["published", "completed"].includes(String(session.status)),
      ).length,
    })),
    accessRequests: accessRows.map((request) => ({
      id: String(request.id),
      programId: String(request.program_id),
      programName: programNameMap.get(String(request.program_id)) ?? "Recovery Ministry",
      profileName: profileMap.get(String(request.profile_id)) ?? "Member",
      requestMessage:
        typeof request.request_message === "string" ? request.request_message : undefined,
      status: String(request.status),
      createdAt: String(request.created_at),
    })),
  };
}

export async function GET() {
  const viewer = await authorizedViewer();
  if (!viewer) return NextResponse.json({ message: "Recovery leader access is required." }, { status: 403 });
  try {
    return NextResponse.json(await loadPayload(dynamicClient(await createClient())));
  } catch {
    return NextResponse.json({ message: "Recovery administration could not be loaded." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const viewer = await authorizedViewer();
  if (!viewer) return NextResponse.json({ message: "Recovery leader access is required." }, { status: 403 });
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  const row = body as Row;
  const action = text(row.action, 80, true);
  const client = dynamicClient(await createClient());

  try {
    if (action === "create_program") {
      const official = row.officialProgramConfirmation === true;
      const programType = official ? "celebrate_recovery" : "custom";
      const displayName = text(row.displayName, 160, true);
      if (programType === "celebrate_recovery" && !official) {
        throw new Error("Official program confirmation is required.");
      }
      const { data: program, error } = await client
        .from("recovery_programs")
        .insert({
          display_name: displayName,
          program_type: programType,
          official_program_confirmation: official,
          public_summary: text(row.publicSummary, 3000, true),
          meeting_day: text(row.meetingDay, 40),
          meeting_time: text(row.meetingTime, 20),
          general_location: text(row.generalLocation, 200),
          status: "active",
          created_by: viewer.id,
        })
        .select("id")
        .single();
      if (error) throw error;
      const { error: membershipError } = await client.from("recovery_memberships").insert({
        program_id: String((program as Row).id),
        profile_id: viewer.id,
        membership_role: "admin",
        display_mode: "first_name",
        consented_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
      });
      if (membershipError) throw membershipError;
    } else if (action === "review_access") {
      const decision = text(row.decision, 30, true);
      if (!decisions.has(decision)) throw new Error("Decision must be approved or declined.");
      const { error } = await client.rpc("review_recovery_access_request", {
        p_request_id: text(row.requestId, 80, true),
        p_decision: decision,
        p_note: text(row.decisionNote, 1500),
      });
      if (error) throw error;
    } else if (action === "update_program") {
      const status = text(row.status, 30, true);
      if (!programStatuses.has(status)) throw new Error("Unsupported program status.");
      const { error } = await client
        .from("recovery_programs")
        .update({ status })
        .eq("id", text(row.programId, 80, true));
      if (error) throw error;
    } else {
      return NextResponse.json({ message: "Unsupported action." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "The action could not be completed." },
      { status: 400 },
    );
  }
}
