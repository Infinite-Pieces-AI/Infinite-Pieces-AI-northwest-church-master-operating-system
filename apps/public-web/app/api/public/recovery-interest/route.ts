import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { recoveryInterestSchema } from "../../../../../../packages/validation/src/recovery";
import { checkLocalRateLimit } from "@/lib/rate-limit";
import {
  enforceSubmissionRateLimit,
  getPublicSubmissionAdminClient,
  originAllowed,
  publicSubmissionDemoEnabled,
  requestFingerprint,
} from "@/lib/public-submissions";

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function POST(request: NextRequest) {
  if (!originAllowed(request)) {
    return NextResponse.json({ message: "The request origin is not allowed." }, { status: 403 });
  }

  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const localLimit = checkLocalRateLimit(`recovery-interest:${key}`, {
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!localLimit.allowed) {
    return NextResponse.json(
      { message: "Please wait before sending another recovery-support request." },
      {
        status: 429,
        headers: { "retry-after": String(localLimit.retryAfterSeconds) },
      },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = recoveryInterestSchema.safeParse(body);
  if (!parsed.success || parsed.data.website) {
    return NextResponse.json({ message: "Please check the form and try again." }, { status: 400 });
  }

  if (publicSubmissionDemoEnabled()) {
    return NextResponse.json(
      {
        message:
          "Preview mode accepted the form without storing contact or recovery information. Connect the approved production backend to send a real request.",
        demo: true,
      },
      { status: 202 },
    );
  }

  const admin = getPublicSubmissionAdminClient();
  const anon = publicClient();
  if (!admin || !anon) {
    return NextResponse.json(
      { message: "The private recovery-support form is not configured yet." },
      { status: 503 },
    );
  }

  try {
    const fingerprint = requestFingerprint(request);
    await enforceSubmissionRateLimit({
      client: admin,
      fingerprint,
      table: "recovery_interest_requests",
      maximum: 3,
      windowMinutes: 60,
    });

    const { data, error } = await anon.rpc("submit_recovery_interest_request", {
      p_first_name: parsed.data.firstName,
      p_contact_method: parsed.data.contactMethod,
      p_email: parsed.data.email ?? null,
      p_phone: parsed.data.phone ?? null,
      p_interest_type: parsed.data.interestType,
      p_message: parsed.data.message ?? null,
      p_consent_to_contact: parsed.data.consentToContact,
      p_source_path: parsed.data.sourcePath,
      p_source_campaign: parsed.data.campaign ?? null,
      p_request_fingerprint: fingerprint,
    });
    if (error) throw error;

    return NextResponse.json(
      {
        id: String(data),
        message:
          parsed.data.interestType === "treatment_resources"
            ? "Your request was sent to the restricted recovery-support queue. An authorized leader may send official resource links using the contact method you selected."
            : "Your request was sent privately to the restricted recovery-support queue. An authorized leader may respond using the contact method you selected.",
      },
      { status: 202 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "The request could not be submitted.";
    const status = /wait before sending/i.test(message) ? 429 : 503;
    return NextResponse.json({ message }, { status });
  }
}
