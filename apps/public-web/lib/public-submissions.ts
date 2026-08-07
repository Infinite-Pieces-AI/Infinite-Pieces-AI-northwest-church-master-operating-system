import { createClient } from "@supabase/supabase-js";
import type { AccessRequestInput, VisitRequestInput } from "@church/validation";

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function submitVisitRequest(input: VisitRequestInput) {
  const supabase = client();
  if (!supabase) return { mode: "demo" as const, id: crypto.randomUUID() };
  const { data, error } = await supabase.rpc("submit_visit_request", {
    p_first_name: input.firstName,
    p_last_name: input.lastName,
    p_email: input.email,
    p_phone: input.phone ?? null,
    p_party_size: input.partySize,
    p_children_attending: Boolean(input.childrenAges),
    p_requested_next_step: input.requestedNextStep,
    p_message: input.message ?? null,
    p_consent_to_contact: input.communicationConsent,
    p_source_path: input.sourcePath,
    p_source_campaign: input.campaign ?? null,
    p_utm_source: null,
    p_utm_medium: null,
    p_utm_campaign: input.campaign ?? null,
    p_ip_hash: null,
  });
  if (error) throw new Error("Unable to submit visit request");
  return { mode: "database" as const, id: String(data) };
}

export async function submitAccessRequest(input: AccessRequestInput) {
  const supabase = client();
  if (!supabase) return { mode: "demo" as const, id: crypto.randomUUID() };
  const { data, error } = await supabase.rpc("submit_access_request", {
    p_first_name: input.firstName,
    p_last_name: input.lastName,
    p_email: input.email,
    p_phone: input.phone ?? null,
    p_relationship: input.relationshipToChurch,
    p_known_leader: input.knownLeader ?? null,
    p_reason: input.reason,
    p_ip_hash: null,
    p_user_agent_hash: null,
  });
  if (error) throw new Error("Unable to submit access request");
  return { mode: "database" as const, id: String(data) };
}
