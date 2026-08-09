import {
  getPublicSubmissionAdminClient,
  normalizeOptionalText,
  originAllowed,
  publicSubmissionDemoEnabled,
} from "@/lib/public-submissions";

const eventNames = [
  "sunday_details_viewed",
  "directions_clicked",
  "calendar_added",
  "plan_visit_cta_clicked",
  "question_cta_clicked",
  "plan_visit_started",
  "plan_visit_submitted",
  "question_submitted",
  "bible_study_requested",
  "online_conversation_requested",
  "event_registered",
  "member_access_requested",
  "visitor_pathway_selected",
  "visitor_pathway_opened",
] as const;

const prohibitedPropertyFragments = [
  "prayer",
  "religion",
  "belief",
  "counsel",
  "diagnosis",
  "child_name",
  "child_age",
  "custody",
  "medical",
  "safeguarding",
  "message_body",
  "private_group",
  "member_email",
] as const;

function sanitizeProperties(value: unknown): Record<string, string | number | boolean | null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output: Record<string, string | number | boolean | null> = {};
  for (const [rawKey, rawValue] of Object.entries(value as Record<string, unknown>)) {
    const key = rawKey.trim().toLowerCase().slice(0, 80);
    if (!key || prohibitedPropertyFragments.some((fragment) => key.includes(fragment))) continue;
    if (typeof rawValue === "string") output[key] = rawValue.slice(0, 200);
    else if (typeof rawValue === "number" && Number.isFinite(rawValue)) output[key] = rawValue;
    else if (typeof rawValue === "boolean" || rawValue === null) output[key] = rawValue;
    if (Object.keys(output).length >= 20) break;
  }
  return output;
}

export async function POST(request: Request) {
  try {
    if (!originAllowed(request)) return new Response(null, { status: 204 });
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 16_384) return new Response(null, { status: 204 });

    const body = (await request.json()) as Record<string, unknown>;
    const eventName = String(body.eventName ?? "");
    if (!eventNames.includes(eventName as (typeof eventNames)[number])) {
      return new Response(null, { status: 204 });
    }
    if (publicSubmissionDemoEnabled()) return new Response(null, { status: 204 });

    const client = getPublicSubmissionAdminClient();
    if (!client) return new Response(null, { status: 204 });
    const path = normalizeOptionalText(body.path, 500);
    if (!path?.startsWith("/")) return new Response(null, { status: 204 });
    const sourceChannel = normalizeOptionalText(body.sourceChannel, 80) ?? "direct";

    const { error } = await client.from("public_analytics_events").insert({
      event_name: eventName,
      path,
      source_channel: sourceChannel,
      properties: sanitizeProperties(body.properties),
    });
    if (error) return new Response(null, { status: 204 });
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 204 });
  }
}
