import { describe, expect, it } from "vitest";
import {
  assertNoIndividualReligiousProfile,
  assertPublicSourceAllowed,
  buildRespectfulResponseDraft,
  scorePublicConversationOpportunity,
} from "../../packages/outreach/src/index";
import { publicOpportunities } from "../../apps/outreach-command/lib/demo-data";

describe("Outreach Intelligence public-source guardrails", () => {
  it("scores a public Lowell church request as a high-priority opportunity", () => {
    const source = publicOpportunities[0];
    expect(source).toBeDefined();
    if (!source) return;
    const score = scorePublicConversationOpportunity(source);
    expect(score.localRelevance).toBe(100);
    expect(score.churchIntent).toBe(100);
    expect(score.priority).toBeGreaterThanOrEqual(80);
  });

  it("accepts an approved public HTTPS source", () => {
    expect(() =>
      assertPublicSourceAllowed({
        url: "https://example.invalid/public-feed",
        publiclyAccessible: true,
        privateGroup: false,
        requiresBypass: false,
        containsRestrictedData: false,
      }),
    ).not.toThrow();
  });

  it("rejects private or access-bypassed sources", () => {
    expect(() =>
      assertPublicSourceAllowed({
        url: "https://example.invalid/private-group",
        publiclyAccessible: false,
        privateGroup: true,
        requiresBypass: true,
        containsRestrictedData: false,
      }),
    ).toThrow(/Private, closed, or membership-only/);
  });

  it("rejects individual religious dossiers", () => {
    expect(() =>
      assertNoIndividualReligiousProfile({
        personIdentifier: "synthetic-person",
        inferredBeliefs: ["religious interest"],
      }),
    ).toThrow(/profiling/);
  });

  it("generates a disclosed, review-required response draft", () => {
    const draft = buildRespectfulResponseDraft({
      question: "Looking for a church in Lowell",
      approvedChurchName: "Boston Church Lowell",
      approvedServiceSummary: "Current service information is available on the public website.",
      approvedNextStepUrl: "https://example.invalid/plan-a-visit",
    });
    expect(draft.disclosure).toContain("transparent");
    expect(draft.requiresHumanReview).toBe(true);
    expect(draft.publishAutomatically).toBe(false);
  });
});
