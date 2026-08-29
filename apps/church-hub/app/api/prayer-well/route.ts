import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

const visibilities = new Set(["church", "ministry", "group", "leaders_only", "private"]);
const categories = new Set([
  "general",
  "health",
  "family",
  "work",
  "grief",
  "faith",
  "recovery",
  "thanksgiving",
  "other",
]);
const sensitivities = new Set(["normal", "pastoral", "safeguarding"]);
const interactionTypes = new Set(["prayed", "encouragement", "scripture", "update"]);

function dynamicClient(client: Awaited<ReturnType<typeof createClient>>): SupabaseClient {
  return client as unknown as SupabaseClient;
}

function text(value: unknown, maximum: number, required = false): string | null {
  const normalized = typeof value === "string" ? value.trim().slice(0, maximum) : "";
  if (required && !normalized) throw new Error("Complete the required information.");
  return normalized || null;
}

async function loadContexts(client: SupabaseClient, viewerId: string) {
  const [ministryMembershipResult, groupMembershipResult] = await Promise.all([
    client
      .from("ministry_memberships")
      .select("ministry_id")
      .eq("profile_id", viewerId)
      .is("ended_at", null),
    client
      .from("group_memberships")
      .select("group_id")
      .eq("profile_id", viewerId)
      .is("ended_at", null),
  ]);
  if (ministryMembershipResult.error) throw ministryMembershipResult.error;
  if (groupMembershipResult.error) throw groupMembershipResult.error;

  const ministryIds = Array.from(
    new Set(
      ((ministryMembershipResult.data ?? []) as Row[])
        .map((row) => String(row.ministry_id ?? ""))
        .filter(Boolean),
    ),
  );
  const groupIds = Array.from(
    new Set(
      ((groupMembershipResult.data ?? []) as Row[])
        .map((row) => String(row.group_id ?? ""))
        .filter(Boolean),
    ),
  );

  const [ministriesResult, groupsResult] = await Promise.all([
    ministryIds.length
      ? client
          .from("ministries")
          .select("id,name")
          .in("id", ministryIds)
          .eq("active", true)
          .order("name")
      : Promise.resolve({ data: [], error: null }),
    groupIds.length
      ? client
          .from("groups")
          .select("id,name")
          .in("id", groupIds)
          .eq("status", "active")
          .order("name")
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (ministriesResult.error) throw ministriesResult.error;
  if (groupsResult.error) throw groupsResult.error;

  return {
    ministries: ((ministriesResult.data ?? []) as Row[]).map((row) => ({
      id: String(row.id),
      name: String(row.name ?? "Ministry"),
    })),
    groups: ((groupsResult.data ?? []) as Row[]).map((row) => ({
      id: String(row.id),
      name: String(row.name ?? "Group"),
    })),
  };
}

async function loadPayload(client: SupabaseClient, viewerId: string) {
  const contexts = await loadContexts(client, viewerId);
  const { data: requestData, error: requestError } = await client
    .from("member_prayer_requests")
    .select(
      "id,title,request_text,submitted_by_display,display_anonymous,visibility,ministry_id,group_id,category,sensitivity,allow_encouragement,allow_prayed_events,status,answered_summary,answered_at,created_at",
    )
    .in("status", ["open", "answered", "archived"])
    .order("created_at", { ascending: false })
    .limit(200);
  if (requestError) throw requestError;
  const requests = (requestData ?? []) as Row[];
  const ids = requests.map((request) => String(request.id));

  const [ownerResult, interactionResult] = await Promise.all([
    ids.length
      ? client.from("prayer_request_owners").select("request_id,profile_id").in("request_id", ids)
      : Promise.resolve({ data: [], error: null }),
    ids.length
      ? client
          .from("prayer_interactions")
          .select("id,request_id,created_by,interaction_type,body,created_at")
          .in("request_id", ids)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (ownerResult.error) throw ownerResult.error;
  if (interactionResult.error) throw interactionResult.error;

  const interactions = (interactionResult.data ?? []) as Row[];
  const authorIds = Array.from(
    new Set(interactions.map((interaction) => String(interaction.created_by ?? "")).filter(Boolean)),
  );
  const profileResult = authorIds.length
    ? await client.from("profiles").select("id,display_name").in("id", authorIds)
    : { data: [], error: null };
  if (profileResult.error) throw profileResult.error;
  const profileMap = new Map(
    ((profileResult.data ?? []) as Row[]).map((profile) => [
      String(profile.id),
      String(profile.display_name ?? "Member"),
    ]),
  );
  const ownedIds = new Set(
    ((ownerResult.data ?? []) as Row[])
      .filter((owner) => String(owner.profile_id) === viewerId)
      .map((owner) => String(owner.request_id)),
  );
  const ministryMap = new Map(contexts.ministries.map((row) => [row.id, row.name]));
  const groupMap = new Map(contexts.groups.map((row) => [row.id, row.name]));

  return {
    contexts,
    requests: requests.map((request) => {
      const visibility = String(request.visibility);
      const audienceLabel =
        visibility === "ministry"
          ? ministryMap.get(String(request.ministry_id ?? "")) ?? "Assigned ministry"
          : visibility === "group"
            ? groupMap.get(String(request.group_id ?? "")) ?? "Assigned group"
            : visibility === "church"
              ? "Approved church members"
              : visibility === "leaders_only"
                ? "Authorized ministry leaders"
                : "Private";
      return {
        id: String(request.id),
        title: String(request.title),
        text: String(request.request_text),
        authorName:
          request.display_anonymous === true
            ? "Anonymous member"
            : String(request.submitted_by_display ?? "Church member"),
        isMine: ownedIds.has(String(request.id)),
        anonymous: request.display_anonymous === true,
        visibility,
        audienceLabel,
        category: String(request.category),
        sensitivity: String(request.sensitivity),
        allowEncouragement: request.allow_encouragement === true,
        allowPrayed: request.allow_prayed_events === true,
        status: String(request.status),
        answeredSummary:
          typeof request.answered_summary === "string" ? request.answered_summary : undefined,
        answeredAt: typeof request.answered_at === "string" ? request.answered_at : undefined,
        createdAt: String(request.created_at),
        interactions: interactions
          .filter((interaction) => String(interaction.request_id) === String(request.id))
          .map((interaction) => ({
            id: String(interaction.id),
            type: String(interaction.interaction_type),
            authorName:
              String(interaction.created_by) === viewerId
                ? "You"
                : profileMap.get(String(interaction.created_by)) ?? "Church member",
            body: typeof interaction.body === "string" ? interaction.body : undefined,
            createdAt: String(interaction.created_at),
          })),
      };
    }),
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
    return NextResponse.json({ message: "The Prayer Well could not be loaded." }, { status: 503 });
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
    if (action === "create_request") {
      const visibility = text(row.visibility, 40, true);
      const category = text(row.category, 40, true);
      const sensitivity = text(row.sensitivity, 40, true);
      if (!visibilities.has(visibility) || !categories.has(category) || !sensitivities.has(sensitivity)) {
        throw new Error("Unsupported prayer setting.");
      }
      const contexts = await loadContexts(client, viewer.id);
      const ministryId = typeof row.ministryId === "string" ? row.ministryId : null;
      const groupId = typeof row.groupId === "string" ? row.groupId : null;
      if (visibility === "ministry" && !contexts.ministries.some((context) => context.id === ministryId)) {
        throw new Error("Choose a ministry you currently belong to.");
      }
      if (visibility === "group" && !contexts.groups.some((context) => context.id === groupId)) {
        throw new Error("Choose a group you currently belong to.");
      }
      const { error } = await client.rpc("submit_member_prayer_request", {
        p_title: text(row.title, 180, true),
        p_request_text: text(row.requestText, 5000, true),
        p_display_anonymous: row.displayAnonymous === true,
        p_visibility: visibility,
        p_ministry_id: visibility === "ministry" ? ministryId : null,
        p_group_id: visibility === "group" ? groupId : null,
        p_category: category,
        p_sensitivity: sensitivity,
        p_allow_encouragement: row.allowEncouragement === true,
        p_allow_prayed_events: row.allowPrayedEvents === true,
      });
      if (error) throw error;
    } else if (action === "add_interaction") {
      const type = text(row.type, 40, true);
      if (!interactionTypes.has(type)) throw new Error("Unsupported prayer response.");
      const { error } = await client.from("prayer_interactions").insert({
        request_id: text(row.requestId, 80, true),
        created_by: viewer.id,
        interaction_type: type,
        body: type === "prayed" ? null : text(row.body, 2500, true),
      });
      if (error) {
        if (String(error.code) === "23505" && type === "prayed") {
          throw new Error("You already marked that you prayed for this request today.");
        }
        throw error;
      }
    } else if (action === "mark_answered") {
      const { error } = await client
        .from("member_prayer_requests")
        .update({
          status: "answered",
          answered_summary: text(row.answeredSummary, 3000, true),
          answered_at: new Date().toISOString(),
        })
        .eq("id", text(row.requestId, 80, true));
      if (error) throw error;
    } else {
      return NextResponse.json({ message: "Unsupported action." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "The prayer action could not be completed." },
      { status: 400 },
    );
  }
}
