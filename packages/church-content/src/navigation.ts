export type MinistryNavigationScope = "public" | "member";

export type MinistryDestinationId =
  | "meet-jesus"
  | "plan-visit"
  | "ask-question"
  | "families"
  | "kids"
  | "teens"
  | "bible-study"
  | "online-bible-study"
  | "serve-lowell"
  | "member-access"
  | "this-week"
  | "bible-journey"
  | "fellowship"
  | "service-marketplace"
  | "community"
  | "events"
  | "family"
  | "connection-preferences"
  | "connection-path"
  | "notifications"
  | "profile"
  | "ministry-admin"
  | "outreach-os";

export interface MinistryDestination {
  id: MinistryDestinationId;
  scope: MinistryNavigationScope;
  title: string;
  description: string;
  href: string;
  keywords: readonly string[];
  reasons: readonly string[];
  privileged?: boolean;
}

export interface MinistryRecommendation {
  destination: MinistryDestination;
  score: number;
  explanation: string;
}

export const publicMinistryDestinations: readonly MinistryDestination[] = [
  {
    id: "meet-jesus",
    scope: "public",
    title: "Questions about Jesus",
    description: "Begin with a clear, low-pressure introduction to Jesus and the Christian faith.",
    href: "/questions-about-jesus",
    keywords: ["jesus", "god", "faith", "christian", "believe", "gospel", "saved", "spiritual"],
    reasons: ["You mentioned Jesus, God, faith, or spiritual questions."],
  },
  {
    id: "plan-visit",
    scope: "public",
    title: "Plan your first Sunday",
    description:
      "See the current time, location, directions, Kids Kingdom information, and what to expect.",
    href: "/plan-a-visit",
    keywords: [
      "visit",
      "sunday",
      "service",
      "worship",
      "church near",
      "directions",
      "parking",
      "come",
    ],
    reasons: ["You appear to be considering an in-person Sunday visit."],
  },
  {
    id: "ask-question",
    scope: "public",
    title: "Ask a question",
    description: "Choose a topic and request a response from an authorized church volunteer.",
    href: "/ask-a-question",
    keywords: ["question", "belief", "believe", "doctrine", "contact", "talk", "someone", "help"],
    reasons: ["A direct conversation may be the clearest next step."],
  },
  {
    id: "families",
    scope: "public",
    title: "Church for families",
    description:
      "Learn about family community, children, practical Sunday details, and parent connections.",
    href: "/church-for-families-lowell",
    keywords: ["family", "families", "parent", "parents", "child", "children", "kids", "playdate"],
    reasons: ["You mentioned family, parenting, or children."],
  },
  {
    id: "kids",
    scope: "public",
    title: "Kids Kingdom",
    description: "See current children’s-ministry information and guardian-controlled next steps.",
    href: "/kids-ministry-lowell",
    keywords: ["kids", "kid", "child", "children", "nursery", "elementary", "check-in"],
    reasons: ["You asked about children or Kids Kingdom."],
  },
  {
    id: "teens",
    scope: "public",
    title: "Teen ministry",
    description: "Explore current teen-ministry information for students and guardians.",
    href: "/teen-ministry-lowell",
    keywords: ["teen", "teens", "student", "students", "middle school", "high school", "youth"],
    reasons: ["You mentioned teens, students, or youth ministry."],
  },
  {
    id: "bible-study",
    scope: "public",
    title: "Bible study in Lowell",
    description: "Request an approved Bible conversation with room for honest questions.",
    href: "/bible-study-lowell",
    keywords: ["bible", "scripture", "study", "read", "verse", "passage", "learn"],
    reasons: ["You mentioned Scripture, reading the Bible, or a Bible conversation."],
  },
  {
    id: "online-bible-study",
    scope: "public",
    title: "Online Bible conversation",
    description:
      "Request an approved online conversation when attending in person is not practical.",
    href: "/online-bible-study",
    keywords: ["online", "zoom", "remote", "home", "virtual", "can't attend", "cannot attend"],
    reasons: ["You asked for an online or remote option."],
  },
  {
    id: "serve-lowell",
    scope: "public",
    title: "Serve Lowell",
    description: "See approved public opportunities to serve neighbors alongside other people.",
    href: "/serve-lowell",
    keywords: [
      "serve",
      "service",
      "volunteer",
      "help community",
      "give back",
      "neighbors",
      "lowell",
    ],
    reasons: ["You mentioned volunteering, service, or helping the community."],
  },
  {
    id: "member-access",
    scope: "public",
    title: "Request Church Hub access",
    description:
      "Approved members can request an invitation to the private fellowship and connection app.",
    href: "/request-member-access",
    keywords: ["app", "hub", "member", "invite", "invitation", "signup", "sign up", "account"],
    reasons: ["You asked about the private member app or an invitation."],
  },
] as const;

