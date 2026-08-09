import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { publicAnalyticsEvents, sanitizePublicAnalyticsProperties } from "@church/analytics";
import { checkLocalRateLimit } from "@/lib/rate-limit";

const serverSubmissionEvents = new Set([
  "plan_visit_submitted",
  "question_submitted",
  "online_conversation_requested",
  "bible_study_requested",
]);

export async function POST(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = checkLocalRateLimit(`public-event:${key}`, { limit: 80, windowMs: 5 * 60 * 1000 });
  if (!limit.allowed) {
    return NextResponse.json({ message: "Rate limit reached." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as {
    event?: unknown;
    anonymousSessionId?: unknown;
    properties?: unknown;
  } | null;
  const event = typeof body?.event === "string" ? body.event : "";
  if (!publicAnalyticsEvents.includes(event as (typeof publicAnalyticsEvents)[number])) {
    return NextResponse.json({ message: "Unsupported event." }, { status: 400 });
  }
  if (serverSubmissionEvents.has(event)) {
    return NextResponse.json({ message: "Submission event is recorded by its form workflow." }, { status: 202 });
  }
  const sessionId =
    typeof body?.anonymousSessionId === "string"
      ? body.anonymousSessionId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128)
      : "anonymous";
  const properties = sanitizePublicAnalyticsProperties(
    body?.properties && typeof body.properties === "object" && !Array.isArray(body.properties)
      ? (body.properties as Record<string, unknown>)
      : {},
  );

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    return NextResponse.json({ mode: "demo" }, { status: 202 });
  }
  const supabase = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error } = await supabase.rpc("record_public_conversion_event", {
    p_event_name: event,
    p_anonymous_session_id: sessionId,
    p_source_path: typeof properties.path === "string" ? properties.path : request.nextUrl.pathname,
    p_properties: properties,
  });
  if (error) {
    return NextResponse.json({ message: "Event could not be recorded." }, { status: 503 });
  }
  return NextResponse.json({ mode: "database" }, { status: 202 });
}
