"use client";

import { track } from "@vercel/analytics";
import { sanitizePublicAnalyticsProperties, type PublicAnalyticsEvent } from "@church/analytics";

export function trackPublicEvent(
  event: PublicAnalyticsEvent,
  properties: Record<string, unknown> = {},
): void {
  if (process.env.NEXT_PUBLIC_PUBLIC_ANALYTICS_PROVIDER !== "vercel") return;
  track(event, sanitizePublicAnalyticsProperties(properties));
}
