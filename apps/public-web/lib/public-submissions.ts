import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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

export function publicSubmissionDemoEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO === "false") return false;
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO === "true") return true;
  return process.env.NODE_ENV !== "production";
}

export function getPublicSubmissionAdminClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function normalizeOptionalText(value: unknown, maximumLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value
    .trim()
    .replace(/\u0000/g, "")
    .slice(0, maximumLength);
  return normalized || null;
}

export function normalizeRequiredText(value: unknown, maximumLength: number): string {
  const normalized = normalizeOptionalText(value, maximumLength);
  if (!normalized) throw new Error("Complete the required information before sending.");
  return normalized;
}

export function normalizeEmail(value: unknown): string | null {
  const normalized = normalizeOptionalText(value, 254)?.toLowerCase() ?? null;
  if (!normalized) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Enter a valid email address.");
  }
  return normalized;
}

export function normalizePhone(value: unknown): string | null {
  const normalized = normalizeOptionalText(value, 40);
  if (!normalized) return null;
  const digits = normalized.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) throw new Error("Enter a valid phone number.");
  return normalized;
}

export function normalizeBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true" || value === "on";
}

export function honeypotClear(value: unknown): boolean {
  return normalizeOptionalText(value, 200) === null;
}

function allowedPublicOrigins(): Set<string> {
  const values = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_PUBLIC_SITE_URL,
    process.env.PUBLIC_SITE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.NODE_ENV !== "production" ? "http://localhost:3000" : undefined,
    process.env.NODE_ENV !== "production" ? "http://127.0.0.1:3000" : undefined,
  ];
  const origins = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    try {
      origins.add(new URL(value).origin);
    } catch {
      // Ignore malformed optional configuration rather than trusting it.
    }
  }
  return origins;
}

export function originAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return allowedPublicOrigins().has(new URL(origin).origin);
  } catch {
    return false;
  }
}

export function requestFingerprint(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwardedFor ?? request.headers.get("cf-connecting-ip") ?? "unknown";
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const pepper =
    process.env.PUBLIC_FORM_FINGERPRINT_PEPPER ?? process.env.WEBHOOK_SIGNING_SECRET ?? "";
  if (!pepper && process.env.NODE_ENV === "production") {
    throw new Error("The public form security configuration is incomplete.");
  }
  return createHash("sha256")
    .update(`${pepper || "local-development"}:${address}:${userAgent}`)
    .digest("hex");
}

export async function enforceSubmissionRateLimit(input: {
  client: SupabaseClient;
  fingerprint: string;
  table: string;
  maximum: number;
  windowMinutes: number;
}): Promise<void> {
  const since = new Date(Date.now() - input.windowMinutes * 60_000).toISOString();
  const { count, error } = await input.client
    .from(input.table)
    .select("id", { count: "exact", head: true })
    .eq("request_fingerprint", input.fingerprint)
    .gte("created_at", since);
  if (error) throw new Error("The request could not be checked safely. Please try again shortly.");
  if ((count ?? 0) >= input.maximum) {
    throw new Error("Please wait before sending another request.");
  }
}

export function demoSubmissionResponse(): Response {
  return Response.json(
    {
      message:
        "Demo mode received the request using fictional preview data. Nothing was stored or sent.",
      demo: true,
    },
    { status: 201 },
  );
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
