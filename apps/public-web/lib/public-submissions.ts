import { createClient } from "@supabase/supabase-js";
import type {
  AccessRequestInput,
  PrayerRequestInput,
  PublicQuestionInput,
  VisitRequestInput,
} from "@church/validation";

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
  const { data, error } = await supabase.rpc("submit_plan_visit_request", {
    p_first_name: input.firstName,
    p_last_name: input.lastName ?? null,
    p_contact_method: input.contactMethod,
    p_email: input.email ?? null,
    p_phone: input.phone ?? null,
    p_party_size: input.partySize,
    p_children_attending: input.childrenAttending,
    p_practical_note: input.practicalNote ?? null,
    p_consent_to_contact: input.communicationConsent,
    p_source_path: input.sourcePath,
    p_source_campaign: input.campaign ?? null,
    p_ip_hash: null,
  });
  if (error) throw new Error("Unable to submit visit request");
  return { mode: "database" as const, id: String(data) };
}

export async function submitPublicQuestion(input: PublicQuestionInput) {
  const supabase = client();
  if (!supabase) return { mode: "demo" as const, id: crypto.randomUUID() };
  const { data, error } = await supabase.rpc("submit_public_question", {
    p_first_name: input.firstName,
    p_contact_method: input.contactMethod,
    p_email: input.email ?? null,
    p_phone: input.phone ?? null,
    p_topic: input.topic,
    p_message: input.message,
    p_consent_to_contact: input.communicationConsent,
    p_source_path: input.sourcePath,
    p_ip_hash: null,
  });
  if (error) throw new Error("Unable to submit question");
  return { mode: "database" as const, id: String(data) };
}

export async function submitPrayerRequest(input: PrayerRequestInput) {
  const supabase = client();
  if (!supabase) return { mode: "demo" as const, id: crypto.randomUUID() };
  const { data, error } = await supabase.rpc("submit_prayer_request", {
    p_first_name: input.firstName ?? null,
    p_prayer_text: input.prayerText,
    p_response_requested: input.responseRequested,
    p_contact_method: input.contactMethod ?? null,
    p_email: input.email ?? null,
    p_phone: input.phone ?? null,
    p_consent_to_contact: input.consentToContact,
    p_source_path: input.sourcePath,
    p_ip_hash: null,
  });
  if (error) throw new Error("Unable to submit prayer request");
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
