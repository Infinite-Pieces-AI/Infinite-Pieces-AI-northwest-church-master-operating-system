export const outreachDraftStatuses = [
  "draft",
  "in_review",
  "approved",
  "scheduled",
  "published",
  "rejected",
] as const;
export type OutreachDraftStatus = (typeof outreachDraftStatuses)[number];

const prohibitedAudienceSignals = [
  "religious belief",
  "prayer history",
  "private bible question",
  "church membership",
  "child ministry record",
  "pastoral counseling",
  "private group activity",
] as const;

export interface SearchOpportunity {
  query: string;
  impressions: number;
  clicks: number;
  averagePosition: number;
  locality: string;
  existingPage?: string;
}

export interface ScoredSearchOpportunity extends SearchOpportunity {
  clickThroughRate: number;
  opportunityScore: number;
  recommendedAction: "improve_existing" | "create_people_first_page" | "monitor";
}

/** Scores aggregate Search Console data; it never tries to identify a searcher. */
export function scoreSearchOpportunity(input: SearchOpportunity): ScoredSearchOpportunity {
  const clickThroughRate = input.impressions > 0 ? input.clicks / input.impressions : 0;
  const visibility = Math.max(0, 20 - Math.min(input.averagePosition, 20)) / 20;
  const missedClicks = Math.max(0, 0.08 - clickThroughRate);
  const opportunityScore = Number(
    (Math.log10(input.impressions + 1) * (0.4 + visibility) * (1 + missedClicks * 6)).toFixed(4),
  );
  return {
    ...input,
    clickThroughRate,
    opportunityScore,
    recommendedAction:
      input.existingPage && input.impressions >= 50
        ? "improve_existing"
        : !input.existingPage && input.impressions >= 100
          ? "create_people_first_page"
          : "monitor",
  };
}

export function assertAudiencePlanAllowed(input: {
  audienceDescription: string;
  sourceData: readonly string[];
}): void {
  const combined = `${input.audienceDescription} ${input.sourceData.join(" ")}`.toLowerCase();
  const prohibited = prohibitedAudienceSignals.find((signal) => combined.includes(signal));
  if (prohibited) throw new Error(`Outreach audience may not use sensitive signal: ${prohibited}`);
}

export interface ContentBriefDraft {
  title: string;
  searchIntent: string;
  locality: string;
  approvedFacts: Readonly<Record<string, string>>;
  recommendedSections: readonly string[];
  status: "draft";
  requiresHumanReview: true;
  publishAutomatically: false;
}

export function createPeopleFirstContentBrief(input: {
  title: string;
  searchIntent: string;
  locality: string;
  approvedFacts: Readonly<Record<string, string>>;
  recommendedSections: readonly string[];
}): ContentBriefDraft {
  if (Object.keys(input.approvedFacts).length === 0)
    throw new Error("A content brief requires approved church facts");
  if (input.recommendedSections.length < 3)
    throw new Error("A people-first page requires substantive sections");
  return { ...input, status: "draft", requiresHumanReview: true, publishAutomatically: false };
}

export interface ReadinessItem {
  key: string;
  label: string;
  complete: boolean;
  evidence?: string;
}

export function evaluateReadiness(items: readonly ReadinessItem[]): {
  ready: boolean;
  completionPercent: number;
  missing: string[];
} {
  const complete = items.filter((item) => item.complete).length;
  return {
    ready: items.length > 0 && complete === items.length,
    completionPercent: items.length ? Math.round((complete / items.length) * 100) : 0,
    missing: items.filter((item) => !item.complete).map((item) => item.label),
  };
}

export const googleBusinessProfileReadinessTemplate: readonly ReadinessItem[] = [
  { key: "identity", label: "Official church name approved by central leadership", complete: false },
  { key: "venue", label: "Accurate rented-facility representation and evidence", complete: false },
  { key: "hours", label: "Service hours match actual staffed hours", complete: false },
  { key: "signage", label: "On-site directional signage and welcome desk documented", complete: false },
  { key: "category", label: "Primary category reviewed for accuracy", complete: false },
  { key: "ownership", label: "Church-controlled recovery owners assigned", complete: false },
];

export const adGrantReadinessTemplate: readonly ReadinessItem[] = [
  { key: "eligibility", label: "Google for Nonprofits eligibility confirmed", complete: false },
  { key: "domain", label: "Church-controlled domain and administrative email", complete: false },
  { key: "mission", label: "Mission and substantive public content published", complete: false },
  { key: "measurement", label: "Meaningful conversion tracking configured", complete: false },
  { key: "keywords", label: "Specific high-intent keyword groups reviewed", complete: false },
  { key: "policy", label: "Advertising and sensitive-audience policy approved", complete: false },
];

export const publicSourceKinds = [
  "public_forum",
  "public_comment",
  "public_web",
  "public_rss",
] as const;
export type PublicSourceKind = (typeof publicSourceKinds)[number];

