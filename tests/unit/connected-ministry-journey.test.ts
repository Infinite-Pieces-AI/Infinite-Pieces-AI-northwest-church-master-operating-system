import { describe, expect, it } from "vitest";
import {
  forbiddenAnalyticsProperties,
  sanitizePublicAnalyticsProperties,
} from "../../packages/analytics/src/index";
import {
  evaluateBusinessProfileEligibility,
  scoreMinistryOpportunity,
} from "../../packages/outreach/src/index";
import {
  prayerRequestSchema,
  publicQuestionSchema,
  visitRequestSchema,
} from "../../packages/validation/src/index";

describe("connected ministry journey contracts", () => {
  it("keeps the visit form minimal and contact-method specific", () => {
    const result = visitRequestSchema.parse({
      firstName: "Jordan",
      lastName: "",
      contactMethod: "email",
      email: "jordan@example.invalid",
      phone: "",
      partySize: 2,
      childrenAttending: true,
      practicalNote: "Accessible entrance question",
      requestedNextStep: "plan_visit",
      communicationConsent: true,
      sourcePath: "/plan-a-visit",
      website: "",
    });
    expect(result.lastName).toBeUndefined();
    expect(result.contactMethod).toBe("email");
  });

  it("separates general questions from prayer", () => {
    const question = publicQuestionSchema.parse({
      firstName: "Sample",
      contactMethod: "phone",
      email: "",
      phone: "555-0100",
      topic: "online",
      message: "Is a leader-reviewed online Bible conversation available?",
      communicationConsent: true,
      sourcePath: "/online-bible-study",
      website: "",
    });
    expect(question.topic).toBe("online");
    expect(question).not.toHaveProperty("prayerText");
  });

  it("allows prayer without a marketing follow-up request", () => {
    const prayer = prayerRequestSchema.parse({
      firstName: "",
      prayerText: "Please pray for wisdom.",
      responseRequested: false,
      email: "",
      phone: "",
      consentToContact: false,
      sourcePath: "/request-prayer",
      website: "",
    });
    expect(prayer.responseRequested).toBe(false);
    expect(prayer.email).toBeUndefined();
  });

  it("requires consent when someone asks for a prayer response", () => {
    const result = prayerRequestSchema.safeParse({
      prayerText: "Please pray for wisdom.",
      responseRequested: true,
      contactMethod: "email",
      email: "sample@example.invalid",
      consentToContact: false,
    });
    expect(result.success).toBe(false);
  });

  it("removes prayer, child, counseling, and inferred-belief properties from public analytics", () => {
    const sanitized = sanitizePublicAnalyticsProperties({
      path: "/request-prayer",
      prayer_text: "private",
      child_name: "private",
      counseling_content: "private",
      religious_belief: "private",
    });
    expect(sanitized).toEqual({ path: "/request-prayer" });
    expect(forbiddenAnalyticsProperties).toContain("prayer_text");
  });

  it("produces an explainable topic score and deducts sensitivity risk", () => {
    const lowRisk = scoreMinistryOpportunity({
      topic: "family church in Lowell",
      churchVisitIntent: 95,
      localRelevance: 100,
      demandGrowth: 80,
      rankingOpportunity: 90,
      contentGap: 85,
      conversionFit: 90,
      freshness: 80,
      sensitivityRisk: 0,
      confidence: 78,
      source: "Aggregate test data",
      dateRange: { start: "2026-07-01", end: "2026-07-31" },
    });
    const highRisk = scoreMinistryOpportunity({
      ...lowRisk.contributions.reduce(
        (accumulator, item) => ({ ...accumulator, [item.key]: item.input }),
        {} as Record<string, number>,
      ),
      topic: lowRisk.topic,
      sensitivityRisk: 100,
      confidence: 78,
      source: lowRisk.source,
      dateRange: lowRisk.dateRange,
    } as Parameters<typeof scoreMinistryOpportunity>[0]);
    expect(lowRisk.priority).toBeGreaterThan(highRisk.priority);
    expect(lowRisk.contributions).toHaveLength(7);
    expect(lowRisk.explanation.length).toBeGreaterThan(0);
  });

  it("blocks a Business Profile submission when rented-venue governance is incomplete", () => {
    const result = evaluateBusinessProfileEligibility({
      officialIdentityApproved: true,
      venueRepresentationAuthorized: false,
      representativesPresentDuringHours: true,
      serviceHoursVerified: true,
      signageEvidenceAvailable: false,
      churchOwnedRecoveryAccess: false,
      centralLeadershipApproved: false,
    });
    expect(result.status).not.toBe("eligible_for_submission_review");
    expect(result.missing).toContain("Rented-venue representation authorized");
  });
});
