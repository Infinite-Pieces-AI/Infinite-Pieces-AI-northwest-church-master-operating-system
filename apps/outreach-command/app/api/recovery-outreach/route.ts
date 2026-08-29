import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getOutreachApiViewer } from "@/lib/auth/api-viewer";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

const partnerTypes = new Set([
  "treatment_provider",
  "recovery_support",
  "community_health",
  "sober_living",
  "public_agency",
  "church",
  "other",
]);
const partnerStatuses = new Set([
  "research",
  "approved_for_contact",
  "contacted",
  "conversation",
  "partner",
  "declined",
  "do_not_contact",
]);
const sourceKinds = new Set([
  "search_console",
  "public_forum",
  "public_web",
  "public_rss",
  "manual_research",
]);
const inquiryStatuses = new Set([
  "new",
  "assigned",
  "contacted",
  "conversation",
  "closed",
  "opted_out",
]);

function dynamicClient(client: Awaited<ReturnType<typeof createClient>>): SupabaseClient {
  return client as unknown as SupabaseClient;
}

function text(value: unknown, maximum: number, required = false): string | null {
  const normalized = typeof value === "string" ? value.trim().slice(0, maximum) : "";
  if (required && !normalized) throw new Error("Complete the required information.");
  return normalized || null;
}

function integer(value: unknown, minimum: number, maximum: number): number {
  const parsed = Math.round(Number(value ?? 0));
  return Math.max(minimum, Math.min(maximum, Number.isFinite(parsed) ? parsed : minimum));
}

