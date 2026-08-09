export const publicAnalyticsEvents = [
  "sunday_details_viewed",
  "directions_clicked",
  "calendar_added",
  "plan_visit_cta_clicked",
  "question_cta_clicked",
  "visitor_pathway_selected",
  "visitor_pathway_opened",
  "plan_visit_started",
  "plan_visit_submitted",
  "question_submitted",
  "online_conversation_requested",
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
  "pathway",
  "topic",
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
  "spiritual_vulnerability",
  "prayer_text",
  "prayer_request_id",
  "child_name",
  "medical_note",
  "counseling_content",
  "channel_message",
  "ministry_assignment",
] as const;
