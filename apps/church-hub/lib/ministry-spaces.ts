import type { Viewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

export type UnknownRow = Record<string, unknown>;

interface QueryError {
  message?: string;
  code?: string;
}

interface QueryResult {
  data: unknown;
  error: QueryError | null;
  count?: number | null;
}

export interface DynamicQuery extends PromiseLike<QueryResult> {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): DynamicQuery;
  insert(values: UnknownRow | UnknownRow[]): DynamicQuery;
  upsert(values: UnknownRow | UnknownRow[], options?: { onConflict?: string }): DynamicQuery;
  update(values: UnknownRow): DynamicQuery;
  delete(): DynamicQuery;
  eq(column: string, value: unknown): DynamicQuery;
  neq(column: string, value: unknown): DynamicQuery;
  in(column: string, values: readonly unknown[]): DynamicQuery;
  is(column: string, value: null | boolean): DynamicQuery;
  or(filters: string): DynamicQuery;
  order(column: string, options?: { ascending?: boolean }): DynamicQuery;
  limit(count: number): DynamicQuery;
  maybeSingle(): Promise<QueryResult>;
  single(): Promise<QueryResult>;
}

interface DynamicSupabaseClient {
  from(table: string): DynamicQuery;
}

export async function createDynamicClient(): Promise<DynamicSupabaseClient> {
  return (await createClient()) as unknown as DynamicSupabaseClient;
}

export function ministryBackendConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

function rowArray(value: unknown): UnknownRow[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is UnknownRow => Boolean(item) && typeof item === "object" && !Array.isArray(item),
      )
    : [];
}

