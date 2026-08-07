export type DomainEventType =
  | "service_occurrence.updated"
  | "weekly_lesson.published"
  | "member.approved"
  | "invitation.created"
  | "group_cycle.approved"
  | "group_rotation.proposal_requested"
  | "media.approved"
  | "checkin.status_updated"
  | "planning_center.sync_requested"
  | "search_console.sync_requested"
  | "keyword_opportunity.detected"
  | "social_draft.approved"
  | "ai.draft_requested"
  | "ai.embedding_requested"
  | "curriculum.draft_requested"
  | "image_prompt.draft_requested"
  | "public_content.revalidate_requested";

export interface OutboxEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  type: DomainEventType;
  aggregateType: string;
  aggregateId: string;
  payload: TPayload;
  occurredAt: string;
  correlationId?: string;
}

export function createOutboxEvent<TPayload extends Record<string, unknown>>(input: {
  id: string;
  type: DomainEventType;
  aggregateType: string;
  aggregateId: string;
  payload: TPayload;
  occurredAt?: Date;
  correlationId?: string;
}): OutboxEvent<TPayload> {
  return {
    id: input.id,
    type: input.type,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    payload: input.payload,
    occurredAt: (input.occurredAt ?? new Date()).toISOString(),
    ...(input.correlationId ? { correlationId: input.correlationId } : {}),
  };
}

export const pushNotificationTopics = [
  "service_schedule",
  "weekly_lesson",
  "assigned_group",
  "event_reminder",
  "kids_operational",
  "weekly_digest",
] as const;
export type PushNotificationTopic = (typeof pushNotificationTopics)[number];

export interface PushNotificationPayload {
  title: string;
  body: string;
  url: string;
  topic: PushNotificationTopic;
  tag?: string;
  icon?: string;
  badge?: string;
}

const forbiddenPushTerms = [
  "prayer request:",
  "counseling",
  "custody",
  "medical diagnosis",
  "safeguarding report",
  "child full name",
] as const;

/**
 * Push notifications appear on lock screens. Keep them generic and route the
 * member into the authenticated app for details.
 */
export function sanitizePushPayload(input: PushNotificationPayload): PushNotificationPayload {
  const title = input.title.trim().slice(0, 80);
  const body = input.body.trim().slice(0, 180);
  if (!title || !body) throw new Error("Push title and body are required");
  const lower = `${title} ${body}`.toLowerCase();
  const prohibited = forbiddenPushTerms.find((term) => lower.includes(term));
  if (prohibited)
    throw new Error(`Push notification contains prohibited lock-screen detail: ${prohibited}`);
  const parsed = new URL(input.url, "https://hub.invalid");
  if (parsed.origin !== "https://hub.invalid")
    throw new Error("Push URL must be an internal relative path");
  if (!pushNotificationTopics.includes(input.topic)) throw new Error("Push topic is invalid");
  return {
    title,
    body,
    url: `${parsed.pathname}${parsed.search}${parsed.hash}`,
    topic: input.topic,
    ...(input.tag ? { tag: input.tag.slice(0, 80) } : {}),
    ...(input.icon ? { icon: input.icon } : {}),
    ...(input.badge ? { badge: input.badge } : {}),
  };
}
