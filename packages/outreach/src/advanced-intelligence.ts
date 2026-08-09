export interface MinistryOpportunityInputs {
  topic: string;
  churchVisitIntent: number;
  localRelevance: number;
  demandGrowth: number;
  rankingOpportunity: number;
  contentGap: number;
  conversionFit: number;
  freshness: number;
  sensitivityRisk: number;
  confidence: number;
  source: string;
  dateRange: { start: string; end: string };
}

export interface MinistryOpportunityContribution {
  key: keyof Omit<
    MinistryOpportunityInputs,
    "topic" | "sensitivityRisk" | "confidence" | "source" | "dateRange"
  >;
  label: string;
  input: number;
  weight: number;
  contribution: number;
}

export interface MinistryOpportunityAssessment {
  topic: string;
  priority: number;
  weightedBase: number;
  riskPenalty: number;
  confidence: number;
  source: string;
  dateRange: { start: string; end: string };
  contributions: MinistryOpportunityContribution[];
  explanation: string[];
  recommendedActions: string[];
}

const weights = {
  churchVisitIntent: 0.25,
  localRelevance: 0.2,
  demandGrowth: 0.15,
  rankingOpportunity: 0.15,
  contentGap: 0.1,
  conversionFit: 0.1,
  freshness: 0.05,
} as const;

const labels: Record<keyof typeof weights, string> = {
  churchVisitIntent: "Church / visit intent",
  localRelevance: "Local relevance",
  demandGrowth: "Observed demand or growth",
  rankingOpportunity: "Ranking opportunity",
  contentGap: "Content gap",
  conversionFit: "Voluntary next-step fit",
  freshness: "Freshness",
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
}

export function scoreMinistryOpportunity(
  input: MinistryOpportunityInputs,
): MinistryOpportunityAssessment {
  const contributions = (Object.keys(weights) as Array<keyof typeof weights>).map((key) => {
    const normalized = clamp(input[key]);
    const weight = weights[key];
    return {
      key,
      label: labels[key],
      input: normalized,
      weight,
      contribution: Number((normalized * weight).toFixed(2)),
    };
  });
  const weightedBase = Number(
    contributions.reduce((sum, item) => sum + item.contribution, 0).toFixed(2),
  );
  const riskPenalty = Number((clamp(input.sensitivityRisk) * 0.25).toFixed(2));
  const priority = clamp(weightedBase - riskPenalty);
  const explanation = contributions
    .filter((item) => item.input >= 70)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 5)
    .map(
      (item) =>
        `${item.label}: ${item.input}/100 contributed ${item.contribution.toFixed(1)} points.`,
    );
  if (riskPenalty > 0)
    explanation.push(
      `Sensitivity and policy risk reduced the score by ${riskPenalty.toFixed(1)} points.`,
    );
  const recommendedActions =
    priority >= 80
      ? [
          "Review the source evidence today",
          "Improve or create the people-first public answer",
          "Attach a voluntary next step",
          "Assign a named human reviewer",
          "Measure aggregate outcomes",
        ]
      : priority >= 60
        ? [
            "Verify the content gap",
            "Improve the relevant public page",
            "Monitor the next reporting period",
          ]
        : ["Monitor without creating urgency", "Reassess when stronger demand or evidence exists"];
  return {
    topic: input.topic,
    priority,
    weightedBase,
    riskPenalty,
    confidence: clamp(input.confidence),
    source: input.source,
    dateRange: input.dateRange,
    contributions,
    explanation,
    recommendedActions,
  };
}

export interface BusinessProfileEligibilityInput {
  officialIdentityApproved: boolean;
  venueRepresentationAuthorized: boolean;
  representativesPresentDuringHours: boolean;
  serviceHoursVerified: boolean;
  signageEvidenceAvailable: boolean;
  churchOwnedRecoveryAccess: boolean;
  centralLeadershipApproved: boolean;
}

export function evaluateBusinessProfileEligibility(input: BusinessProfileEligibilityInput): {
  status: "blocked" | "review_required" | "eligible_for_submission_review";
  completionPercent: number;
  missing: string[];
} {
  const checks = [
    ["Official identity approved", input.officialIdentityApproved],
    ["Rented-venue representation authorized", input.venueRepresentationAuthorized],
    ["Church representatives present during stated hours", input.representativesPresentDuringHours],
    ["Service hours verified", input.serviceHoursVerified],
    ["Signage evidence available", input.signageEvidenceAvailable],
    ["Two church-controlled recovery owners", input.churchOwnedRecoveryAccess],
    ["Central leadership approval", input.centralLeadershipApproved],
  ] as const;
  const missing = checks.filter(([, complete]) => !complete).map(([label]) => label);
  const completionPercent = Math.round(((checks.length - missing.length) / checks.length) * 100);
  return {
    status:
      missing.length === 0
        ? "eligible_for_submission_review"
        : completionPercent >= 70
          ? "review_required"
          : "blocked",
    completionPercent,
    missing,
  };
}