export const memberMinistryDestinations: readonly MinistryDestination[] = [
  {
    id: "this-week",
    scope: "member",
    title: "This Week",
    description:
      "Current worship information, teaching, announcements, groups, and personal next steps.",
    href: "/this-week",
    keywords: ["today", "this week", "announcement", "sunday", "schedule", "what is happening"],
    reasons: ["You asked what is happening now or this week."],
  },
  {
    id: "bible-journey",
    scope: "member",
    title: "Bible Journey",
    description: "Follow the whole-Bible formation path and open the current Scripture resources.",
    href: "/bible",
    keywords: ["bible", "scripture", "verse", "passage", "study", "lesson", "sermon", "pray"],
    reasons: ["You mentioned Scripture, prayer, teaching, or a Bible lesson."],
  },
  {
    id: "fellowship",
    scope: "member",
    title: "Fellowship",
    description:
      "Find or host prayer walks, meals, playdates, sports, outings, and Bible conversations.",
    href: "/fellowship",
    keywords: [
      "fellowship",
      "hangout",
      "hang out",
      "meet",
      "friends",
      "company",
      "meal",
      "walk",
      "playdate",
      "coffee",
    ],
    reasons: ["You asked to meet people, find company, or join a member gathering."],
  },
  {
    id: "service-marketplace",
    scope: "member",
    title: "Service Marketplace",
    description:
      "Find approved opportunities, shifts, requirements, leaders, and service-team communication.",
    href: "/serve",
    keywords: ["serve", "service", "volunteer", "shift", "help", "supplies", "community"],
    reasons: ["You mentioned serving, volunteering, or helping with a practical need."],
  },
  {
    id: "community",
    scope: "member",
    title: "Community",
    description: "Open assigned church, ministry, parent, and group conversations.",
    href: "/community",
    keywords: ["message", "chat", "post", "community", "group", "family group", "conversation"],
    reasons: ["You asked about messages, posts, groups, or community conversation."],
  },
  {
    id: "events",
    scope: "member",
    title: "Events",
    description: "See approved public, member, ministry, volunteer, and group events.",
    href: "/events",
    keywords: ["event", "calendar", "register", "rsvp", "date", "meeting"],
    reasons: ["You mentioned an event, calendar, registration, or RSVP."],
  },
  {
    id: "family",
    scope: "member",
    title: "Family",
    description:
      "Manage household, guardian, pickup, check-in, media-consent, and parent-community tools.",
    href: "/family",
    keywords: [
      "family",
      "household",
      "child",
      "children",
      "pickup",
      "guardian",
      "check-in",
      "media",
      "parent",
    ],
    reasons: ["You asked about your household, children, pickup, check-in, or parent tools."],
  },
  {
    id: "connection-preferences",
    scope: "member",
    title: "Connection preferences",
    description: "Tell the Hub what kinds of gatherings, times, and general areas fit you.",
    href: "/connection-preferences",
    keywords: ["preference", "recommend", "suggest", "availability", "time", "area", "interests"],
    reasons: ["You asked to improve or explain your fellowship recommendations."],
  },
  {
    id: "connection-path",
    scope: "member",
    title: "Connection Path",
    description:
      "Choose a voluntary next step for Sunday, fellowship, Bible conversation, or service.",
    href: "/connection-path",
    keywords: ["new", "new member", "next step", "connect", "belong", "where do i start"],
    reasons: ["You asked where to start or how to become more connected."],
  },
  {
    id: "notifications",
    scope: "member",
    title: "Notification settings",
    description: "Control reminders, topics, devices, quiet hours, and delivery preferences.",
    href: "/notifications",
    keywords: ["notification", "reminder", "quiet hours", "push", "email", "alert"],
    reasons: ["You asked about reminders or notification settings."],
  },
  {
    id: "profile",
    scope: "member",
    title: "Profile and account",
    description: "Manage personal account settings, privacy choices, and authentication.",
    href: "/profile",
    keywords: ["profile", "account", "email", "password", "privacy", "settings", "login"],
    reasons: ["You asked about your account, login, profile, or privacy settings."],
  },
  {
    id: "ministry-admin",
    scope: "member",
    title: "Ministry Administration",
    description: "Open authorized content, moderation, group, safety, and ministry operations.",
    href: "/admin",
    keywords: ["admin", "approve", "moderate", "leader", "publish", "manage"],
    reasons: ["You asked about an authorized leadership or administrative task."],
    privileged: true,
  },
  {
    id: "outreach-os",
    scope: "member",
    title: "Outreach Intelligence OS",
    description: "Open authorized public-discovery, search, visitor, and outreach operations.",
    href: "/admin/outreach",
    keywords: ["seo", "outreach", "search console", "visitor request", "campaign", "traffic"],
    reasons: ["You asked about outreach, search, public discovery, or visitor operations."],
    privileged: true,
  },
] as const;

