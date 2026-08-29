export interface MinistryRouteRecommendation {
  id: string;
  title: string;
  description: string;
  href: string;
  reason: string;
  keywords: readonly string[];
  protected?: boolean;
}

export const ministryRouteCatalog: readonly MinistryRouteRecommendation[] = [
  {
    id: "this-week",
    title: "This Week",
    description:
      "See the current lesson, Sunday information, announcements, assignments, and next steps.",
    href: "/this-week",
    reason: "This is the best starting point for what is happening now.",
    keywords: [
      "this week",
      "today",
      "sunday",
      "announcement",
      "current lesson",
      "what is happening",
    ],
  },
  {
    id: "bible",
    title: "Bible Journey",
    description:
      "Follow the current Scripture path, lesson outline, discussion questions, and approved Bible companion.",
    href: "/bible",
    reason: "Your question is about Scripture, teaching, or spiritual formation.",
    keywords: [
      "bible",
      "scripture",
      "verse",
      "lesson",
      "sermon",
      "study",
      "jesus",
      "genesis",
      "revelation",
    ],
  },
  {
    id: "fellowship",
    title: "Fellowship",
    description:
      "Find meals, prayer walks, family outings, sports, coffee, service meetups, and ordinary time together.",
    href: "/fellowship",
    reason: "Your question is about meeting people or spending time together.",
    keywords: [
      "fellowship",
      "hangout",
      "meet people",
      "lonely",
      "friends",
      "meal",
      "walk",
      "playdate",
      "coffee",
      "sports",
    ],
  },
  {
    id: "gifts",
    title: "Gifts of the Church",
    description:
      "Record gifts you choose to share, offer a skill, request practical help, share an item, or respond to a church need.",
    href: "/gifts",
    reason:
      "Your question is about spiritual gifts, practical skills, volunteering, or helping with a need.",
    keywords: [
      "gift",
      "gifts",
      "skill",
      "talent",
      "wired",
      "assessment",
      "offer help",
      "need help",
      "borrow",
      "sell",
      "volunteer",
    ],
  },
  {
    id: "prayer",
    title: "Prayer Well",
    description:
      "See authorized prayer requests, mark that you prayed, encourage someone, post an update, or add a request with chosen privacy.",
    href: "/prayer",
    reason: "Your question is about prayer, encouragement, or answered prayer.",
    keywords: ["pray", "prayer", "answered prayer", "encourage", "prayer request", "intercede"],
  },
  {
    id: "serve",
    title: "Serve",
    description:
      "Find approved service opportunities, volunteer roles, shifts, supplies, and community partnerships.",
    href: "/serve",
    reason: "Your question is about serving the church or Lowell community.",
    keywords: [
      "serve",
      "service",
      "volunteer",
      "community project",
      "help lowell",
      "shift",
      "supplies",
    ],
  },
  {
    id: "recovery",
    title: "Recovery Ministry",
    description:
      "Open the private weekly recovery journey, participant group, leader tools, or professional treatment resources.",
    href: "/recovery",
    reason:
      "Your question is about recovery support, sober community, treatment resources, or leading the recovery ministry.",
    keywords: [
      "recovery",
      "sober",
      "sobriety",
      "addiction",
      "substance",
      "relapse",
      "treatment",
      "celebrate recovery",
      "peer support",
    ],
    protected: true,
  },
  {
    id: "community",
    title: "Community",
    description:
      "Open church-wide announcements and the ministry or group channels you are authorized to see.",
    href: "/community",
    reason: "Your question is about a channel, conversation, announcement, or group communication.",
    keywords: [
      "community",
      "message",
      "chat",
      "channel",
      "announcement",
      "post",
      "comment",
      "group conversation",
    ],
  },
  {
    id: "events",
    title: "Events",
    description:
      "View public, member, ministry, and group events, registrations, volunteer opportunities, and calendar links.",
    href: "/events",
    reason: "Your question is about an event, registration, date, or calendar.",
    keywords: ["event", "calendar", "register", "date", "when", "conference", "retreat"],
  },
  {
    id: "connection-path",
    title: "Connection Path",
    description:
      "Choose a voluntary next step for your first month: Sunday, fellowship, Bible conversation, and service.",
    href: "/connection-path",
    reason: "Your question is about getting connected, being new, or knowing what to do next.",
    keywords: ["new", "next step", "connect", "connection path", "first month", "where do i start"],
  },
  {
    id: "family",
    title: "Family",
    description:
      "Manage household, children, authorized pickup, media consent, Kids Kingdom, parent connections, and playdates.",
    href: "/family",
    reason:
      "Your question is about family, children, parents, Kids Kingdom, pickup, check-in, or media permission.",
    keywords: [
      "family",
      "child",
      "children",
      "kids",
      "kids kingdom",
      "check in",
      "pickup",
      "guardian",
      "parent",
      "photo",
      "consent",
    ],
    protected: true,
  },
  {
    id: "admin",
    title: "Ministry Administration",
    description:
      "Open authorized content, access, moderation, safeguarding, group, outreach, and operational tools.",
    href: "/admin",
    reason: "Your question requires an authorized leader or administrative workflow.",
    keywords: [
      "admin",
      "approve",
      "moderate",
      "leader",
      "publish",
      "access request",
      "safeguarding",
      "manage",
    ],
    protected: true,
  },
] as const;

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function resolveMinistryNavigation(
  question: string,
  maximum = 3,
): MinistryRouteRecommendation[] {
  const normalized = question.trim().toLowerCase();
  if (!normalized)
    return [ministryRouteCatalog[0], ministryRouteCatalog[2], ministryRouteCatalog[1]];
  const words = new Set(tokenize(normalized));
  return ministryRouteCatalog
    .map((route) => {
      let score = 0;
      for (const keyword of route.keywords) {
        const lower = keyword.toLowerCase();
        if (normalized.includes(lower)) score += lower.includes(" ") ? 6 : 4;
        for (const word of tokenize(lower)) if (words.has(word)) score += 1;
      }
      if (normalized.includes(route.title.toLowerCase())) score += 8;
      return { route, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.route.title.localeCompare(b.route.title))
    .slice(0, Math.max(1, Math.min(maximum, 5)))
    .map((entry) => entry.route);
}

export function recommendationById(id: string): MinistryRouteRecommendation | undefined {
  return ministryRouteCatalog.find((route) => route.id === id);
}
