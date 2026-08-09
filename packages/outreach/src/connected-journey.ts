export const meaningfulPublicEventNames = [
  "sunday_details_viewed",
  "directions_clicked",
  "calendar_added",
  "plan_visit_started",
  "plan_visit_submitted",
  "question_submitted",
  "bible_study_requested",
  "online_conversation_requested",
  "event_registered",
  "member_access_requested",
  "visitor_pathway_selected",
  "visitor_pathway_opened",
] as const;
export type MeaningfulPublicEventName = (typeof meaningfulPublicEventNames)[number];

const prohibitedPropertyFragments = [
  "prayer",
  "religion",
  "belief",
  "counsel",
  "diagnosis",
  "child_name",
  "child_age",
  "custody",
  "medical",
  "safeguarding",
  "message_body",
  "private_group",
  "member_email",
] as const;

export function assertMeaningfulPublicEventName(
  value: string,
): asserts value is MeaningfulPublicEventName {
  if (!meaningfulPublicEventNames.includes(value as MeaningfulPublicEventName)) {
    throw new Error(`Unsupported public analytics event: ${value}`);
  }
}

export function sanitizePublicEventProperties(
  properties: Readonly<Record<string, unknown>>,
): Record<string, string | number | boolean | null> {
  const output: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(properties)) {
    const normalizedKey = key.trim().toLowerCase().slice(0, 80);
    if (!normalizedKey) continue;
    if (prohibitedPropertyFragments.some((fragment) => normalizedKey.includes(fragment))) {
      throw new Error(`Sensitive analytics property is prohibited: ${normalizedKey}`);
    }
    if (typeof value === "string") output[normalizedKey] = value.slice(0, 200);
    else if (typeof value === "number" && Number.isFinite(value)) output[normalizedKey] = value;
    else if (typeof value === "boolean" || value === null) output[normalizedKey] = value;
  }
  return output;
}

export interface MinistryOpportunityInputs {
  churchVisitIntent: number;
  localRelevance: number;
  observedDemandGrowth: number;
  rankingOpportunity: number;
  contentGap: number;
  conversionFit: number;
  freshness: number;
  sensitivityPolicyRisk: number;
  confidence: number;
}

export interface MinistryOpportunityScore extends MinistryOpportunityInputs {
  priority: number;
  positiveSubtotal: number;
  riskDeduction: number;
  weights: Readonly<Record<Exclude<keyof MinistryOpportunityInputs, "confidence">, number>>;
  explanation: string[];
}

const opportunityWeights = {
  churchVisitIntent: 0.25,
  localRelevance: 0.2,
  observedDemandGrowth: 0.15,
  rankingOpportunity: 0.15,
  contentGap: 0.1,
  conversionFit: 0.1,
  freshness: 0.05,
  sensitivityPolicyRisk: -0.2,
} as const;

