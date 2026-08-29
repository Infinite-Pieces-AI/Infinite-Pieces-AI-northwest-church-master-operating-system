import { createClient } from "@/lib/supabase/server";

type UnknownRow = Record<string, unknown>;

interface QueryResult {
  data: unknown;
  error: { message?: string } | null;
}

interface DynamicQuery extends PromiseLike<QueryResult> {
  select(columns?: string): DynamicQuery;
  eq(column: string, value: unknown): DynamicQuery;
  in(column: string, values: readonly unknown[]): DynamicQuery;
  order(column: string, options?: { ascending?: boolean }): DynamicQuery;
  limit(count: number): DynamicQuery;
}

interface DynamicClient {
  from(table: string): DynamicQuery;
}

function rows(value: unknown): UnknownRow[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is UnknownRow => Boolean(item) && typeof item === "object" && !Array.isArray(item),
      )
    : [];
}

export function value(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function recoveryOutreachBackendConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

async function query(table: string, configure: (builder: DynamicQuery) => DynamicQuery) {
  const client = (await createClient()) as unknown as DynamicClient;
  const { data, error } = await configure(client.from(table));
  if (error) throw new Error(error.message ?? `Unable to load ${table}`);
  return rows(data);
}

export interface RecoveryOutreachData {
  configured: boolean;
  resources: UnknownRow[];
  opportunities: UnknownRow[];
  inquiries: UnknownRow[];
}

export async function loadRecoveryOutreachData(): Promise<RecoveryOutreachData> {
  if (!recoveryOutreachBackendConfigured()) {
    return { configured: false, resources: [], opportunities: [], inquiries: [] };
  }
  const [resources, opportunities, inquiries] = await Promise.all([
    query("recovery_resource_organizations", (builder) =>
      builder.select("*").order("updated_at", { ascending: false }).limit(100),
    ),
    query("recovery_outreach_opportunities", (builder) =>
      builder
        .select("*")
        .in("status", ["new", "review", "resource_added", "content_queued"])
        .order("created_at", { ascending: false })
        .limit(100),
    ),
    query("recovery_support_inquiries", (builder) =>
      builder
        .select(
          "id,display_name,contact_method,requested_next_step,status,assigned_to,source_path,created_at",
        )
        .in("status", ["new", "assigned", "contacted", "scheduled"])
        .order("created_at", { ascending: false })
        .limit(100),
    ),
  ]);
  return { configured: true, resources, opportunities, inquiries };
}
