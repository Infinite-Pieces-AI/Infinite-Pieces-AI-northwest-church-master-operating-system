import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasPermission } from "@church/authorization";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;
const decisions = new Set(["approved", "rejected", "removed"]);
const statuses = new Set(["pending", "approved", "rejected", "removed"]);

function dynamicClient(client: Awaited<ReturnType<typeof createClient>>): SupabaseClient {
  return client as unknown as SupabaseClient;
}

function text(value: unknown, maximum: number, required = false): string | null {
  const normalized = typeof value === "string" ? value.trim().slice(0, maximum) : "";
  if (required && !normalized) throw new Error("Complete the required information.");
  return normalized || null;
}

function list(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").slice(0, 20)
    : [];
}

async function authorizedViewer() {
  const viewer = await getViewer();
  if (!viewer || viewer.demo || !hasPermission(viewer.roles, "moderation.review")) return null;
  return viewer;
}

export async function GET(request: Request) {
  const viewer = await authorizedViewer();
  if (!viewer)
    return NextResponse.json({ message: "Moderator access is required." }, { status: 403 });
  const requestedStatus = new URL(request.url).searchParams.get("status") ?? "pending";
  const status = statuses.has(requestedStatus) ? requestedStatus : "pending";
  const client = dynamicClient(await createClient());
  const { data, error } = await client
    .from("gift_posts")
    .select(
      "id,created_by,post_type,title,description,gift_tags,skill_tags,exchange_type,risk_level,moderation_status,moderation_reason,created_at",
    )
    .eq("moderation_status", status)
    .order("created_at", { ascending: false })
    .limit(250);
  if (error)
    return NextResponse.json({ message: "Gift moderation could not be loaded." }, { status: 503 });
  const rows = (data ?? []) as Row[];
  const profileIds = Array.from(
    new Set(rows.map((row) => String(row.created_by ?? "")).filter(Boolean)),
  );
  const profileResult = profileIds.length
    ? await client.from("profiles").select("id,display_name").in("id", profileIds)
    : { data: [], error: null };
  if (profileResult.error)
    return NextResponse.json({ message: "Gift moderation could not be loaded." }, { status: 503 });
  const profileMap = new Map(
    ((profileResult.data ?? []) as Row[]).map((row) => [
      String(row.id),
      String(row.display_name ?? "Member"),
    ]),
  );
  return NextResponse.json({
    posts: rows.map((row) => ({
      id: String(row.id),
      postType: String(row.post_type),
      title: String(row.title),
      description: String(row.description),
      ownerName: profileMap.get(String(row.created_by)) ?? "Member",
      exchangeType: String(row.exchange_type),
      riskLevel: String(row.risk_level ?? "standard"),
      moderationStatus: String(row.moderation_status),
      moderationReason:
        typeof row.moderation_reason === "string" ? row.moderation_reason : undefined,
      giftTags: list(row.gift_tags),
      skillTags: list(row.skill_tags),
      createdAt: String(row.created_at),
    })),
  });
}

export async function POST(request: Request) {
  const viewer = await authorizedViewer();
  if (!viewer)
    return NextResponse.json({ message: "Moderator access is required." }, { status: 403 });
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object")
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  const row = body as Row;
  const decision = text(row.decision, 30, true);
  if (!decisions.has(decision))
    return NextResponse.json({ message: "Unsupported decision." }, { status: 400 });
  const client = dynamicClient(await createClient());
  const { error } = await client
    .from("gift_posts")
    .update({
      moderation_status: decision,
      moderation_reason: text(row.moderationReason, 1000),
      reviewed_by: viewer.id,
      reviewed_at: new Date().toISOString(),
      status: decision === "approved" ? "open" : decision === "removed" ? "removed" : "draft",
    })
    .eq("id", text(row.postId, 80, true));
  if (error)
    return NextResponse.json(
      { message: "The moderation decision could not be saved." },
      { status: 400 },
    );
  return NextResponse.json({ ok: true });
}
