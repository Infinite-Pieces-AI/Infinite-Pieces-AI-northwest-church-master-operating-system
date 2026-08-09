export const realtimeTopicScopes = ["channel", "group", "kids-class", "announcement"] as const;
export type RealtimeTopicScope = (typeof realtimeTopicScopes)[number];

const identifierPattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/;

export function buildRealtimeTopic(scope: RealtimeTopicScope, id: string): string {
  if (!identifierPattern.test(id)) throw new Error("Realtime topic identifier is invalid");
  return `${scope}:${id}`;
}

export function parseRealtimeTopic(topic: string): { scope: RealtimeTopicScope; id: string } {
  const separator = topic.indexOf(":");
  if (separator < 1) throw new Error("Realtime topic is malformed");
  const scope = topic.slice(0, separator);
  const id = topic.slice(separator + 1);
  if (!realtimeTopicScopes.includes(scope as RealtimeTopicScope) || !identifierPattern.test(id)) {
    throw new Error("Realtime topic is not allowed");
  }
  return { scope: scope as RealtimeTopicScope, id };
}

export const allowedPresenceActivities = ["online", "reading", "typing"] as const;
export type PresenceActivity = (typeof allowedPresenceActivities)[number];

export interface SafePresenceState {
  profileId: string;
  displayLabel: string;
  activity: PresenceActivity;
  clientInstanceId: string;
  updatedAt: string;
}

/**
 * Presence is deliberately sparse. Email, phone, household, location, child
 * information, channel content, and background activity must never be exposed.
 */
export function sanitizePresenceState(input: SafePresenceState): SafePresenceState {
  if (!identifierPattern.test(input.profileId) || !identifierPattern.test(input.clientInstanceId)) {
    throw new Error("Presence identifiers are invalid");
  }
  if (!allowedPresenceActivities.includes(input.activity))
    throw new Error("Presence activity is invalid");
  const displayLabel = input.displayLabel.trim().slice(0, 80);
  if (!displayLabel) throw new Error("Presence display label is required");
  const updatedAt = new Date(input.updatedAt);
  if (Number.isNaN(updatedAt.getTime())) throw new Error("Presence timestamp is invalid");
  return { ...input, displayLabel, updatedAt: updatedAt.toISOString() };
}

export interface RealtimeChannelPolicy {
  private: true;
  requireDatabaseAuthorization: true;
  exposePresence: boolean;
  allowAdultToTeenDirectMessage: false;
}

export function policyForScope(scope: RealtimeTopicScope): RealtimeChannelPolicy {
  return {
    private: true,
    requireDatabaseAuthorization: true,
    exposePresence: scope !== "kids-class",
    allowAdultToTeenDirectMessage: false,
  };
}
