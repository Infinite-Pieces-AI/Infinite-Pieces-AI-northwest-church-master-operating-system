import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface WorkerContext {
  workerName: string;
  runId: string;
  dryRun: boolean;
  supabase: SupabaseClient;
  log: (event: string, details?: Record<string, unknown>) => void;
}

export function requireServerEnvironment(): { url: string; serviceRoleKey: string; dryRun: boolean } {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("Workers require server-only SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) throw new Error("A service-role key must never use a NEXT_PUBLIC_ prefix.");
  return { url, serviceRoleKey, dryRun: process.env.WORKER_DRY_RUN !== "false" };
}

export async function runWorker(
  workerName: string,
  handler: (context: WorkerContext) => Promise<Record<string, unknown> | void>
): Promise<void> {
  const { url, serviceRoleKey, dryRun } = requireServerEnvironment();
  const runId = crypto.randomUUID();
  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const log = (event: string, details: Record<string, unknown> = {}) => {
    process.stdout.write(`${JSON.stringify({ timestamp: new Date().toISOString(), workerName, runId, event, dryRun, ...details })}\n`);
  };
  log("worker.started");
  try {
    const result = await handler({ workerName, runId, dryRun, supabase, log });
    log("worker.completed", result ?? {});
  } catch (error) {
    log("worker.failed", { error: error instanceof Error ? error.message : "Unknown worker failure" });
    process.exitCode = 1;
  }
}

export async function claimOutboxEvents(
  context: WorkerContext,
  eventTypes: readonly string[],
  limit = 25
): Promise<Array<{ id: string; event_type: string; payload: Record<string, unknown>; attempts: number }>> {
  if (limit < 1 || limit > 100) throw new Error("Outbox claim limit must be between 1 and 100");
  if (eventTypes.length === 0) return [];

  if (context.dryRun) {
    const { data, error } = await context.supabase
      .from("outbox_events")
      .select("id,event_type,payload,attempts")
      .in("event_type", [...eventTypes])
      .eq("status", "pending")
      .lte("available_at", new Date().toISOString())
      .order("available_at", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) throw error;
    context.log("outbox.dry_run_inspection", { eventTypes, count: data?.length ?? 0 });
    return (data ?? []) as Array<{ id: string; event_type: string; payload: Record<string, unknown>; attempts: number }>;
  }

  const { data, error } = await context.supabase.rpc("claim_outbox_events", {
    requested_event_types: eventTypes,
    requested_limit: limit,
    worker_id: `${context.workerName}:${context.runId}`
  });
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; event_type: string; payload: Record<string, unknown>; attempts: number }>;
}

export async function completeOutboxEvent(context: WorkerContext, id: string): Promise<void> {
  if (context.dryRun) {
    context.log("outbox.would_complete", { id });
    return;
  }
  const { error } = await context.supabase.rpc("complete_outbox_event", { requested_id: id });
  if (error) throw error;
}

export async function failOutboxEvent(context: WorkerContext, id: string, message: string): Promise<void> {
  if (context.dryRun) {
    context.log("outbox.would_fail", { id, message });
    return;
  }
  const { error } = await context.supabase.rpc("fail_outbox_event", { requested_id: id, failure_message: message });
  if (error) throw error;
}
