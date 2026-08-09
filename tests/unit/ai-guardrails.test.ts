import { describe, expect, it } from "vitest";
import { assertAiRequestAllowed, buildBibleCompanionSystemPrompt } from "@church/ai";

describe("AI guardrails", () => {
  it("rejects prohibited private data classes", () => {
    expect(() =>
      assertAiRequestAllowed({
        requestedDataClasses: ["published_weekly_lesson", "child_record"],
      }),
    ).toThrow(/prohibited/i);
  });

  it("requires generated explanation to remain distinct from Scripture and church teaching", () => {
    const prompt = buildBibleCompanionSystemPrompt();
    expect(prompt).toContain("SCRIPTURE");
    expect(prompt).toContain("CHURCH TEACHING");
    expect(prompt).toContain("AI EXPLANATION");
  });
});