export interface PublicConversationSignal {
  sourceKind: PublicSourceKind;
  sourceLabel: string;
  title: string;
  excerpt: string;
  publicUrl: string;
  publishedAt: string;
  locality: string;
  explicitChurchRequest: boolean;
  familyRelevance: number;
  onlineMinistryIntent: number;
  freshness: number;
  replyOpportunity: number;
  contentOpportunity: number;
  searchOpportunity: number;
  riskSensitivity: number;
}

export interface PublicConversationScores {
  localRelevance: number;
  churchIntent: number;
  familyRelevance: number;
  onlineMinistryIntent: number;
  freshness: number;
  replyOpportunity: number;
  contentOpportunity: number;
  searchOpportunity: number;
  riskSensitivity: number;
  priority: number;
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function scorePublicConversationOpportunity(
  input: PublicConversationSignal,
  serviceLocality = "Lowell",
): PublicConversationScores {
  const locality = input.locality.toLowerCase();
  const localRelevance = locality.includes(serviceLocality.toLowerCase())
    ? 100
    : locality.includes("massachusetts")
      ? 72
      : input.onlineMinistryIntent >= 70
        ? 55
        : 24;
  const churchIntent = input.explicitChurchRequest
    ? 100
    : /church|bible|faith|worship|prayer/i.test(`${input.title} ${input.excerpt}`)
      ? 86
      : 42;
  const familyRelevance = clampScore(input.familyRelevance);
  const onlineMinistryIntent = clampScore(input.onlineMinistryIntent);
  const freshness = clampScore(input.freshness);
  const replyOpportunity = clampScore(input.replyOpportunity);
  const contentOpportunity = clampScore(input.contentOpportunity);
  const searchOpportunity = clampScore(input.searchOpportunity);
  const riskSensitivity = clampScore(input.riskSensitivity);
  const weighted =
    localRelevance * 0.16 +
    churchIntent * 0.19 +
    Math.max(familyRelevance, onlineMinistryIntent) * 0.08 +
    freshness * 0.11 +
    replyOpportunity * 0.15 +
    contentOpportunity * 0.13 +
    searchOpportunity * 0.12 -
    riskSensitivity * 0.06;

  return {
    localRelevance,
    churchIntent,
    familyRelevance,
    onlineMinistryIntent,
    freshness,
    replyOpportunity,
    contentOpportunity,
    searchOpportunity,
    riskSensitivity,
    priority: clampScore(weighted),
  };
}

export function assertPublicSourceAllowed(input: {
  url: string;
  publiclyAccessible: boolean;
  privateGroup: boolean;
  requiresBypass: boolean;
  containsRestrictedData: boolean;
}): void {
  let parsed: URL;
  try {
    parsed = new URL(input.url);
  } catch {
    throw new Error("Public-source ingestion requires a valid URL");
  }
  if (parsed.protocol !== "https:") throw new Error("Public-source ingestion requires HTTPS");
  if (!input.publiclyAccessible || input.privateGroup)
    throw new Error("Private, closed, or membership-only sources are prohibited");
  if (input.requiresBypass) throw new Error("Access-control, paywall, or anti-bot bypass is prohibited");
  if (input.containsRestrictedData)
    throw new Error("Restricted pastoral, child, counseling, or member data is prohibited");
}

export interface RespectfulResponseDraft {
  disclosure: string;
  response: string;
  privateFollowUpPrompt: string;
  requiresHumanReview: true;
  publishAutomatically: false;
}

export function buildRespectfulResponseDraft(input: {
  question: string;
  approvedChurchName: string;
  approvedServiceSummary: string;
  approvedNextStepUrl: string;
}): RespectfulResponseDraft {
  if (!input.approvedChurchName.trim() || !input.approvedServiceSummary.trim()) {
    throw new Error("A response draft requires approved church facts");
  }
  const disclosure = `I’m part of ${input.approvedChurchName}, so I want to be transparent about my connection.`;
  const response = `${disclosure} ${input.approvedServiceSummary} Your question is worth answering without pressure, and the current details are available here: ${input.approvedNextStepUrl}`;
  return {
    disclosure,
    response,
    privateFollowUpPrompt:
      "Invite the person to use the church’s voluntary form if they want follow-up; do not ask for sensitive details in a public thread.",
    requiresHumanReview: true,
    publishAutomatically: false,
  };
}

export function assertNoIndividualReligiousProfile(input: {
  personIdentifier?: string;
  inferredBeliefs?: readonly string[];
  privateSearchHistory?: readonly string[];
}): void {
  if (input.personIdentifier || input.inferredBeliefs?.length || input.privateSearchHistory?.length) {
    throw new Error("Individual religious profiling and private-search dossiers are prohibited");
  }
}
