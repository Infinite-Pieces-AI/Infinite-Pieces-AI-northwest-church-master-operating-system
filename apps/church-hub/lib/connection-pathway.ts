import type { Viewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

export type ConnectionStepKey = "visit" | "fellowship" | "bible" | "service";
export type ConnectionStepStatus = "not_started" | "completed" | "skipped";
export interface ConnectionPathwayState { status: "active" | "paused" | "completed" | "archived"; steps: Record<ConnectionStepKey, ConnectionStepStatus>; }

export async function loadConnectionPathway(viewer: Viewer): Promise<ConnectionPathwayState> {
  const fallback: ConnectionPathwayState = { status: "active", steps: { visit: "not_started", fellowship: "not_started", bible: "not_started", service: "not_started" } };
  if (viewer.demo) return fallback;
  const supabase = await createClient();
  const [{ data: enrollment }, { data: steps }] = await Promise.all([
    supabase.from("connection_pathway_enrollments").select("status").eq("profile_id", viewer.id).maybeSingle(),
    supabase.from("connection_pathway_steps").select("step_key,status").eq("profile_id", viewer.id),
  ]);
  const mapped = { ...fallback.steps };
  for (const step of steps ?? []) {
    if (["visit","fellowship","bible","service"].includes(String(step.step_key))) mapped[String(step.step_key) as ConnectionStepKey] = String(step.status) as ConnectionStepStatus;
  }
  return { status: enrollment?.status ? String(enrollment.status) as ConnectionPathwayState["status"] : "active", steps: mapped };
}
