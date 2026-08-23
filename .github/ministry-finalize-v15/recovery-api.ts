import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

const progressStatuses = new Set(["not_started", "in_progress", "completed", "skipped"]);
const postTypes = new Set([
  "announcement",
  "discussion",
  "encouragement",
  "resource",
  "meeting_update",
]);

function dynamicClient(client: Awaited<ReturnType<typeof createClient>>): SupabaseClient {
  return client as unknown as SupabaseClient;
}

function text(value: unknown, maximum: number, required: true): string;
function text(value: unknown, maximum: number, required?: false): string | null;
function text(value: unknown, maximum: number, required = false): string | null {
  const normalized = typeof value === "string" ? value.trim().slice(0, maximum) : "";
  if (required && !normalized) throw new Error("Complete the required information.");
  return normalized || null;
}

function stringList(value: unknown, maximum = 20): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, maximum)
    : [];
}

async function membershipForViewer(
  client: SupabaseClient,
  viewerId: string,
  programId?: string | null,
) {
  let query = client
    .from("recovery_memberships")
    .select("program_id,membership_role")
    .eq("profile_id", viewerId)
    .is("ended_at", null);
  if (programId) query = query.eq("program_id", programId);
  const { data, error } = await query
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Row | null;
}

async function loadPayload(
  client: SupabaseClient,
  viewerId: string,
  requestedProgramId?: string | null,
) {
  const membership = await membershipForViewer(client, viewerId, requestedProgramId);
  if (!membership) {
    return { program: null, membershipRole: null, sessions: [], posts: [] };
  }
  const programId = String(membership.program_id);
  const [programResult, sessionResult, progressResult, postResult] = await Promise.all([
    client
      .from("recovery_programs")
      .select(
        "id,display_name,program_type,official_program_confirmation,public_summary,meeting_day,meeting_time,general_location",
      )
      .eq("id", programId)
      .maybeSingle(),
    client
      .from("recovery_sessions")
      .select(
        "id,week_number,title,participant_summary,scripture_references,licensed_resource_url,scheduled_for,status",
      )
      .eq("program_id", programId)
      .order("week_number", { ascending: true }),
    client
      .from("recovery_progress")
      .select("session_id,progress_status,completed_at")
      .eq("profile_id", viewerId),
    client
      .from("recovery_posts")
      .select("id,created_by,post_type,title,body,leader_only,created_at")
      .eq("program_id", programId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  if (programResult.error) throw programResult.error;
  if (sessionResult.error) throw sessionResult.error;
  if (progressResult.error) throw progressResult.error;
  if (postResult.error) throw postResult.error;

  const sessionRows = (sessionResult.data ?? []) as Row[];
  const sessionIds = sessionRows.map((session) => String(session.id));
  const guideResult = sessionIds.length
    ? await client
        .from("recovery_session_guides")
        .select("session_id,leader_agenda,safety_notes")
        .in("session_id", sessionIds)
    : { data: [], error: null };
  if (guideResult.error) throw guideResult.error;
  const guideMap = new Map(
    ((guideResult.data ?? []) as Row[]).map((guide) => [String(guide.session_id), guide]),
  );
  const progressMap = new Map(
    ((progressResult.data ?? []) as Row[]).map((row) => [
      String(row.session_id),
      String(row.progress_status),
    ]),
  );

  const postRows = (postResult.data ?? []) as Row[];
  const postIds = postRows.map((row) => String(row.id));
  const commentResult = postIds.length
    ? await client
        .from("recovery_post_comments")
        .select("id,post_id,created_by,body,created_at")
        .in("post_id", postIds)
        .eq("status", "active")
        .order("created_at", { ascending: true })
    : { data: [], error: null };
  if (commentResult.error) throw commentResult.error;
  const commentRows = (commentResult.data ?? []) as Row[];
  const profileIds = Array.from(
    new Set(
      [...postRows, ...commentRows]
        .map((row) => String(row.created_by ?? ""))
        .filter(Boolean),
    ),
  );
  const profileResult = profileIds.length
    ? await client.from("profiles").select("id,display_name").in("id", profileIds)
    : { data: [], error: null };
  if (profileResult.error) throw profileResult.error;
  const profileMap = new Map(
    ((profileResult.data ?? []) as Row[]).map((profile) => [
      String(profile.id),
      String(profile.display_name ?? "Participant"),
    ]),
  );
  const programRow = programResult.data as Row | null;

  return {
    program: programRow
      ? {
          id: String(programRow.id),
          displayName: String(programRow.display_name),
          publicSummary: String(programRow.public_summary),
          meetingDay:
            typeof programRow.meeting_day === "string" ? programRow.meeting_day : undefined,
          meetingTime:
            typeof programRow.meeting_time === "string" ? programRow.meeting_time : undefined,
          generalLocation:
            typeof programRow.general_location === "string"
              ? programRow.general_location
              : undefined,
          programType: String(programRow.program_type),
          officialProgramConfirmation: programRow.official_program_confirmation === true,
        }
      : null,
    membershipRole: String(membership.membership_role),
    sessions: sessionRows.map((session) => {
      const guide = guideMap.get(String(session.id));
      return {
        id: String(session.id),
        week: Number(session.week_number),
        title: String(session.title),
        summary: String(session.participant_summary),
        scriptureReferences: stringList(session.scripture_references),
        resourceUrl:
          typeof session.licensed_resource_url === "string"
            ? session.licensed_resource_url
            : undefined,
        scheduledFor:
          typeof session.scheduled_for === "string" ? session.scheduled_for : undefined,
        status: String(session.status),
        progress: progressMap.get(String(session.id)) ?? "not_started",
        leaderAgenda:
          typeof guide?.leader_agenda === "string" ? guide.leader_agenda : undefined,
        safetyNotes: typeof guide?.safety_notes === "string" ? guide.safety_notes : undefined,
      };
    }),
    posts: postRows.map((post) => ({
      id: String(post.id),
      type: String(post.post_type),
      title: String(post.title),
      body: String(post.body),
      authorName:
        String(post.created_by) === viewerId
          ? "You"
          : profileMap.get(String(post.created_by)) ?? "Participant",
      createdAt: String(post.created_at),
      leaderOnly: post.leader_only === true,
      comments: commentRows
        .filter((comment) => String(comment.post_id) === String(post.id))
        .map((comment) => ({
          id: String(comment.id),
          authorName:
            String(comment.created_by) === viewerId
              ? "You"
              : profileMap.get(String(comment.created_by)) ?? "Participant",
          body: String(comment.body),
          createdAt: String(comment.created_at),
        })),
    })),
  };
}

export async function GET(request: Request) {
  const viewer = await getViewer();
  if (!viewer || viewer.demo) {
    return NextResponse.json(
      { message: "A real signed-in participant account is required." },
      { status: 401 },
    );
  }
  try {
    const client = dynamicClient(await createClient());
    const programId = new URL(request.url).searchParams.get("programId");
    return NextResponse.json(await loadPayload(client, viewer.id, programId));
  } catch {
    return NextResponse.json(
      { message: "Recovery Ministry could not be loaded." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer || viewer.demo) {
    return NextResponse.json(
      { message: "A real signed-in participant account is required." },
      { status: 401 },
    );
  }
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }
  const row = body as Row;
  const action = text(row.action, 80, true);
  const client = dynamicClient(await createClient());

  try {
    const membership = await membershipForViewer(
      client,
      viewer.id,
      text(row.programId, 80),
    );
    if (!membership) throw new Error("Recovery Ministry membership is required.");
    const programId = String(membership.program_id);
    const role = String(membership.membership_role);
    const canLead =
      viewer.aal === "aal2" && (role === "leader" || role === "admin");

    if (action === "set_progress") {
      const progressStatus = text(row.progressStatus, 40, true);
      if (!progressStatuses.has(progressStatus)) {
        throw new Error("Unsupported progress status.");
      }
      const { error } = await client.from("recovery_progress").upsert(
        {
          session_id: text(row.sessionId, 80, true),
          profile_id: viewer.id,
          progress_status: progressStatus,
          completed_at: progressStatus === "completed" ? new Date().toISOString() : null,
        },
        { onConflict: "session_id,profile_id" },
      );
      if (error) throw error;
    } else if (action === "create_post") {
      const type = text(row.type, 40, true);
      if (!postTypes.has(type)) throw new Error("Unsupported post type.");
      const leaderOnly = row.leaderOnly === true;
      if (
        !canLead &&
        (leaderOnly || type === "announcement" || type === "meeting_update")
      ) {
        throw new Error(
          "Only a recovery leader may publish announcements, meeting updates, or leader-only posts.",
        );
      }
      const { error } = await client.from("recovery_posts").insert({
        program_id: programId,
        created_by: viewer.id,
        post_type: type,
        title: text(row.title, 180, true),
        body: text(row.body, 5000, true),
        leader_only: leaderOnly,
        status: "active",
      });
      if (error) throw error;
    } else if (action === "comment") {
      const { error } = await client.from("recovery_post_comments").insert({
        post_id: text(row.postId, 80, true),
        created_by: viewer.id,
        body: text(row.body, 2500, true),
        status: "active",
      });
      if (error) throw error;
    } else if (action === "create_session") {
      if (!canLead) throw new Error("MFA-verified recovery leader access is required.");
      const week = Math.max(1, Math.min(260, Math.round(Number(row.week ?? 0))));
      const { error } = await client.rpc("publish_recovery_session", {
        p_program_id: programId,
        p_series_key: "recovery_journey",
        p_week_number: week,
        p_title: text(row.title, 180, true),
        p_participant_summary: text(row.summary, 3000, true),
        p_scripture_references: stringList(row.scriptureReferences),
        p_licensed_resource_url: text(row.resourceUrl, 2000),
        p_scheduled_for: text(row.scheduledFor, 80),
        p_leader_agenda: text(row.leaderAgenda, 10000, true),
        p_safety_notes: text(row.safetyNotes, 5000),
      });
      if (error) throw error;
    } else {
      return NextResponse.json({ message: "Unsupported action." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "The recovery action could not be completed." },
      { status: 400 },
    );
  }
}
