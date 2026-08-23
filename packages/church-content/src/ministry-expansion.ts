import type { MinistryNavigationScope } from "./navigation";

export interface ExpandedMinistryDestination {
  id: string;
  scope: MinistryNavigationScope;
  title: string;
  description: string;
  href: string;
  keywords: readonly string[];
  reasons: readonly string[];
  privileged?: boolean;
}

export interface ExpandedMinistryRecommendation {
  destination: ExpandedMinistryDestination;
  score: number;
  explanation: string;
}

const publicExpansionDestinations: readonly ExpandedMinistryDestination[] = [
  {
    id: "recovery-support",
    scope: "public",
    title: "Recovery support near Lowell",
    description:
      "Learn about the church’s adult peer-support pathway, request a private conversation, or open official treatment and crisis resources.",
    href: "/recovery-support-lowell",
    keywords: [
      "recovery",
      "sober",
      "sobriety",
      "addiction",
      "alcohol",
      "drugs",
      "substance",
      "treatment",
      "relapse",
      "detox",
      "support group",
      "celebrate recovery",
      "family support",
    ],
    reasons: [
      "You mentioned recovery, sobriety, substance-use support, treatment resources, or help for a family member.",
    ],
  },
] as const;

const memberExpansionDestinations: readonly ExpandedMinistryDestination[] = [
  {
    id: "gifts-of-church",
    scope: "member",
    title: "Gifts of the Church",
    description:
      "Record strengths you choose to share, offer a practical skill, respond to member needs, and help fill approved church opportunities.",
    href: "/gifts",
    keywords: [
      "gift",
      "gifts",
      "spiritual gifts",
      "strength",
      "assessment",
      "skill",
      "talent",
      "offer help",
      "church need",
      "borrow",
      "lend",
      "marketplace",
    ],
    reasons: ["You asked about spiritual gifts, practical skills, offering help, or finding a need."],
  },
  {
    id: "prayer-well",
    scope: "member",
    title: "Prayer Well",
    description:
      "See authorized prayer requests, mark that you prayed, offer encouragement, post an update, or remember answered prayer.",
    href: "/prayer",
    keywords: [
      "prayer request",
      "prayer list",
      "prayer well",
      "pray for",
      "answered prayer",
      "encourage",
      "thanksgiving prayer",
      "post prayer",
    ],
    reasons: ["You asked about a prayer request, the prayer list, encouragement, or answered prayer."],
  },
  {
    id: "recovery-ministry",
    scope: "member",
    title: "Recovery Ministry",
    description:
      "Open the private adult recovery journey, approved weekly resources, participant group, support links, or leader workspace.",
    href: "/recovery",
    keywords: [
      "recovery",
      "sober",
      "sobriety",
      "addiction",
      "alcohol",
      "substance",
      "relapse",
      "recovery group",
      "recovery lesson",
      "recovery ministry",
      "celebrate recovery",
      "treatment resources",
    ],
    reasons: ["You asked about the private recovery ministry, its weekly journey, group, or resources."],
  },
] as const;

const urgentRecoveryPatterns = [
  /\boverdose\b/i,
  /\bunconscious\b/i,
  /\bnot breathing\b/i,
  /\bsevere withdrawal\b/i,
  /\bwithdrawal seizure\b/i,
  /\bneed detox now\b/i,
  /\bpoisoning\b/i,
];

export function expansionNavigationSafetyNote(query: string): string | null {
  if (!urgentRecoveryPatterns.some((pattern) => pattern.test(query))) return null;
  return "This guide cannot manage an overdose, dangerous withdrawal, poisoning, or another medical emergency. Call 911 now. In the United States, call or text 988 for crisis support, and use licensed treatment resources for clinical care.";
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function scoreDestination(query: string, destination: ExpandedMinistryDestination): number {
  const normalized = query.toLowerCase();
  const tokens = new Set(tokenize(query));
  let score = 0;
  for (const keyword of destination.keywords) {
    const normalizedKeyword = keyword.toLowerCase();
    if (normalized.includes(normalizedKeyword)) score += normalizedKeyword.includes(" ") ? 11 : 7;
    for (const token of tokenize(normalizedKeyword)) {
      if (tokens.has(token)) score += 1;
    }
  }
  return score;
}

export function expansionDestinationsForScope(
  scope: MinistryNavigationScope,
  includePrivileged = false,
): ExpandedMinistryDestination[] {
  const destinations = scope === "public" ? publicExpansionDestinations : memberExpansionDestinations;
  return destinations.filter((destination) => includePrivileged || !destination.privileged);
}

export function recommendExpansionDestinations(input: {
  query: string;
  scope: MinistryNavigationScope;
  includePrivileged?: boolean;
  limit?: number;
}): ExpandedMinistryRecommendation[] {
  const limit = Math.max(1, Math.min(5, input.limit ?? 3));
  return expansionDestinationsForScope(input.scope, input.includePrivileged)
    .map((destination) => ({ destination, score: scoreDestination(input.query, destination) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.destination.title.localeCompare(b.destination.title))
    .slice(0, limit)
    .map((row) => ({
      ...row,
      explanation: row.destination.reasons[0] ?? `This destination matches the question you entered.`,
    }));
}
