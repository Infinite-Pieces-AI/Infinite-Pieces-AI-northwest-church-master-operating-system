import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface InquiryBody {
  displayName?: unknown;
  contactMethod?: unknown;
  contactValue?: unknown;
  requestedNextStep?: unknown;
  message?: unknown;
  consentToContact?: unknown;
  website?: unknown;
  sourcePath?: unknown;
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as InquiryBody | null;
  if (!body) return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  if (text(body.website, 200)) {
    return NextResponse.json({ message: "Request received" });
  }

  const displayName = text(body.displayName, 160);
  const contactMethod = text(body.contactMethod, 20);
  const contactValue = text(body.contactValue, 254);
  const requestedNextStep = text(body.requestedNextStep, 50);
  const message = text(body.message, 2000);
  const sourcePath = text(body.sourcePath, 500) || "/recovery-support";

  if (!displayName || !contactValue || body.consentToContact !== true) {
    return NextResponse.json(
      { message: "Add your name, contact information, and consent to be contacted." },
      { status: 400 },
    );
  }
  if (!new Set(["email", "phone"]).has(contactMethod)) {
    return NextResponse.json({ message: "Choose email or phone." }, { status: 400 });
  }
  if (
    !new Set([
      "learn_about_group",
      "speak_with_leader",
      "find_treatment_resources",
      "online_option",
    ]).has(requestedNextStep)
  ) {
    return NextResponse.json({ message: "Choose a supported next step." }, { status: 400 });
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        message:
          "The confidential inquiry service is not connected yet. Please use the public contact page or speak with a church leader in person.",
      },
      { status: 503 },
    );
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/recovery_support_inquiries`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
      prefer: "return=minimal",
    },
    body: JSON.stringify({
      display_name: displayName,
      contact_method: contactMethod,
      contact_value: contactValue,
      requested_next_step: requestedNextStep,
      message: message || null,
      consent_to_contact: true,
      status: "new",
      source_path: sourcePath,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    return NextResponse.json(
      { message: "We could not save the request. Please use the public contact page instead." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    message:
      "Your request was received. An approved church leader will use only the contact method you selected.",
  });
}
