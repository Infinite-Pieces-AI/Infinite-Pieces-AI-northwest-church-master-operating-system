import { describe, expect, it } from "vitest";
import { sanitizePublicAnalyticsProperties } from "@church/analytics";

describe("public analytics", () => {
  it("keeps only aggregate allowlisted fields and removes identity, child, and religious content", () => {
    const result = sanitizePublicAnalyticsProperties({
      path: "/plan-a-visit",
      campaign: "welcome-series",
      email: "person@example.invalid",
      prayer: "private text",
      child_id: "secret",
      religious_belief: "inferred",
    });

    expect(result).toEqual({
      path: "/plan-a-visit",
      campaign: "welcome-series",
    });
  });
});
