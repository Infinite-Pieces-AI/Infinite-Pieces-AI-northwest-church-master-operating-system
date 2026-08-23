import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasPermission } from "@church/authorization";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

const giftThemes = new Set(["directional", "relational", "insight", "positional", "other"]);
const postTypes = new Set(["offer", "member_need", "church_need", "item_share"]);
const exchangeTypes = new Set(["free", "donation", "borrow", "exchange", "paid"]);

function text(value: unknown, maximum: number, required = false): string | null {
  const normalized = typeof value === "string" ? value.trim().slice(0, maximum) : "";
  if (required && !normalized) throw new Error("Complete the required information.");
  return normalized || null;
}

function stringList(value: unknown, maximum = 12): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, maximum)
    : [];
}

function dynamicClient(client: Awaited<ReturnType<typeof createClient>>): SupabaseClient {
  return client as unknown as SupabaseClient;
}

async function loadPayload(client: SupabaseClient, viewerId: string) {
  const { data: assessment, error: assessmentError } = await client
    .from("gift_assessments")
    .select("id,provider_key,provider_report_url,dominant_theme,completed_at")
    .eq("profile_id", viewerId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (assessmentError) throw assessmentError;

  const assessmentRow = assessment as Row | null;
  const assessmentId = typeof assessmentRow?.id === "string" ? assessmentRow.id : null;
  const strengthsResult = assessmentId
    ? await client
        .from("gift_strengths")
        .select("id,gift_key,gift_label,score_percent,theme")
        .eq("assessment_id", assessmentId)
        .order("score_percent", { ascending: false })
    : { data: [], error: null };
  if (strengthsResult.error) throw strengthsResult.error;

  const { data: postData, error: postError } = await client
    .from("gift_posts")
    .select("id,created_by,post_type,title,description,gift_tags,skill_tags,exchange_type,price_note,general_location,availability_text,status,created_at")
    .in("status", ["open", "matched", "fulfilled"])
    .order("created_at", { ascending: false })
    .limit(100);
  if (postError) throw postError;

  const postRows = (postData ?? []) as Row[];
  const profileIds = Array.from(
    new Set(postRows.map((row) => String(row.created_by ?? "")).filter(Boolean)),
  );
  const postIds = postRows.map((row) => String(row.id));
  const [profilesResult, responsesResult] = await Promise.all([
    profileIds.length
      ? client.from("profiles").select("id,display_name").in("id", profileIds)
      : Promise.resolve({ data: [], error: null }),
    postIds.length
      ? client
          .from("gift_post_responses")
          .select("id,post_id,profile_id,message,status,created_at")
          .in("post_id", postIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (profilesResult.error) throw profilesResult.error;
  if (responsesResult.error) throw responsesResult.error;

  const responseRows = (responsesResult.data ?? []) as Row[];
  const responseProfileIds = Array.from(
    new Set(responseRows.map((row) => String(row.profile_id ?? "")).filter(Boolean)),
  );
  const missingProfileIds = responseProfileIds.filter((id) => !profileIds.includes(id));
  const responseProfilesResult = missingProfileIds.length
    ? await client.from("profiles").select("id,display_name").in("id", missingProfileIds)
    : { data: [], error: null };
  if (responseProfilesResult.error) throw responseProfilesResult.error;

  const profileMap = new Map<string, string>();
  for (const row of [...((profilesResult.data ?? []) as Row[]), ...((responseProfilesResult.data ?? []) as Row[])]) {
    profileMap.set(String(row.id), String(row.display_name ?? "Member"));
  }

  return {
    providerKey: typeof assessmentRow?.provider_key === "string" ? assessmentRow.provider_key : undefined,
    providerReportUrl:
      typeof assessmentRow?.provider_report_url === "string" ? assessmentRow.provider_report_url : null,
    scores: ((strengthsResult.data ?? []) as Row[]).map((row) => ({
      id: String(row.gift_key ?? row.id),
      label: String(row.gift_label ?? "Gift"),
      score: Number(row.score_percent ?? 0),
      theme: String(row.theme ?? "other"),
    })),
    posts: postRows.map((row) => ({
      id: String(row.id),
      type: String(row.post_type),
      title: String(row.title),
      description: String(row.description),
      ownerName:
        String(row.created_by) === viewerId
          ? "You"
          : profileMap.get(String(row.created_by)) ?? "Church member",
      giftTags: stringList(row.gift_tags),
      skillTags: stringList(row.skill_tags),
      exchangeType: String(row.exchange_type),
      priceNote: typeof row.price_note === "string" ? row.price_note : undefined,
      generalLocation: typeof row.general_location === "string" ? row.general_location : undefined,
      availability: typeof row.availability_text === "string" ? row.availability_text : undefined,
      status: String(row.status),
      responses: responseRows
        .filter((response) => String(response.post_id) === String(row.id))
        .map((response) => ({
          id: String(response.id),
          profileName:
            String(response.profile_id) === viewerId
              ? "You"
              : profileMap.get(String(response.profile_id)) ?? "Church member",
          message: String(response.message),
          status: String(response.status),
        })),
    })),
  };
}

export async function GET() {
  const viewer = await getViewer();
  if (!viewer || viewer.demo) {
    return NextResponse.json({ message: "A real signed-in member account is required." }, { status: 401 });
  }
  try {
    const client = dynamicClient(await createClient());
    return NextResponse.json(await loadPayload(client, viewer.id));
  } catch {
    return NextResponse.json({ message: "Gifts of the Church could not be loaded." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer || viewer.demo) {
    return NextResponse.json({ message: "A real signed-in member account is required." }, { status: 401 });
  }
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }
  const row = body as Row;
  const action = text(row.action, 80, true);
  const client = dynamicClient(await createClient());

  try {
    if (action === "save_score") {
      const giftKey = text(row.id, 100, true);
      const giftLabel = text(row.label, 120, true);
      const score = Math.max(0, Math.min(100, Math.round(Number(row.score ?? 0))));
      const theme = text(row.theme, 40) ?? "other";
      if (!giftThemes.has(theme)) throw new Error("Unsupported gift theme.");
      const { data: assessment, error: assessmentError } = await client
        .from("gift_assessments")
        .upsert(
          {
            profile_id: viewer.id,
            provider_key: "manual",
            completed_at: new Date().toISOString(),
          },
          { onConflict: "profile_id,provider_key" },
        )
        .select("id")
        .single();
      if (assessmentError) throw assessmentError;
      const { error } = await client.from("gift_strengths").upsert(
        {
          assessment_id: String((assessment as Row).id),
          gift_key: giftKey,
          gift_label: giftLabel,
          score_percent: score,
          strength_band: score >= 84 ? "dominant" : score >= 50 ? "supporting" : "other",
          theme,
        },
        { onConflict: "assessment_id,gift_key" },
      );
      if (error) throw error;
    } else if (action === "create_post") {
      const postType = text(row.type, 40, true);
      const exchangeType = text(row.exchangeType, 40, true);
      if (!postTypes.has(postType) || !exchangeTypes.has(exchangeType)) {
        throw new Error("Unsupported post type.");
      }
      if (
        postType === "church_need" &&
        !(
          hasPermission(viewer.roles, "content.draft") ||
          hasPermission(viewer.roles, "group.manage_assigned")
        )
      ) {
        throw new Error("Only an approved leader may create a church need.");
      }
      const { error } = await client.from("gift_posts").insert({
        created_by: viewer.id,
        post_type: postType,
        title: text(row.title, 180, true),
        description: text(row.description, 5000, true),
        gift_tags: stringList(row.giftTags),
        skill_tags: stringList(row.skillTags),
        visibility: "church",
        exchange_type: exchangeType,
        price_note: exchangeType === "paid" ? text(row.priceNote, 300) : null,
        general_location: text(row.generalLocation, 200),
        availability_text: text(row.availability, 500),
        status: "open",
        moderation_status: "approved",
      });
      if (error) throw error;
    } else if (action === "respond") {
      const { error } = await client.from("gift_post_responses").upsert(
        {
          post_id: text(row.postId, 80, true),
          profile_id: viewer.id,
          message: text(row.message, 2000, true),
          status: "interested",
        },
        { onConflict: "post_id,profile_id" },
      );
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