function score100(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function scoreMinistryOpportunity(
  input: MinistryOpportunityInputs,
): MinistryOpportunityScore {
  const normalized: MinistryOpportunityInputs = {
    churchVisitIntent: score100(input.churchVisitIntent),
    localRelevance: score100(input.localRelevance),
    observedDemandGrowth: score100(input.observedDemandGrowth),
    rankingOpportunity: score100(input.rankingOpportunity),
    contentGap: score100(input.contentGap),
    conversionFit: score100(input.conversionFit),
    freshness: score100(input.freshness),
    sensitivityPolicyRisk: score100(input.sensitivityPolicyRisk),
    confidence: score100(input.confidence),
  };
  const positiveSubtotal =
    normalized.churchVisitIntent * opportunityWeights.churchVisitIntent +
    normalized.localRelevance * opportunityWeights.localRelevance +
    normalized.observedDemandGrowth * opportunityWeights.observedDemandGrowth +
    normalized.rankingOpportunity * opportunityWeights.rankingOpportunity +
    normalized.contentGap * opportunityWeights.contentGap +
    normalized.conversionFit * opportunityWeights.conversionFit +
    normalized.freshness * opportunityWeights.freshness;
  const riskDeduction =
    normalized.sensitivityPolicyRisk * Math.abs(opportunityWeights.sensitivityPolicyRisk);
  const priority = score100(
    (positiveSubtotal - riskDeduction) * (0.6 + normalized.confidence / 250),
  );
  const explanation = [
    `Church or visit intent contributed ${Math.round(normalized.churchVisitIntent * opportunityWeights.churchVisitIntent)} points.`,
    `Local relevance contributed ${Math.round(normalized.localRelevance * opportunityWeights.localRelevance)} points.`,
    `Observed demand or growth contributed ${Math.round(normalized.observedDemandGrowth * opportunityWeights.observedDemandGrowth)} points.`,
    `Ranking opportunity contributed ${Math.round(normalized.rankingOpportunity * opportunityWeights.rankingOpportunity)} points.`,
    `Content gap and conversion fit contributed ${Math.round(normalized.contentGap * opportunityWeights.contentGap + normalized.conversionFit * opportunityWeights.conversionFit)} points.`,
    `Sensitivity or policy risk deducted ${Math.round(riskDeduction)} points.`,
    `Confidence is ${normalized.confidence}%; the score describes the topic or page opportunity, never a person.`,
  ];
  return {
    ...normalized,
    priority,
    positiveSubtotal: Number(positiveSubtotal.toFixed(2)),
    riskDeduction: Number(riskDeduction.toFixed(2)),
    weights: opportunityWeights,
    explanation,
  };
}

export const approvedAiVisibilityPromptSet = [
  "church near Lowell Massachusetts",
  "family church in Lowell",
  "church with kids ministry Lowell",
  "Sunday worship Lowell MA",
  "Bible study Lowell",
  "teen ministry near Lowell",
  "young adult Christian community Lowell",
  "online Bible study Massachusetts",
  "church community serving Lowell",
  "what happens at a church service",
  "can I attend church alone",
] as const;

export interface BusinessProfileEligibilityInput {
  addressAuthorized: boolean;
  representativesPresentDuringHours: boolean;
  signageVerified: boolean;
  centralIdentityApproved: boolean;
  recoveryOwnersDocumented: boolean;
  venueRelationship: "owned" | "leased" | "rented_event_space" | "other";
}

export function evaluateBusinessProfileEligibility(input: BusinessProfileEligibilityInput): {
  eligible: boolean;
  requiresLegalOrPolicyReview: boolean;
  missing: string[];
  explanation: string;
} {
  const checks: Array<[boolean, string]> = [
    [input.addressAuthorized, "Address representation authorization"],
    [input.representativesPresentDuringHours, "In-person representatives during stated hours"],
    [input.signageVerified, "Verifiable Sunday signage"],
    [input.centralIdentityApproved, "Central church identity approval"],
    [input.recoveryOwnersDocumented, "At least two church-controlled recovery owners"],
  ];
  const missing = checks.filter(([complete]) => !complete).map(([, label]) => label);
  const requiresLegalOrPolicyReview =
    input.venueRelationship === "rented_event_space" || input.venueRelationship === "other";
  const eligible = missing.length === 0 && !requiresLegalOrPolicyReview;
  return {
    eligible,
    requiresLegalOrPolicyReview,
    missing,
    explanation: eligible
      ? "All configured eligibility gates passed. Final platform verification is still external to this application."
      : requiresLegalOrPolicyReview
        ? "The venue is rented or otherwise shared. Church leadership must document authority and review current platform policy before representing the address."
        : `Eligibility is blocked until ${missing.join(", ") || "the outstanding review"} is complete.`,
  };
}

const prohibitedAdPlanPatterns = [
  /member\s+(email|list|directory)/i,
  /prayer/i,
  /bible[- ]study[- ]request/i,
  /likely\s+christian/i,
  /spiritually\s+(vulnerable|struggling)/i,
  /lookalike/i,
  /private\s+(hub|group|message)/i,
  /pastoral/i,
  /counsel/i,
  /child\s+record/i,
  /religious\s+belief/i,
] as const;

export function assertContextualCampaignPlan(input: {
  description: string;
  dataSources: readonly string[];
  targetMethod: string;
}): void {
  const combined = `${input.description} ${input.dataSources.join(" ")} ${input.targetMethod}`;
  const prohibited = prohibitedAdPlanPatterns.find((pattern) => pattern.test(combined));
  if (prohibited) {
    throw new Error(
      "Campaign planning may not use sensitive church, prayer, pastoral, child, or inferred-belief data.",
    );
  }
  if (!/context|keyword|geograph|public page|public event|organic/i.test(combined)) {
    throw new Error(
      "Campaign planning requires a contextual, geographic, organic, or public-event basis.",
    );
  }
}

export interface SiteQualityFindingInput {
  pageUrl: string;
  statusCode: number;
  title?: string;
  description?: string;
  canonical?: string;
  links?: readonly { href: string; statusCode?: number; redirectCount?: number }[];
  images?: readonly { src: string; alt?: string; width?: number; height?: number }[];
  structuredDataTypes?: readonly string[];
  responseMilliseconds?: number;
  wordCount?: number;
  indexable?: boolean;
}

export interface SiteQualityFinding {
  findingType:
    | "broken_link"
    | "missing_title"
    | "missing_description"
    | "canonical_conflict"
    | "redirect_chain"
    | "missing_structured_data"
    | "image_missing_dimensions"
    | "image_missing_alt"
    | "thin_page"
    | "slow_response"
    | "indexability_conflict";
  severity: "info" | "warning" | "high" | "critical";
  summary: string;
  evidence: Record<string, unknown>;
}

export function evaluatePageQuality(input: SiteQualityFindingInput): SiteQualityFinding[] {
  const findings: SiteQualityFinding[] = [];
  if (input.statusCode >= 400) {
    findings.push({
      findingType: "indexability_conflict",
      severity: "critical",
      summary: `Page returned HTTP ${input.statusCode}.`,
      evidence: { statusCode: input.statusCode },
    });
  }
  if (!input.title?.trim())
    findings.push({
      findingType: "missing_title",
      severity: "high",
      summary: "Page has no descriptive title.",
      evidence: {},
    });
  if (!input.description?.trim())
    findings.push({
      findingType: "missing_description",
      severity: "warning",
      summary: "Page has no meta description.",
      evidence: {},
    });
  if (input.canonical && new URL(input.canonical, input.pageUrl).toString() !== input.pageUrl) {
    findings.push({
      findingType: "canonical_conflict",
      severity: "high",
      summary: "Canonical URL does not match the crawled page.",
      evidence: { canonical: input.canonical },
    });
  }
  for (const link of input.links ?? []) {
    if ((link.statusCode ?? 200) >= 400)
      findings.push({
        findingType: "broken_link",
        severity: "high",
        summary: `Broken link: ${link.href}`,
        evidence: { href: link.href, statusCode: link.statusCode },
      });
    if ((link.redirectCount ?? 0) > 1)
      findings.push({
        findingType: "redirect_chain",
        severity: "warning",
        summary: `Redirect chain detected for ${link.href}.`,
        evidence: { href: link.href, redirectCount: link.redirectCount },
      });
  }
  for (const image of input.images ?? []) {
    if (!image.alt?.trim())
      findings.push({
        findingType: "image_missing_alt",
        severity: "warning",
        summary: `Image lacks meaningful alt text: ${image.src}`,
        evidence: { src: image.src },
      });
    if (!image.width || !image.height)
      findings.push({
        findingType: "image_missing_dimensions",
        severity: "warning",
        summary: `Image does not reserve dimensions: ${image.src}`,
        evidence: { src: image.src },
      });
  }
  if (!(input.structuredDataTypes ?? []).length)
    findings.push({
      findingType: "missing_structured_data",
      severity: "info",
      summary: "No supported structured-data type was detected.",
      evidence: {},
    });
  if ((input.wordCount ?? 0) < 180)
    findings.push({
      findingType: "thin_page",
      severity: "warning",
      summary: "Page may not answer its visitor question substantively.",
      evidence: { wordCount: input.wordCount ?? 0 },
    });
  if ((input.responseMilliseconds ?? 0) > 2500)
    findings.push({
      findingType: "slow_response",
      severity: "high",
      summary: "Initial response exceeded 2.5 seconds in this crawl.",
      evidence: { responseMilliseconds: input.responseMilliseconds },
    });
  if (input.indexable === false)
    findings.push({
      findingType: "indexability_conflict",
      severity: "high",
      summary: "A public discovery page is not indexable.",
      evidence: {},
    });
  return findings;
}
