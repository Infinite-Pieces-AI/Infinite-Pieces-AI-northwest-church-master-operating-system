export interface MinistryDestination {
  key: string;
  title: string;
  href: string;
  description: string;
  reason: string;
  keywords: string[];
  sensitive?: boolean;
}

export const ministryDestinations: MinistryDestination[] = [
  {
    key: "this-week",
    title: "This Week",
    href: "/this-week",
    description: "Sunday details, announcements, current teaching, events, and assignments.",
    reason: "Best starting point for what is happening right now.",
    keywords: ["this week", "sunday", "announcement", "today", "schedule", "service time", "where"],
  },
  {
    key: "bible",
    title: "Bible Journey",
    href: "/bible",
    description: "Current lesson, Scripture references, notes, discussion, and approved Bible context.",
    reason: "Use this for Scripture, lessons, Bible questions, or study preparation.",
    keywords: ["bible", "scripture", "verse", "lesson", "study", "sermon", "genesis", "jesus", "read"],
  },
  {
    key: "fellowship",
    title: "Fellowship",
    href: "/fellowship",
    description: "Prayer walks, meals, playdates, activities, and member-created gatherings.",
    reason: "Use this to meet people or create a real-life gathering.",
    keywords: ["fellowship", "hangout", "meet", "friends", "meal", "walk", "playdate", "coffee", "lonely", "connect"],
  },
  {
    key: "gifts",
    title: "Gifts of the Church",
    href: "/gifts",
    description: "Share skills, discover church needs, offer help, mentor, or exchange useful items.",
    reason: "Use this when you want to serve through a strength or need practical help.",
    keywords: ["gift", "skill", "talent", "strength", "help", "need", "offer", "mentor", "repair", "sell", "free item", "church need"],
  },
  {
    key: "prayer",
    title: "The Prayer Well",
    href: "/prayer-well",
    description: "Post a prayer request, pray through the list, encourage someone, or mark an answer.",
    reason: "Use this for member prayer and encouragement at a privacy level you choose.",
    keywords: ["pray", "prayer", "encouragement", "answered", "intercede", "request"],
    sensitive: true,
  },
  {
    key: "recovery",
    title: "Recovery Ministry",
    href: "/recovery",
    description: "Weekly recovery curriculum, private group connection, leader tools, and verified resources.",
    reason: "Use this for the church recovery group or to locate professional and crisis resources.",
    keywords: ["recovery", "sober", "sobriety", "addiction", "substance", "alcohol", "drug", "relapse", "treatment", "celebrate recovery"],
    sensitive: true,
  },
  {
    key: "serve",
    title: "Serve",
    href: "/serve",
    description: "Volunteer opportunities, shifts, community partners, and current service projects.",
    reason: "Use this to join an organized church or Lowell service opportunity.",
    keywords: ["serve", "volunteer", "community", "project", "shift", "outreach", "help lowell"],
  },
  {
    key: "community",
    title: "Community",
    href: "/community",
    description: "Church announcements, ministry channels, group conversations, and updates.",
    reason: "Use this for ongoing church and ministry communication.",
    keywords: ["community", "message", "chat", "channel", "post", "announcement", "group"],
  },
  {
    key: "events",
    title: "Events",
    href: "/events",
    description: "Church, ministry, family, teen, and public events with registration and reminders.",
    reason: "Use this to find a scheduled event or registration.",
    keywords: ["event", "calendar", "register", "date", "meeting", "conference", "activity"],
  },
  {
    key: "connection-path",
    title: "Connection Path",
    href: "/connection-path",
    description: "A voluntary path for meeting people, Bible conversation, service, and belonging.",
    reason: "Use this when you are new or unsure what your next connection step should be.",
    keywords: ["new", "next step", "belong", "connection path", "start", "where do i begin"],
  },
  {
    key: "family",
    title: "Family",
    href: "/family",
    description: "Household, Kids Kingdom, check-in, pickup, media consent, and parent connections.",
    reason: "Use this for children, household, parent, or Kids Kingdom needs.",
    keywords: ["family", "child", "children", "kids", "parent", "guardian", "check in", "pickup", "photo", "media"],
    sensitive: true,
  },
];

const crisisPattern =
  /suicide|kill myself|self[- ]harm|overdose|not safe|immediate danger|medical emergency|hurt someone|abuse happening now/i;

export function isUrgentSafetyQuery(query: string): boolean {
  return crisisPattern.test(query);
}

export function includesSensitiveMinistryQuery(query: string): boolean {
  const normalized = query.toLowerCase();
  return ministryDestinations.some(
    (destination) =>
      destination.sensitive && destination.keywords.some((keyword) => normalized.includes(keyword)),
  );
}

export function scoreMinistryDestinations(query: string, limit = 3): MinistryDestination[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return ministryDestinations.slice(0, limit);
  return ministryDestinations
    .map((destination, index) => {
      const keywordScore = destination.keywords.reduce(
        (score, keyword) => score + (normalized.includes(keyword) ? 10 + keyword.length : 0),
        0,
      );
      const titleScore = normalized.includes(destination.title.toLowerCase()) ? 40 : 0;
      return { destination, score: keywordScore + titleScore - index * 0.01 };
    })
    .sort((a, b) => b.score - a.score)
    .filter((entry, index) => entry.score > 0 || index < limit)
    .slice(0, limit)
    .map((entry) => entry.destination);
}
