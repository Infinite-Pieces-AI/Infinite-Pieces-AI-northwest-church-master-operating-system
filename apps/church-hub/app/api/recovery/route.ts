import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasPermission } from "@church/authorization";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

type RecoveryRole = "participant" | "peer_support" | "leader" | "admin";

const progressStatuses = new Set(["not_started", "in_progress", "completed", "skipped"]);
const postTypes = new Set([
  "announcement",
  "discussion",
  "encouragement",
  "resource",
  "meeting_update",
]);
const requestedRoles = new Set(["participant", "peer_support"]);
const displayModes = new Set(["first_name", "initials", "private"]);

function dynamicClient(client: Awaited<ReturnType<typeof createClient>>): SupabaseClient {
  return client as unknown as SupabaseClient;
}

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

function canOperateRecovery(roles: Parameters<typeof hasPermission>[0]): boolean {
  return (
    hasPermission(roles, "content.draft") ||
    hasPermission(roles, "moderation.review") ||
    hasPermission(roles, "safeguarding.review")
  );
}

async function membershipForViewer(client: SupabaseClient, viewerId: string) {
  const { data, error } = await client
    .from("recovery_memberships")
    .select("program_id,membership_role,display_mode")
    .eq("profile_id", viewerId)
    .is("ended_at", null)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Row | null;
}

async function programForPrivilegedViewer(client: SupabaseClient) {
  const { data, error } = await client
    .from("recovery_programs")
    .select("id")
    .in("status", ["active", "paused", "draft"])
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Row | null;
}

async function loadRequestablePrograms(client: SupabaseClient) {
  const { data, error } = await client.rpc("list_requestable_recovery_programs");
  if (error) throw error;
  return ((data ?? []) as Row[]).map((row) => ({
    id: String(row.id),
    displayName: String(row.display_name ?? "Recovery Ministry"),
    publicSummary: String(row.public_summary ?? "Adult church-based peer support."),
    programType: String(row.program_type ?? "custom"),
    officialProgramConfirmation: row.official_program_confirmation === true,
  }));
}