async function loadPayload(client: SupabaseClient) {
  const [partnersResult, topicsResult, inquiriesResult] = await Promise.all([
    client
      .from("recovery_outreach_partners")
      .select(
        "id,organization_name,organization_type,public_url,public_contact,locality,partnership_status,notes,verified_public_source_at",
      )
      .order("updated_at", { ascending: false })
      .limit(250),
    client
      .from("recovery_public_topics")
      .select(
        "id,source_kind,topic,locality,public_url,aggregate_impressions,aggregate_clicks,priority_score,sensitivity_risk,recommended_action,status",
      )
      .order("priority_score", { ascending: false })
      .limit(500),
    client
      .from("recovery_interest_requests")
      .select(
        "id,first_name,contact_method,interest_type,source_path,status,assigned_to,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(250),
  ]);
  if (partnersResult.error) throw partnersResult.error;
  if (topicsResult.error) throw topicsResult.error;
  if (inquiriesResult.error) throw inquiriesResult.error;

  const inquiries = (inquiriesResult.data ?? []) as Row[];
  const assignedIds = Array.from(
    new Set(inquiries.map((inquiry) => String(inquiry.assigned_to ?? "")).filter(Boolean)),
  );
  const profilesResult = assignedIds.length
    ? await client.from("profiles").select("id,display_name").in("id", assignedIds)
    : { data: [], error: null };
  if (profilesResult.error) throw profilesResult.error;
  const profileMap = new Map(
    ((profilesResult.data ?? []) as Row[]).map((profile) => [
      String(profile.id),
      String(profile.display_name ?? "Outreach leader"),
    ]),
  );

  const partners = ((partnersResult.data ?? []) as Row[]).map((partner) => ({
    id: String(partner.id),
    organizationName: String(partner.organization_name),
    organizationType: String(partner.organization_type),
    publicUrl: String(partner.public_url),
    publicContact: typeof partner.public_contact === "string" ? partner.public_contact : undefined,
    locality: String(partner.locality),
    partnershipStatus: String(partner.partnership_status),
    notes: typeof partner.notes === "string" ? partner.notes : undefined,
    verifiedPublicSourceAt:
      typeof partner.verified_public_source_at === "string"
        ? partner.verified_public_source_at
        : undefined,
  }));
  const topics = ((topicsResult.data ?? []) as Row[]).map((topic) => ({
    id: String(topic.id),
    sourceKind: String(topic.source_kind),
    topic: String(topic.topic),
    locality: String(topic.locality),
    publicUrl: typeof topic.public_url === "string" ? topic.public_url : undefined,
    impressions:
      typeof topic.aggregate_impressions === "number" ? topic.aggregate_impressions : undefined,
    clicks: typeof topic.aggregate_clicks === "number" ? topic.aggregate_clicks : undefined,
    opportunityScore: Number(topic.priority_score ?? 0),
    sensitivityScore: Number(topic.sensitivity_risk ?? 0),
    recommendedAction:
      typeof topic.recommended_action === "string" ? topic.recommended_action : undefined,
    status: String(topic.status),
  }));
  const inquiryRows = inquiries.map((inquiry) => ({
    id: String(inquiry.id),
    firstName: String(inquiry.first_name),
    preferredContact: String(inquiry.contact_method),
    requestedNextStep: String(inquiry.interest_type),
    sourcePath: String(inquiry.source_path),
    status: String(inquiry.status),
    assignedTo:
      typeof inquiry.assigned_to === "string"
        ? (profileMap.get(inquiry.assigned_to) ?? "Assigned leader")
        : undefined,
    createdAt: String(inquiry.created_at),
  }));

  return {
    partners,
    topics,
    inquiries: inquiryRows,
    counts: {
      publicOrganizations: partners.length,
      publicTopics: topics.length,
      newInquiries: inquiryRows.filter((inquiry) => inquiry.status === "new").length,
      approvedPartners: partners.filter((partner) => partner.partnershipStatus === "partner")
        .length,
    },
  };
}

export async function GET() {
  const viewer = await getOutreachApiViewer();
  if (!viewer) {
    return NextResponse.json(
      { message: "MFA-verified Outreach access is required." },
      { status: 401 },
    );
  }
  try {
    return NextResponse.json(await loadPayload(dynamicClient(await createClient())));
  } catch {
    return NextResponse.json(
      { message: "Recovery Outreach could not be loaded." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const viewer = await getOutreachApiViewer();
  if (!viewer) {
    return NextResponse.json(
      { message: "MFA-verified Outreach access is required." },
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
    if (action === "add_partner") {
      const organizationType = text(row.organizationType, 50, true);
      if (!partnerTypes.has(organizationType)) throw new Error("Unsupported organization type.");
      const publicUrl = text(row.publicUrl, 2000, true);
      if (!publicUrl?.startsWith("https://")) throw new Error("Use a verified public HTTPS URL.");
      const { error } = await client.from("recovery_outreach_partners").insert({
        organization_name: text(row.organizationName, 180, true),
        organization_type: organizationType,
        public_url: publicUrl,
        public_contact: text(row.publicContact, 300),
        locality: text(row.locality, 160, true),
        partnership_status: "research",
        notes: text(row.notes, 2000),
        verified_public_source_at: new Date().toISOString(),
        created_by: viewer.id,
      });
      if (error) throw error;
    } else if (action === "update_partner") {
      const status = text(row.partnershipStatus, 50, true);
      if (!partnerStatuses.has(status)) throw new Error("Unsupported partnership status.");
      const partnerId = text(row.partnerId, 80, true);
      const { error } = await client
        .from("recovery_outreach_partners")
        .update({ partnership_status: status })
        .eq("id", partnerId);
      if (error) throw error;
      const actionType =
        status === "approved_for_contact"
          ? "approve_contact"
          : status === "contacted"
            ? "contact_attempt"
            : status === "conversation"
              ? "conversation"
              : status === "partner"
                ? "partnership"
                : status === "declined"
                  ? "decline"
                  : status === "do_not_contact"
                    ? "do_not_contact"
                    : "research_note";
      const { error: actionError } = await client.from("recovery_outreach_partner_actions").insert({
        partner_id: partnerId,
        action_type: actionType,
        note: "Status updated through Recovery Outreach.",
        created_by: viewer.id,
      });
      if (actionError) throw actionError;
    } else if (action === "add_topic") {
      const sourceKind = text(row.sourceKind, 50, true);
      if (!sourceKinds.has(sourceKind)) throw new Error("Unsupported public source type.");
      const publicUrl = text(row.publicUrl, 2000);
      if (publicUrl && !publicUrl.startsWith("https://"))
        throw new Error("Public sources must use HTTPS.");
      const { error } = await client.from("recovery_public_topics").insert({
        source_kind: sourceKind,
        topic: text(row.topic, 300, true),
        locality: text(row.locality, 160, true),
        public_url: publicUrl,
        aggregate_impressions:
          typeof row.impressions === "number" ? Math.max(0, Math.round(row.impressions)) : null,
        aggregate_clicks:
          typeof row.clicks === "number" ? Math.max(0, Math.round(row.clicks)) : null,
        priority_score: integer(row.opportunityScore, 0, 100),
        sensitivity_risk: integer(row.sensitivityScore, 0, 100),
        recommended_action: text(row.recommendedAction, 2000),
        status: "new",
      });
      if (error) throw error;
    } else if (action === "update_inquiry") {
      const status = text(row.status, 40, true);
      if (!inquiryStatuses.has(status)) throw new Error("Unsupported inquiry status.");
      const update: Row = { status };
      if (status === "assigned") update.assigned_to = viewer.id;
      const { error } = await client
        .from("recovery_interest_requests")
        .update(update)
        .eq("id", text(row.inquiryId, 80, true));
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
