import { describe, expect, it } from "vitest";
import { createPickupCredential, verifyPickupCredential } from "@church/kids-checkin";
import { createPeopleFirstContentBrief, scoreSearchOpportunity } from "@church/outreach";
import { base64UrlToUint8Array, normalizePushSubscription } from "@church/pwa";
import { buildRealtimeTopic, parseRealtimeTopic, sanitizePresenceState } from "@church/realtime";

describe("master ecosystem packages", () => {
  it("creates and verifies a short-lived pickup credential without making it release authority", () => {
    const secret = "a".repeat(48);
    const token = createPickupCredential({
      keyId: "sunday-key-1",
      secret,
      serviceSessionId: "service-2026-09-06",
      householdId: "household-1",
      expiresAt: new Date(Date.now() + 60_000),
    });
    const payload = verifyPickupCredential({
      token,
      resolveSecret: (keyId) => (keyId === "sunday-key-1" ? secret : undefined),
      expectedServiceSessionId: "service-2026-09-06",
    });
    expect(payload.householdId).toBe("household-1");
  });

  it("normalizes push subscriptions and VAPID public keys", () => {
    const subscription = normalizePushSubscription({
      endpoint: "https://fcm.googleapis.com/fcm/send/synthetic-subscription-1",
      expirationTime: null,
      keys: { p256dh: "abc", auth: "def" },
    });
    expect(subscription.endpoint).toContain("fcm.googleapis.com");
    expect(base64UrlToUint8Array("AQAB").length).toBeGreaterThan(0);
  });

  it("keeps realtime topics private and presence sparse", () => {
    const topic = buildRealtimeTopic("channel", "sample-channel");
    expect(parseRealtimeTopic(topic)).toEqual({ scope: "channel", id: "sample-channel" });
    const state = sanitizePresenceState({
      profileId: "profile-1",
      displayLabel: "Sample Member",
      activity: "typing",
      clientInstanceId: "browser-1",
      updatedAt: "2026-08-02T12:00:00.000Z",
    });
    expect(state.displayLabel).toBe("Sample Member");
  });

  it("creates review-only people-first outreach briefs from aggregate performance", () => {
    const scored = scoreSearchOpportunity({
      query: "church for families in lowell",
      impressions: 240,
      clicks: 4,
      averagePosition: 8.4,
      locality: "Lowell, Massachusetts",
    });
    expect(scored.recommendedAction).toBe("create_people_first_page");
    const brief = createPeopleFirstContentBrief({
      title: "A practical guide for families visiting church in Lowell",
      searchIntent: scored.query,
      locality: scored.locality,
      approvedFacts: { serviceTime: "Sunday at 10:00 AM" },
      recommendedSections: ["What to expect", "Kids Kingdom", "Directions"],
    });
    expect(brief.publishAutomatically).toBe(false);
  });
});