async function loadOwnRequests(client: SupabaseClient, viewerId: string) {
  const { data, error } = await client
    .from("recovery_membership_requests")
    .select(
      "id,program_id,requested_role,display_mode,status,reason,review_note,created_at,reviewed_at,expires_at",
    )
    .eq("profile_id", viewerId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return ((data ?? []) as Row[]).map((row) => ({
    id: String(row.id),
    programId: String(row.program_id),
    requestedRole: String(row.requested_role),
    displayMode: String(row.display_mode),
    status: String(row.status),
    reason: typeof row.reason === "string" ? row.reason : undefined,
    reviewNote: typeof row.review_note === "string" ? row.review_note : undefined,
    createdAt: String(row.created_at),
    reviewedAt: typeof row.reviewed_at === "string" ? row.reviewed_at : undefined,
    expiresAt: String(row.expires_at),
  }));
}

async function loadPendingRequests(client: SupabaseClient, programId: string) {
  const { data, error } = await client
    .from("recovery_membership_requests")
    .select(
      "id,program_id,profile_id,requested_role,display_mode,reason,status,created_at,expires_at",
    )
    .eq("program_id", programId)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw error;
  const rows = (data ?? []) as Row[];
  const profileIds = Array.from(
    new Set(rows.map((row) => String(row.profile_id ?? "")).filter(Boolean)),
  );
  const profileResult = profileIds.length
    ? await client.from("profiles").select("id,display_name,email").in("id", profileIds)
    : { data: [], error: null };
  if (profileResult.error) throw profileResult.error;
  const profiles = new Map(
    ((profileResult.data ?? []) as Row[]).map((profile) => [
      String(profile.id),
      {
        displayName: String(profile.display_name ?? "Member"),
        email: typeof profile.email === "string" ? profile.email : undefined,
      },
    ]),
  );
  return rows.map((row) => ({
    id: String(row.id),
    programId: String(row.program_id),
    profileId: String(row.profile_id),
    displayName: profiles.get(String(row.profile_id))?.displayName ?? "Member",
    email: profiles.get(String(row.profile_id))?.email,
    requestedRole: String(row.requested_role),
    displayMode: String(row.display_mode),
    reason: typeof row.reason === "string" ? row.reason : undefined,
    createdAt: String(row.created_at),
    expiresAt: String(row.expires_at),
  }));
}

async function loadPrivateProgram(
  client: SupabaseClient,
  viewerId: string,
  programId: string,
  membershipRole: RecoveryRole,
) {
  const [programResult, sessionResult, progressResult, postResult] = await Promise.all([
    client
      .from("recovery_programs")
      .select(
        "id,display_name,program_type,official_program_confirmation,public_summary,meeting_day,meeting_time,general_location,status",
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
  const canLead = membershipRole === "leader" || membershipRole === "admin";

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
          status: String(programRow.status),
        }
      : null,
    membershipRole,
    sessions: sessionRows.map((session) => ({
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
    })),
    posts: postRows
      .filter((post) => !post.leader_only || canLead)
      .map((post) => ({
        id: String(post.id),
        type: String(post.post_type),
        title: String(post.title),
        body: String(post.body),
        authorName:
          String(post.created_by) === viewerId
            ? "You"
            : (profileMap.get(String(post.created_by)) ?? "Participant"),
        createdAt: String(post.created_at),
        leaderOnly: post.leader_only === true,
        comments: commentRows
          .filter((comment) => String(comment.post_id) === String(post.id))
          .map((comment) => ({
            id: String(comment.id),
            authorName:
              String(comment.created_by) === viewerId
                ? "You"
                : (profileMap.get(String(comment.created_by)) ?? "Participant"),
            body: String(comment.body),
            createdAt: String(comment.created_at),
          })),
      })),
  };
}

async function loadPayload(
  client: SupabaseClient,
  viewer: NonNullable<Awaited<ReturnType<typeof getViewer>>>,
) {
  const [requestablePrograms, membershipRequests, membership] = await Promise.all([
    loadRequestablePrograms(client),
    loadOwnRequests(client, viewer.id),
    membershipForViewer(client, viewer.id),
  ]);

  let programId: string | null = membership ? String(membership.program_id) : null;
  let membershipRole: RecoveryRole | null = membership
    ? (String(membership.membership_role) as RecoveryRole)
    : null;

  if (!programId && canOperateRecovery(viewer.roles)) {
    const privilegedProgram = await programForPrivilegedViewer(client);
    if (privilegedProgram) {
      programId = String(privilegedProgram.id);
      membershipRole = "admin";
    }
  }

  if (!programId || !membershipRole) {
    return {
      program: null,
      membershipRole: null,
      sessions: [],
      posts: [],
      requestablePrograms,
      membershipRequests,
      pendingMembershipRequests: [],
    };
  }

  const privateProgram = await loadPrivateProgram(
    client,
    viewer.id,
    programId,
    membershipRole,
  );
  const pendingMembershipRequests =
    membershipRole === "leader" || membershipRole === "admin"
      ? await loadPendingRequests(client, programId)
      : [];

  return {
    ...privateProgram,
    requestablePrograms,
    membershipRequests,
    pendingMembershipRequests,
  };
}

export async function GET() {
  const viewer = await getViewer();
  if (!viewer || viewer.demo) {
    return NextResponse.json(
      { message: "A real signed-in member account is required." },
      { status: 401 },
    );
  }
  try {
    const client = dynamicClient(await createClient());
    return NextResponse.json(await loadPayload(client, viewer));
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
      { message: "A real signed-in member account is required." },
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
    if (action === "request_membership") {
      const requestedRole = text(row.requestedRole, 40, true);
      const displayMode = text(row.displayMode, 40, true);
      if (!requestedRoles.has(requestedRole) || !displayModes.has(displayMode)) {
        throw new Error("Unsupported recovery access request.");
      }
      const { error } = await client.rpc("request_recovery_membership", {
        p_program_id: text(row.programId, 80, true),
        p_requested_role: requestedRole,
        p_display_mode: displayMode,
        p_reason: text(row.reason, 2000),
      });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "withdraw_membership_request") {
      const { error } = await client
        .from("recovery_membership_requests")
        .update({ status: "withdrawn" })
        .eq("id", text(row.requestId, 80, true))
        .eq("profile_id", viewer.id)
        .eq("status", "pending");
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "review_membership_request") {
      const decision = text(row.decision, 40, true);
      if (decision !== "approved" && decision !== "declined") {
        throw new Error("Unsupported membership decision.");
      }
      const { error } = await client.rpc("review_recovery_membership_request", {
        p_request_id: text(row.requestId, 80, true),
        p_decision: decision,
        p_review_note: text(row.reviewNote, 2000),
      });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    const membership = await membershipForViewer(client, viewer.id);
    let programId = membership ? String(membership.program_id) : null;
    let role: RecoveryRole | null = membership
      ? (String(membership.membership_role) as RecoveryRole)
      : null;
    if (!programId && canOperateRecovery(viewer.roles)) {
      const privilegedProgram = await programForPrivilegedViewer(client);
      if (privilegedProgram) {
        programId = String(privilegedProgram.id);
        role = "admin";
      }
    }
    if (!programId || !role) throw new Error("Recovery Ministry membership is required.");
    const canLead = role === "leader" || role === "admin";

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
      if (leaderOnly && !canLead) throw new Error("Leader access is required.");
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
      if (!canLead) throw new Error("Leader access is required.");
      const week = Math.max(1, Math.min(260, Math.round(Number(row.week ?? 0))));
      const { error } = await client.from("recovery_sessions").insert({
        program_id: programId,
        series_key: "recovery_journey",
        week_number: week,
        title: text(row.title, 180, true),
        participant_summary: text(row.summary, 3000, true),
        scripture_references: stringList(row.scriptureReferences),
        licensed_resource_url: text(row.resourceUrl, 2000),
        scheduled_for: text(row.scheduledFor, 80),
        status: "published",
        created_by: viewer.id,
      });
      if (error) throw error;
    } else {
      return NextResponse.json({ message: "Unsupported action." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "The recovery action failed." },
      { status: 400 },
    );
  }
}
