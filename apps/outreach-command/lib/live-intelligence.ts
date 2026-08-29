import { createClient } from "@/lib/supabase/server";

type AnyRow = Record<string, unknown>;

type DynamicQueryResult = {
  data: unknown[] | null;
  error: unknown;
  count: number | null;
};

interface DynamicQuery extends PromiseLike<DynamicQueryResult> {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): DynamicQuery;
  order(column: string, options: { ascending: boolean }): DynamicQuery;
  limit(value: number): DynamicQuery;
  in(column: string, values: readonly unknown[]): DynamicQuery;
  or(filters: string): DynamicQuery;
}

type DynamicDatabaseClient = {
  from(table: string): DynamicQuery;
};

type QueryFilter = (query: DynamicQuery) => DynamicQuery;

export function outreachBackendConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

async function dbClient(): Promise<DynamicDatabaseClient> {
  return (await createClient()) as unknown as DynamicDatabaseClient;
}

async function rows(input: {
  table: string;
  select?: string;
  order?: string;
  ascending?: boolean;
  limit?: number;
  filters?: QueryFilter;
}): Promise<AnyRow[]> {
  if (!outreachBackendConfigured()) return [];
  const db = await dbClient();
  let query = db.from(input.table).select(input.select ?? "*");
  if (input.filters) query = input.filters(query);
  if (input.order) query = query.order(input.order, { ascending: input.ascending ?? false });
  if (input.limit) query = query.limit(input.limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AnyRow[];
}

async function count(table: string, filters?: QueryFilter): Promise<number> {
  if (!outreachBackendConfigured()) return 0;
  const db = await dbClient();
  let query = db.from(table).select("id", { count: "exact", head: true });
  if (filters) query = filters(query);
  const { count: value, error } = await query;
  if (error) throw error;
  return Number(value ?? 0);
}

export interface OutreachOverview {
  pendingAccessRequests: number;
  newVisitorRequests: number;
  radarSignals: number;
  contentReviewItems: number;
  activeCampaigns: number;
  connectorReviewItems: number;
}

export async function loadOutreachOverview(): Promise<OutreachOverview> {
  const [
    pendingAccessRequests,
    newVisitorRequests,
    radarSignals,
    contentReviewItems,
    activeCampaigns,
    connectorReviewItems,
  ] = await Promise.all([
    count("access_requests", (query) => query.in("status", ["pending", "under_review"])),
    count("visit_requests", (query) => query.in("status", ["new", "member_access_requested"])),
    count("public_conversation_signals", (query) =>
      query.in("status", ["new", "saved", "response_drafted", "content_queued"]),
    ),
    count("content_briefs", (query) => query.in("status", ["draft", "in_review"])),
    count("campaigns", (query) => query.in("status", ["approved", "active"])),
    count("outreach_source_connectors", (query) => query.in("status", ["review", "suspended"])),
  ]);
  return {
    pendingAccessRequests,
    newVisitorRequests,
    radarSignals,
    contentReviewItems,
    activeCampaigns,
    connectorReviewItems,
  };
}

export async function loadMemberAccessRequests() {
  const [accessRequests, relatedVisitorRequests] = await Promise.all([
    rows({
      table: "access_requests",
      select: "*",
      order: "created_at",
      limit: 100,
    }),
    rows({
      table: "visit_requests",
      select:
        "id,first_name,last_name,email,phone,requested_next_step,status,source_path,source_campaign,created_at,updated_at",
      filters: (query) =>
        query.or(
          "status.eq.member_access_requested,requested_next_step.eq.general_question,source_path.eq./request-member-access",
        ),
      order: "created_at",
      limit: 100,
    }),
  ]);
  return { accessRequests, relatedVisitorRequests };
}

export async function loadRadarSignals() {
  return rows({
    table: "public_conversation_signals",
    select:
      "id,source_kind,source_label,source_url,title,excerpt,published_at,locality,themes,explicit_church_request,local_relevance,church_intent,family_relevance,online_ministry_intent,freshness,reply_opportunity,content_opportunity,search_opportunity,risk_sensitivity,priority_score,recommendation,status,reviewed_at,expires_at,ingested_at",
    order: "priority_score",
    limit: 100,
  });
}

export async function loadSearchRows() {
  const [opportunities, snapshots, visibilityChecks] = await Promise.all([
    rows({
      table: "keyword_opportunities",
      select: "*",
      order: "opportunity_score",
      limit: 100,
    }),
    rows({
      table: "search_performance_snapshots",
      select:
        "snapshot_date,query,page_path,country_code,device,clicks,impressions,average_position,click_through_rate",
      order: "snapshot_date",
      limit: 250,
    }),
    rows({
      table: "ai_visibility_checks",
      select:
        "id,run_id,prompt,church_mentioned,facts_accurate,coverage_score,public_evidence_urls,evidence_excerpt,content_gap,checked_at",
      order: "checked_at",
      limit: 100,
    }),
  ]);
  return { opportunities, snapshots, visibilityChecks };
}

export async function loadGrowthRows() {
  const [funnels, channels, conversions] = await Promise.all([
    rows({
      table: "outreach_funnel_snapshots",
      select:
        "snapshot_date,funnel_key,stage_key,stage_label,aggregate_value,source_system,created_at",
      order: "snapshot_date",
      limit: 250,
    }),
    rows({
      table: "outreach_channel_attribution",
      select:
        "snapshot_date,channel_key,channel_label,aggregate_visits,aggregate_conversions,source_system,created_at",
      order: "snapshot_date",
      limit: 250,
    }),
    rows({
      table: "conversion_events",
      select: "event_name,source_path,occurred_at",
      order: "occurred_at",
      limit: 250,
    }),
  ]);
  return { funnels, channels, conversions };
}

export async function loadContentRows() {
  const [briefs, actions, socialDrafts] = await Promise.all([
    rows({
      table: "content_briefs",
      select:
        "id,title,content_type,intended_audience,status,campaign_id,created_by,reviewed_by,approved_by,created_at,updated_at",
      order: "updated_at",
      limit: 100,
    }),
    rows({
      table: "public_conversation_actions",
      select:
        "id,signal_id,action_type,rationale,status,requires_human_review,publish_automatically,created_by,reviewed_by,reviewed_at,created_at,updated_at",
      order: "updated_at",
      limit: 100,
    }),
    rows({
      table: "social_drafts",
      select:
        "id,platform,status,created_by,approved_by,approved_at,scheduled_for,published_at,created_at,updated_at",
      order: "updated_at",
      limit: 100,
    }),
  ]);
  return { briefs, actions, socialDrafts };
}

export async function loadLocalPresenceRows() {
  const [locations, templates, overrides, visibilityChecks] = await Promise.all([
    rows({
      table: "locations",
      select: "*",
      order: "created_at",
      limit: 25,
    }),
    rows({
      table: "service_templates",
      select: "*",
      order: "created_at",
      limit: 25,
    }),
    rows({
      table: "service_overrides",
      select: "*",
      order: "date",
      limit: 50,
    }),
    rows({
      table: "ai_visibility_checks",
      select: "prompt,church_mentioned,facts_accurate,coverage_score,content_gap,checked_at",
      order: "checked_at",
      limit: 50,
    }),
  ]);
  return { locations, templates, overrides, visibilityChecks };
}

export async function loadCampaignRows() {
  return rows({
    table: "campaigns",
    select:
      "id,name,objective,geography,landing_page_path,budget_usd,starts_on,ends_on,status,created_by,approved_by,approved_at,created_at,updated_at",
    order: "updated_at",
    limit: 100,
  });
}

export async function loadVisitorRows() {
  return rows({
    table: "visit_requests",
    select:
      "id,first_name,last_name,email,phone,party_size,children_attending,requested_next_step,consent_to_contact,source_path,source_campaign,utm_source,utm_medium,utm_campaign,status,assigned_to,created_at,updated_at",
    order: "created_at",
    limit: 200,
  });
}

export async function loadConnectorRows() {
  return rows({
    table: "outreach_source_connectors",
    select:
      "id,key,display_name,source_kind,purpose,base_url,allowed_hosts,publicly_accessible,requires_login,private_or_membership_only,access_bypass_required,automatic_contact,automatic_reply,automatic_publishing,retention_days,status,accountable_owner_id,terms_reviewed_by,terms_reviewed_at,last_run_at,last_run_status,created_at,updated_at",
    order: "updated_at",
    limit: 100,
  });
}

export async function loadMorningBrief() {
  const [overview, accessRequests, radar, search, visitors] = await Promise.all([
    loadOutreachOverview(),
    loadMemberAccessRequests(),
    loadRadarSignals(),
    loadSearchRows(),
    loadVisitorRows(),
  ]);
  return {
    overview,
    newestAccessRequests: accessRequests.accessRequests.slice(0, 5),
    topRadar: radar.slice(0, 5),
    topSearch: search.opportunities.slice(0, 5),
    newestVisitors: visitors.slice(0, 5),
  };
}