function oneRow(value: unknown): UnknownRow | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRow)
    : null;
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function booleanValue(value: unknown): boolean {
  return value === true;
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function dateValue(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

async function execute(query: DynamicQuery): Promise<UnknownRow[]> {
  const { data, error } = await query;
  if (error) throw new Error(error.message ?? "Database query failed");
  return rowArray(data);
}

export interface GiftProfileRecord {
  profileId: string;
  headline: string;
  serviceSummary: string;
  availabilityNotes: string;
  sharingScope: string;
}

export interface GiftRecord {
  id: string;
  name: string;
  category: string;
  level: string;
  willingToServe: boolean;
  willingToMentor: boolean;
}

export interface GiftResponseRecord {
  id: string;
  opportunityId: string;
  message: string;
  responseType: string;
  privateToCreator: boolean;
  createdAt: string;
}

export interface GiftOpportunityRecord {
  id: string;
  createdBy: string;
  mine: boolean;
  type: string;
  title: string;
  description: string;
  category: string;
  compensationType: string;
  priceCents: number | null;
  generalLocation: string;
  scheduleSummary: string;
  status: string;
  createdAt: string;
  responses: GiftResponseRecord[];
}

export interface GiftsWorkspace {
  configured: boolean;
  profile: GiftProfileRecord | null;
  gifts: GiftRecord[];
  opportunities: GiftOpportunityRecord[];
}

export async function loadGiftsWorkspace(viewer: Viewer): Promise<GiftsWorkspace> {
  if (viewer.demo || !ministryBackendConfigured()) {
    return { configured: false, profile: null, gifts: [], opportunities: [] };
  }
  const db = await createDynamicClient();
  const [profileResult, gifts, opportunities] = await Promise.all([
    db
      .from("member_gift_profiles")
      .select("profile_id,headline,service_summary,availability_notes,sharing_scope")
      .eq("profile_id", viewer.id)
      .maybeSingle(),
    execute(
      db
        .from("member_gifts")
        .select(
          "id,gift_name,category,experience_level,willing_to_serve,willing_to_mentor,notes,updated_at",
        )
        .eq("profile_id", viewer.id)
        .order("updated_at", { ascending: false }),
    ),
    execute(
      db
        .from("gift_opportunities")
        .select(
          "id,created_by,opportunity_type,title,description,category,compensation_type,price_cents,general_location,schedule_summary,status,created_at",
        )
        .in("status", ["open", "matched", "fulfilled"])
        .order("created_at", { ascending: false })
        .limit(100),
    ),
  ]);
  if (profileResult.error) throw new Error(profileResult.error.message ?? "Unable to load gift profile");
  const opportunityIds = opportunities.map((item) => stringValue(item.id)).filter(Boolean);
  const responses = opportunityIds.length
    ? await execute(
        db
          .from("gift_opportunity_responses")
          .select(
            "id,opportunity_id,message,response_type,private_to_creator,status,created_at",
          )
          .in("opportunity_id", opportunityIds)
          .eq("status", "active")
          .order("created_at", { ascending: true }),
      )
    : [];
  const responsesByOpportunity = new Map<string, GiftResponseRecord[]>();
  for (const item of responses) {
    const opportunityId = stringValue(item.opportunity_id);
    if (!opportunityId) continue;
    const list = responsesByOpportunity.get(opportunityId) ?? [];
    list.push({
      id: stringValue(item.id),
      opportunityId,
      message: stringValue(item.message),
      responseType: stringValue(item.response_type),
      privateToCreator: booleanValue(item.private_to_creator),
      createdAt: stringValue(item.created_at),
    });
    responsesByOpportunity.set(opportunityId, list);
  }
  const profile = oneRow(profileResult.data);
  return {
    configured: true,
    profile: profile
      ? {
          profileId: stringValue(profile.profile_id),
          headline: stringValue(profile.headline),
          serviceSummary: stringValue(profile.service_summary),
          availabilityNotes: stringValue(profile.availability_notes),
          sharingScope: stringValue(profile.sharing_scope, "church"),
        }
      : null,
    gifts: gifts.map((item) => ({
      id: stringValue(item.id),
      name: stringValue(item.gift_name),
      category: stringValue(item.category),
      level: stringValue(item.experience_level),
      willingToServe: booleanValue(item.willing_to_serve),
      willingToMentor: booleanValue(item.willing_to_mentor),
    })),
    opportunities: opportunities.map((item) => {
      const id = stringValue(item.id);
      return {
        id,
        createdBy: stringValue(item.created_by),
        mine: stringValue(item.created_by) === viewer.id,
        type: stringValue(item.opportunity_type),
        title: stringValue(item.title),
        description: stringValue(item.description),
        category: stringValue(item.category),
        compensationType: stringValue(item.compensation_type),
        priceCents: typeof item.price_cents === "number" ? item.price_cents : null,
        generalLocation: stringValue(item.general_location),
        scheduleSummary: stringValue(item.schedule_summary),
        status: stringValue(item.status),
        createdAt: stringValue(item.created_at),
        responses: responsesByOpportunity.get(id) ?? [],
      };
    }),
  };
}

export interface PrayerSupportRecord {
  id: string;
  requestId: string;
  type: string;
  message: string;
  requesterOnly: boolean;
  createdAt: string;
}

export interface PrayerRequestRecord {
  id: string;
  mine: boolean;
  title: string;
  requestText: string;
  displayMode: string;
  privacyScope: string;
  status: string;
  allowEncouragement: boolean;
  answerTestimony: string;
  createdAt: string;
  prayedCount: number;
  supports: PrayerSupportRecord[];
}

export interface PrayerWorkspace {
  configured: boolean;
  requests: PrayerRequestRecord[];
}

export async function loadPrayerWorkspace(viewer: Viewer): Promise<PrayerWorkspace> {
  if (viewer.demo || !ministryBackendConfigured()) return { configured: false, requests: [] };
  const db = await createDynamicClient();
  const requests = await execute(
    db
      .from("prayer_requests")
      .select(
        "id,created_by,title,request_text,display_mode,privacy_scope,status,allow_encouragement,answer_testimony,created_at",
      )
      .in("status", ["open", "answered", "archived"])
      .order("created_at", { ascending: false })
      .limit(100),
  );
  const ids = requests.map((item) => stringValue(item.id)).filter(Boolean);
  const supports = ids.length
    ? await execute(
        db
          .from("prayer_support_events")
          .select(
            "id,prayer_request_id,support_type,message,requester_only,created_at",
          )
          .in("prayer_request_id", ids)
          .order("created_at", { ascending: true }),
      )
    : [];
  const supportByRequest = new Map<string, PrayerSupportRecord[]>();
  for (const item of supports) {
    const requestId = stringValue(item.prayer_request_id);
    if (!requestId) continue;
    const list = supportByRequest.get(requestId) ?? [];
    list.push({
      id: stringValue(item.id),
      requestId,
      type: stringValue(item.support_type),
      message: stringValue(item.message),
      requesterOnly: booleanValue(item.requester_only),
      createdAt: stringValue(item.created_at),
    });
    supportByRequest.set(requestId, list);
  }
  return {
    configured: true,
    requests: requests.map((item) => {
      const id = stringValue(item.id);
      const requestSupports = supportByRequest.get(id) ?? [];
      return {
        id,
        mine: stringValue(item.created_by) === viewer.id,
        title: stringValue(item.title),
        requestText: stringValue(item.request_text),
        displayMode: stringValue(item.display_mode),
        privacyScope: stringValue(item.privacy_scope),
        status: stringValue(item.status),
        allowEncouragement: booleanValue(item.allow_encouragement),
        answerTestimony: stringValue(item.answer_testimony),
        createdAt: stringValue(item.created_at),
        prayedCount: requestSupports.filter((support) => support.type === "prayed").length,
        supports: requestSupports,
      };
    }),
  };
}

export interface RecoveryCurriculumRecord {
  id: string;
  weekNumber: number;
  title: string;
  summary: string;
  scriptureReferences: string[];
  leaderOutline: string;
  participantReflection: string;
  sourceKind: string;
}

export interface RecoveryWorkspace {
  configured: boolean;
  programs: UnknownRow[];
  groups: UnknownRow[];
  memberships: UnknownRow[];
  curriculum: RecoveryCurriculumRecord[];
  meetings: UnknownRow[];
  posts: UnknownRow[];
  resources: UnknownRow[];
}

export async function loadRecoveryWorkspace(viewer: Viewer): Promise<RecoveryWorkspace> {
  if (viewer.demo || !ministryBackendConfigured()) {
    return {
      configured: false,
      programs: [],
      groups: [],
      memberships: [],
      curriculum: [],
      meetings: [],
      posts: [],
      resources: [],
    };
  }
  const db = await createDynamicClient();
  const [programs, groups, memberships, curriculum, meetings, resources] = await Promise.all([
    execute(db.from("recovery_programs").select("*").eq("active", true).order("created_at")),
    execute(db.from("recovery_groups").select("*").eq("active", true).order("created_at")),
    execute(
      db
        .from("recovery_group_memberships")
        .select("*")
        .eq("profile_id", viewer.id)
        .in("status", ["pending", "active", "paused"]),
    ),
    execute(
      db
        .from("recovery_curriculum_units")
        .select("*")
        .eq("published", true)
        .order("week_number", { ascending: true }),
    ),
    execute(
      db
        .from("recovery_meetings")
        .select("*")
        .in("status", ["scheduled", "in_progress", "completed"])
        .order("starts_at", { ascending: true })
        .limit(50),
    ),
    execute(
      db
        .from("recovery_resource_organizations")
        .select("*")
        .eq("active", true)
        .eq("verification_status", "approved")
        .order("name", { ascending: true }),
    ),
  ]);
  const groupIds = memberships
    .filter((item) => stringValue(item.status) === "active")
    .map((item) => stringValue(item.group_id))
    .filter(Boolean);
  const posts = groupIds.length
    ? await execute(
        db
          .from("recovery_discussion_posts")
          .select("*")
          .in("group_id", groupIds)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(100),
      )
    : [];
  return {
    configured: true,
    programs,
    groups,
    memberships,
    curriculum: curriculum.map((item) => ({
      id: stringValue(item.id),
      weekNumber: numberValue(item.week_number),
      title: stringValue(item.title),
      summary: stringValue(item.summary),
      scriptureReferences: Array.isArray(item.scripture_references)
        ? item.scripture_references.filter((value): value is string => typeof value === "string")
        : [],
      leaderOutline: stringValue(item.leader_outline),
      participantReflection: stringValue(item.participant_reflection),
      sourceKind: stringValue(item.source_kind),
    })),
    meetings,
    posts,
    resources,
  };
}

export interface RecoveryOutreachWorkspace {
  configured: boolean;
  resources: UnknownRow[];
  opportunities: UnknownRow[];
  inquiries: UnknownRow[];
}

export async function loadRecoveryOutreachWorkspace(): Promise<RecoveryOutreachWorkspace> {
  if (!ministryBackendConfigured()) {
    return { configured: false, resources: [], opportunities: [], inquiries: [] };
  }
  const db = await createDynamicClient();
  const [resources, opportunities, inquiries] = await Promise.all([
    execute(
      db
        .from("recovery_resource_organizations")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(100),
    ),
    execute(
      db
        .from("recovery_outreach_opportunities")
        .select("*")
        .in("status", ["new", "review", "resource_added", "content_queued"])
        .order("created_at", { ascending: false })
        .limit(100),
    ),
    execute(
      db
        .from("recovery_support_inquiries")
        .select("id,display_name,contact_method,requested_next_step,status,assigned_to,source_path,created_at")
        .in("status", ["new", "assigned", "contacted", "scheduled"])
        .order("created_at", { ascending: false })
        .limit(100),
    ),
  ]);
  return { configured: true, resources, opportunities, inquiries };
}

export { dateValue, stringValue };
