export const publicAnalyticsEvents = [
  "plan_visit_started",
  "plan_visit_submitted",
  "directions_clicked",
  "event_viewed",
  "event_registered",
  "bible_study_requested",
  "member_access_requested",
] as const;

export type PublicAnalyticsEvent = (typeof publicAnalyticsEvents)[number];

const permittedProperties = new Set([
  "path",
  "campaign",
  "source",
  "medium",
  "event_slug",
  "device_class",
]);

export function sanitizePublicAnalyticsProperties(
  properties: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (!permittedProperties.has(key)) continue;
    if (["string", "number", "boolean"].includes(typeof value)) {
      result[key] = value as string | number | boolean;
    }
  }
  return result;
}

export const forbiddenAnalyticsProperties = [
  "religious_belief",
  "prayer_text",
  "child_name",
  "medical_note",
  "counseling_content",
  "channel_message",
  "ministry_assignment",
] as const;