const urgentPatterns = [
  /\bimmediate danger\b/i,
  /\bcall 911\b/i,
  /\bsuicid(?:e|al)\b/i,
  /\bself[- ]?harm\b/i,
  /\babuse\b/i,
  /\bmedical emergency\b/i,
];

export function navigationSafetyNote(query: string): string | null {
  if (!urgentPatterns.some((pattern) => pattern.test(query))) return null;
  return "This guide cannot handle emergencies, abuse reports, or crisis decisions. Contact emergency services or follow the church’s approved safeguarding and pastoral escalation process now.";
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function scoreDestination(query: string, destination: MinistryDestination): number {
  const normalized = query.toLowerCase();
  const tokens = new Set(tokenize(query));
  let score = 0;
  for (const keyword of destination.keywords) {
    const normalizedKeyword = keyword.toLowerCase();
    if (normalized.includes(normalizedKeyword)) score += normalizedKeyword.includes(" ") ? 8 : 5;
    for (const token of tokenize(normalizedKeyword)) {
      if (tokens.has(token)) score += 1;
    }
  }
  return score;
}

export function recommendMinistryDestinations(input: {
  query: string;
  scope: MinistryNavigationScope;
  includePrivileged?: boolean;
  limit?: number;
}): MinistryRecommendation[] {
  const destinations =
    input.scope === "public" ? publicMinistryDestinations : memberMinistryDestinations;
  const limit = Math.max(1, Math.min(5, input.limit ?? 3));
  const scored = destinations
    .filter((destination) => input.includePrivileged || !destination.privileged)
    .map((destination) => ({ destination, score: scoreDestination(input.query, destination) }))
    .sort((a, b) => b.score - a.score || a.destination.title.localeCompare(b.destination.title));

  const usable = scored.some((row) => row.score > 0)
    ? scored.filter((row) => row.score > 0)
    : scored.filter((row) =>
        input.scope === "public"
          ? ["meet-jesus", "plan-visit", "ask-question"].includes(row.destination.id)
          : ["this-week", "bible-journey", "fellowship"].includes(row.destination.id),
      );

  return usable.slice(0, limit).map((row) => ({
    ...row,
    explanation:
      row.destination.reasons[0] ??
      `This destination matches the question you entered and is available in the ${input.scope} experience.`,
  }));
}

export function destinationsForScope(
  scope: MinistryNavigationScope,
  includePrivileged = false,
): MinistryDestination[] {
  const destinations = scope === "public" ? publicMinistryDestinations : memberMinistryDestinations;
  return destinations.filter((destination) => includePrivileged || !destination.privileged);
}
