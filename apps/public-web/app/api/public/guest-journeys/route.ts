import {
  demoSubmissionResponse,
  enforceSubmissionRateLimit,
  getPublicSubmissionAdminClient,
  honeypotClear,
  normalizeBoolean,
  normalizeEmail,
  normalizeOptionalText,
  normalizePhone,
  normalizeRequiredText,
  originAllowed,
  publicSubmissionDemoEnabled,
  requestFingerprint,
} from "@/lib/public-submissions";

const requestTypes = [
  "plan_visit",
  "general_question",
  "bible_study",
  "online_conversation",
  "public_event",
] as const;
type RequestType = (typeof requestTypes)[number];

const allowedTopics = [
  "first_visit",
  "beliefs",
  "bible_study",
  "kids_teens",
  "accessibility",
  "online_participation",
  "service",
  "other",
] as const;

function parseRequestType(value: unknown): RequestType {
  if (typeof value === "string" && requestTypes.includes(value as RequestType)) {
    return value as RequestType;
  }
  throw new Error("Choose a valid next step.");
}

export async function POST(request: Request) {
  try {
    if (!originAllowed(request)) {
      return Response.json({ message: "This request origin is not allowed." }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    if (!honeypotClear(body.website)) {
      return Response.json({ message: "Thank you." }, { status: 200 });
    }
    if (!normalizeBoolean(body.communicationConsent)) {
      return Response.json(
        { message: "Please confirm that an authorized church volunteer may contact you." },
        { status: 400 },
      );
    }

    const requestType = parseRequestType(body.requestType);
    const firstName = normalizeRequiredText(body.firstName, 80);
    const email = normalizeEmail(body.email);
    const phone = normalizePhone(body.phone);
    const preferredContact = body.preferredContact === "phone" ? "phone" : "email";
    if (preferredContact === "email" && !email) {
      throw new Error("Enter the email address you would like us to use.");
    }
    if (preferredContact === "phone" && !phone) {
      throw new Error("Enter the phone number you would like us to use.");
    }

    const partySize = Math.max(1, Math.min(20, Math.round(Number(body.partySize ?? 1))));
    const childrenAttending = ["yes", "no", "prefer_not_to_say"].includes(
      String(body.childrenAttending),
    )
      ? String(body.childrenAttending)
      : "prefer_not_to_say";
    const topic = allowedTopics.includes(String(body.topic) as (typeof allowedTopics)[number])
      ? String(body.topic)
      : null;

    if (publicSubmissionDemoEnabled()) return demoSubmissionResponse();

    const client = getPublicSubmissionAdminClient();
    if (!client) {
      return Response.json(
        { message: "The request form is temporarily unavailable. Please use the public contact page." },
        { status: 503 },
      );
    }

    const fingerprint = requestFingerprint(request);
    await enforceSubmissionRateLimit({
      client,
      fingerprint,
      table: "public_guest_requests",
      maximum: 5,
      windowMinutes: 30,
    });

    const { error } = await client.from("public_guest_requests").insert({
      request_type: requestType,
      first_name: firstName,
      preferred_contact: preferredContact,
      email,
      phone,
      party_size: partySize,
      children_attending: childrenAttending,
      topic,
      practical_note: normalizeOptionalText(body.practicalNote, 1500),
      source_path: normalizeOptionalText(body.sourcePath, 500) ?? "/",
      source_campaign: normalizeOptionalText(body.sourceCampaign, 200),
      consent_text_version: "public-contact-v1",
      communication_consent: true,
      request_fingerprint: fingerprint,
      status: "new",
    });
    if (error) throw new Error("The request could not be saved safely.");

    const messages: Record<RequestType, string> = {
      plan_visit:
        "Thank you. An authorized welcome volunteer will follow up using the contact method you selected.",
      general_question:
        "Thank you. An authorized church volunteer will respond to the question you chose to share.",
      bible_study:
        "Thank you. An authorized volunteer will follow up about a Bible conversation using your selected contact method.",
      online_conversation:
        "Thank you. An authorized volunteer will follow up about approved online options. No meeting is created until you confirm a time.",
      public_event:
        "Thank you. An authorized volunteer will follow up about the public event you selected.",
    };

    return Response.json({ message: messages[requestType] }, { status: 201 });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "The request could not be sent." },
      { status: 400 },
    );
  }
}
