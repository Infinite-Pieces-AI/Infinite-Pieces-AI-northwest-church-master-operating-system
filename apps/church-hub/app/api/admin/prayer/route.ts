import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasPermission } from "@church/authorization";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;
const workflowStatuses = new Set([
  "unassigned",
  "assigned",
  "pastoral_followup",
  "safeguarding_followup",
  "closed",
]);

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
    hasPermission(viewer.roles, "safeguarding.review") ||
    hasPermission(viewer.roles, "moderation.review") ||
    hasPermission(viewer.roles, "content.publish");
  return allowed ? viewer : null;
}

export async function GET(request: Request) {
  const viewer = await authorizedViewer();
  if (!viewer)
    return NextResponse.json({ message: "Restricted prayer access is required." }, { status: 403 });
  const filter = new URL(request.url).searchParams.get("filter") ?? "open";
  const client = dynamicClient(await createClient());
  let query = client
    .from("member_prayer_requests")
    .select(
      "id,title,request_text,display_anonymous,category,sensitivity,leader_workflow_status,assigned_to,leader_note,created_at",
    )
    .or("sensitivity.neq.normal,visibility.eq.leaders_only")
    .order("created_at", { ascending: false })
    .limit(250);
  if (filter === "pastoral") query = query.eq("leader_workflow_status", "pastoral_followup");
  else if (filter === "safeguarding")
    query = query.eq("leader_workflow_status", "safeguarding_followup");
  else if (filter === "closed") query = query.eq("leader_workflow_status", "closed");
  else query = query.neq("leader_workflow_status", "closed");
  const { data, error } = await query;
  if (error)
    return NextResponse.json(
      { message: "The restricted prayer queue could not be loaded." },
      { status: 503 },
    );
  const requests = (data ?? []) as Row[];
  const ids = requests.map((row) => String(row.id));
  const ownerResult = ids.length
    ? await client
        .from("prayer_request_owners")
        .select("request_id,profile_id")
        .in("request_id", ids)
    : { data: [], error: null };
  if (ownerResult.error)
    return NextResponse.json(
      { message: "The restricted prayer queue could not be loaded." },
      { status: 503 },
    );
  const ownerRows = (ownerResult.data ?? []) as Row[];
  const profileIds = Array.from(
    new Set([
      ...ownerRows.map((row) => String(row.profile_id ?? "")).filter(Boolean),
      ...requests.map((row) => String(row.assigned_to ?? "")).filter(Boolean),
    ]),
  );
  const profilesResult = profileIds.length
    ? await client.from("profiles").select("id,display_name").in("id", profileIds)
    : { data: [], error: null };
  if (profilesResult.error)
    return NextResponse.json(
      { message: "The restricted prayer queue could not be loaded." },
      { status: 503 },
    );
  const profileMap = new Map(
    ((profilesResult.data ?? []) as Row[]).map((profile) => [
      String(profile.id),
      String(profile.display_name ?? "Member"),
    ]),
  );
  const ownerMap = new Map(
    ownerRows.map((owner) => [String(owner.request_id), String(owner.profile_id)]),
  );

  return NextResponse.json({
    requests: requests.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      requestText: String(row.request_text),
      ownerName: profileMap.get(ownerMap.get(String(row.id)) ?? "") ?? "Member",
      displayAnonymous: row.display_anonymous === true,
      sensitivity: String(row.sensitivity),
      category: String(row.category),
      workflowStatus: String(row.leader_workflow_status),
      assignedTo:
        typeof row.assigned_to === "string"
          ? (profileMap.get(row.assigned_to) ?? "Assigned leader")
          : undefined,
      leaderNote: typeof row.leader_note === "string" ? row.leader_note : undefined,
      createdAt: String(row.created_at),
    })),
  });
}

export async function POST(request: Request) {
  const viewer = await authorizedViewer();
  if (!viewer)
    return NextResponse.json({ message: "Restricted prayer access is required." }, { status: 403 });
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object")
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  const row = body as Row;
  const workflowStatus = text(row.workflowStatus, 40, true);
  if (!workflowStatuses.has(workflowStatus))
    return NextResponse.json({ message: "Unsupported workflow status." }, { status: 400 });
  const client = dynamicClient(await createClient());
  const update: Row = {
    leader_workflow_status: workflowStatus,
    leader_note: text(row.leaderNote, 3000),
    leader_reviewed_at: new Date().toISOString(),
  };
  if (workflowStatus !== "unassigned") update.assigned_to = viewer.id;
  if (workflowStatus === "closed") update.status = "archived";
  const { error } = await client
    .from("member_prayer_requests")
    .update(update)
    .eq("id", text(row.requestId, 80, true));
  if (error)
    return NextResponse.json(
      { message: "The restricted prayer workflow could not be updated." },
      { status: 400 },
    );
  return NextResponse.json({ ok: true });
}
