"use client";

import { track } from "@vercel/analytics";
import { sanitizePublicAnalyticsProperties, type PublicAnalyticsEvent } from "@church/analytics";

const serverRecordedBySubmission = new Set<PublicAnalyticsEvent>([
  "plan_visit_submitted",
  "question_submitted",
  "online_conversation_requested",
  "bible_study_requested",
]);

function anonymousSessionId(): string {
  const key = "bcl_public_session";
  try {
    const existing = window.sessionStorage.getItem(key);
    if (existing) return existing;
    const created = crypto.randomUUID();
    window.sessionStorage.setItem(key, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

export function trackPublicEvent(
  event: PublicAnalyticsEvent,
  properties: Record<string, unknown> = {},
): void {
  const sanitized = sanitizePublicAnalyticsProperties(properties);

  if (process.env.NEXT_PUBLIC_PUBLIC_ANALYTICS_PROVIDER === "vercel") {
    track(event, sanitized);
  }

  // Form-completion events are recorded by their server-side submission workflow so
  // the first-party funnel does not double-count them.
  if (serverRecordedBySubmission.has(event)) return;

  void fetch("/api/public/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ event, anonymousSessionId: anonymousSessionId(), properties: sanitized }),
    keepalive: true,
  }).catch(() => undefined);
}
