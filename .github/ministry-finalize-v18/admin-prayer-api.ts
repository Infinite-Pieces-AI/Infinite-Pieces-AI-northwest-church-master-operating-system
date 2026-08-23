import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

const restrictedRoles = new Set(["minister", "safety_admin", "super_admin"]);
const workflowStatuses = new Set(["new", "in_review", "resolved", "archived"]);

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

async function authorizedViewer() {
  const viewer = await getViewer();
  if (
    !viewer ||
    viewer.demo ||
    viewer.aal !== "aal2" ||
    !viewer.roles.some((role) => restrictedRoles.has(role))
  ) {
    return null;
  }
  return viewer;
}

async function loadQueue(client: SupabaseClient) {
  const { data, error } = await client
    .from("prayer_requests")
    .select(
      "id,title,request_text,submitted_by_display,display_anonymous,category,sensitivity,visibility,status,leader_workflow_status,assigned_to,leader_note,leader_reviewed_at,created_at",
    )
    .or("sensitivity.neq.normal,visibility.eq.leaders_only")
    .order("created_at", { ascending: false })
    .limit(250);
  if (error) throw error;
  const requests = (data ?? []) as Row[];
  const ids = requests.map((request) => String(request.id));

  const ownerResult = ids.length
    ? await client
        .from("prayer_request_owners")
        .select("request_id,profile_id")
        .in("request_id", ids)
    : { data: [], error: null };
  if (ownerResult.error) throw ownerResult.error;
  const ownerRows = (ownerResult.data ?? []) as Row[];
  const profileIds = Array.from(
    new Set(
      [
        ...ownerRows.map((owner) => String(owner.profile_id ?? "")),
        ...requests.map((request) => String(request.assigned_to ?? "")),
      ].filter(Boolean),
    ),
  );
  const profilesResult = profileIds.length
    ? await client.from("profiles").select("id,display_name,email").in("id", profileIds)
    : { data: [], error: null };
  if (profilesResult.error) throw profilesResult.error;
  const profileMap = new Map(
    ((profilesResult.data ?? []) as Row[]).map((profile) => [String(profile.id), profile]),
  );
  const ownerMap = new Map(
    ownerRows.map((owner) => [String(owner.request_id), String(owner.profile_id)]),
  );

  return {
    requests: requests.map((request) => {
      const owner = profileMap.get(ownerMap.get(String(request.id)) ?? "");
      const assigned = profileMap.get(String(request.assigned_to ?? ""));
      return {
        id: String(request.id),
        title: String(request.title),
        requestText: String(request.request_text),
        displayName:
          request.display_anonymous === true
            ? "Anonymous in member-facing views"
            : String(request.submitted_by_display ?? owner?.display_name ?? "Member"),
        ownerName: String(owner?.display_name ?? "Member"),
        ownerEmail: typeof owner?.email === "string" ? owner.email : undefined,
        category: String(request.category),
        sensitivity: String(request.sensitivity),
        visibility: String(request.visibility),
        status: String(request.status),
        workflowStatus: String(request.leader_workflow_status ?? "new"),
        assignedTo: String(assigned?.display_name ?? "Unassigned"),
        leaderNote: typeof request.leader_note === "string" ? request.leader_note : undefined,
        leaderReviewedAt:
          typeof request.leader_reviewed_at === "string"
            ? request.leader_reviewed_at
            : undefined,
        createdAt: String(request.created_at),
      };
    }),
  };
}

export async function GET() {
  const viewer = await authorizedViewer();
  if (!viewer) {
    return NextResponse.json(
      { message: "MFA-verified restricted prayer access is required." },
      { status: 403 },
    );
  }
  try {
    return NextResponse.json(await loadQueue(dynamicClient(await createClient())));
  } catch {
    return NextResponse.json(
      { message: "Restricted prayer routing could not be loaded." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const viewer = await authorizedViewer();
  if (!viewer) {
    return NextResponse.json(
      { message: "MFA-verified restricted prayer access is required." },
      { status: 403 },
    );
  }
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }
  const row = body as Row;
  const workflowStatus = text(row.workflowStatus, 40, true);
  if (!workflowStatuses.has(workflowStatus)) {
    return NextResponse.json({ message: "Unsupported workflow status." }, { status: 400 });
  }

  try {
    const client = dynamicClient(await createClient());
    const { error } = await client
      .from("prayer_requests")
      .update({
        leader_workflow_status: workflowStatus,
        assigned_to:
          workflowStatus === "new"
            ? null
            : row.assignToMe === true
              ? viewer.id
              : undefined,
        leader_note: text(row.note, 5000),
        leader_reviewed_at: new Date().toISOString(),
      })
      .eq("id", text(row.requestId, 80, true));
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Prayer routing failed." },
      { status: 400 },
    );
  }
}
