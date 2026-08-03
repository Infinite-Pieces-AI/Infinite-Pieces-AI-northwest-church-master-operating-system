export const outreachDraftStatuses = ["draft", "in_review", "approved", "scheduled", "published", "rejected"] as const;
export type OutreachDraftStatus = (typeof outreachDraftStatuses)[number];

const prohibitedAudienceSignals = [
  "religious belief",
  "prayer history",
  "private bible question",
  "church membership",
  "child ministry record",
  "pastoral counseling",
  "private group activity"
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
  const opportunityScore = Number((Math.log10(input.impressions + 1) * (0.4 + visibility) * (1 + missedClicks * 6)).toFixed(4));
  return {
    ...input,
    clickThroughRate,
    opportunityScore,
    recommendedAction:
      input.existingPage && input.impressions >= 50
        ? "improve_existing"
        : !input.existingPage && input.impressions >= 100
          ? "create_people_first_page"
          : "monitor"
  };
}

export function assertAudiencePlanAllowed(input: { audienceDescription: string; sourceData: readonly string[] }): void {
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
  if (Object.keys(input.approvedFacts).length === 0) throw new Error("A content brief requires approved church facts");
  if (input.recommendedSections.length < 3) throw new Error("A people-first page requires substantive sections");
  return { ...input, status: "draft", requiresHumanReview: true, publishAutomatically: false };
}

export interface ReadinessItem {
  key: string;
  label: string;
  complete: boolean;
  evidence?: string;
}

export function evaluateReadiness(items: readonly ReadinessItem[]): { ready: boolean; completionPercent: number; missing: string[] } {
  const complete = items.filter((item) => item.complete).length;
  return {
    ready: items.length > 0 && complete === items.length,
    completionPercent: items.length ? Math.round((complete / items.length) * 100) : 0,
    missing: items.filter((item) => !item.complete).map((item) => item.label)
  };
}

export const googleBusinessProfileReadinessTemplate: readonly ReadinessItem[] = [
  { key: "identity", label: "Official church name approved by central leadership", complete: false },
  { key: "venue", label: "Accurate rented-facility representation and evidence", complete: false },
  { key: "hours", label: "Service hours match actual staffed hours", complete: false },
  { key: "signage", label: "On-site directional signage and welcome desk documented", complete: false },
  { key: "category", label: "Primary category reviewed for accuracy", complete: false },
  { key: "ownership", label: "Church-controlled recovery owners assigned", complete: false }
];

export const adGrantReadinessTemplate: readonly ReadinessItem[] = [
  { key: "eligibility", label: "Google for Nonprofits eligibility confirmed", complete: false },
  { key: "domain", label: "Church-controlled domain and administrative email", complete: false },
  { key: "mission", label: "Mission and substantive public content published", complete: false },
  { key: "measurement", label: "Meaningful conversion tracking configured", complete: false },
  { key: "keywords", label: "Specific high-intent keyword groups reviewed", complete: false },
  { key: "policy", label: "Advertising and sensitive-audience policy approved", complete: false }
];
