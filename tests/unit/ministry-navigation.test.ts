import { describe, expect, it } from "vitest";
import {
  navigationSafetyNote,
  recommendMinistryDestinations,
} from "../../packages/church-content/src/navigation";

describe("approved ministry navigation", () => {
  it("routes Scripture questions to the Bible journey for members", () => {
    const [result] = recommendMinistryDestinations({
      query: "I want to understand this week's Scripture passage",
      scope: "member",
      includePrivileged: false,
    });
    expect(result?.destination.id).toBe("bible-journey");
    expect(result?.explanation).toMatch(/Scripture|Bible/i);
  });

  it("routes a desire for connection to Fellowship", () => {
    const [result] = recommendMinistryDestinations({
      query: "I would like to meet people for a prayer walk or meal",
      scope: "member",
      includePrivileged: false,
    });
    expect(result?.destination.id).toBe("fellowship");
  });

  it("routes public questions about the app to member access", () => {
    const [result] = recommendMinistryDestinations({
      query: "How do I sign up for the member fellowship app?",
      scope: "public",
      includePrivileged: false,
    });
    expect(result?.destination.id).toBe("member-access");
  });

  it("does not expose privileged destinations by default", () => {
    const results = recommendMinistryDestinations({
      query: "I need search console and outreach operations",
      scope: "member",
      includePrivileged: false,
    });
    expect(results.some((row) => row.destination.privileged)).toBe(false);
  });

  it("adds a safety boundary without pretending the navigator is emergency support", () => {
    expect(navigationSafetyNote("There is immediate danger and someone may self-harm")).toMatch(
      /emergency|911|approved/i,
    );
  });
});
