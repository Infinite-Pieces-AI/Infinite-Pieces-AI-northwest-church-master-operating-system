import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasPermission } from "@church/authorization";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

const decisions = new Set(["approved", "rejected", "removed"]);

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
    !hasPermission(viewer.roles, "moderation.review")
  ) {
    return null;
  }
  return viewer;
}

async function loadQueue(client: SupabaseClient) {
  const { data, error } = await client
    .from("gift_posts")
    .select(
      "id,created_by,post_type,title,description,gift_tags,skill_tags,exchange_type,price_note,general_location,availability_text,status,moderation_status,risk_level,moderation_note,reviewed_by,reviewed_at,created_at",
    )
    .in("moderation_status", ["pending", "approved", "rejected", "removed"])
    .order("created_at", { ascending: false })
    .limit(250);
  if (error) throw error;
  const posts = (data ?? []) as Row[];
  const profileIds = Array.from(
    new Set(
      posts
        .flatMap((post) => [String(post.created_by ?? ""), String(post.reviewed_by ?? "")])
        .filter(Boolean),
    ),
  );
  const profilesResult = profileIds.length
    ? await client.from("profiles").select("id,display_name").in("id", profileIds)
    : { data: [], error: null };
  if (profilesResult.error) throw profilesResult.error;
  const profileMap = new Map(
    ((profilesResult.data ?? []) as Row[]).map((profile) => [
      String(profile.id),
      String(profile.display_name ?? "Church member"),
    ]),
  );

  return {
    posts: posts.map((post) => ({
      id: String(post.id),
      ownerName: profileMap.get(String(post.created_by)) ?? "Church member",
      postType: String(post.post_type),
      title: String(post.title),
      description: String(post.description),
      giftTags: Array.isArray(post.gift_tags) ? post.gift_tags : [],
      skillTags: Array.isArray(post.skill_tags) ? post.skill_tags : [],
      exchangeType: String(post.exchange_type),
      priceNote: typeof post.price_note === "string" ? post.price_note : undefined,
      generalLocation:
        typeof post.general_location === "string" ? post.general_location : undefined,
      availability:
        typeof post.availability_text === "string" ? post.availability_text : undefined,
      status: String(post.status),
      moderationStatus: String(post.moderation_status),
      riskLevel: String(post.risk_level ?? "standard"),
      moderationNote:
        typeof post.moderation_note === "string" ? post.moderation_note : undefined,
      reviewedBy:
        typeof post.reviewed_by === "string"
          ? profileMap.get(String(post.reviewed_by)) ?? "Authorized moderator"
          : undefined,
      reviewedAt: typeof post.reviewed_at === "string" ? post.reviewed_at : undefined,
      createdAt: String(post.created_at),
    })),
  };
}

export async function GET() {
  const viewer = await authorizedViewer();
  if (!viewer) {
    return NextResponse.json(
      { message: "MFA-verified gift moderation access is required." },
      { status: 403 },
    );
  }
  try {
    return NextResponse.json(await loadQueue(dynamicClient(await createClient())));
  } catch {
    return NextResponse.json(
      { message: "Gift moderation could not be loaded." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const viewer = await authorizedViewer();
  if (!viewer) {
    return NextResponse.json(
      { message: "MFA-verified gift moderation access is required." },
      { status: 403 },
    );
  }
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }
  const row = body as Row;
  const decision = text(row.decision, 30, true);
  if (!decisions.has(decision)) {
    return NextResponse.json({ message: "Unsupported moderation decision." }, { status: 400 });
  }

  try {
    const client = dynamicClient(await createClient());
    const { error } = await client
      .from("gift_posts")
      .update({
        moderation_status: decision,
        moderation_note: text(row.note, 2000),
        status: decision === "approved" ? "open" : decision === "removed" ? "removed" : "closed",
      })
      .eq("id", text(row.postId, 80, true));
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "The moderation decision failed." },
      { status: 400 },
    );
  }
}
