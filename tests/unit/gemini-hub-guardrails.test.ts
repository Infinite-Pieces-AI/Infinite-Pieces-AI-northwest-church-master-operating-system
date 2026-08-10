import { describe, expect, it } from "vitest";
import { assertAiRequestAllowed } from "../../packages/ai/src/index";
import { parseJsonText } from "../../apps/church-hub/lib/ai/gemini";

describe("Gemini Church Hub guardrails", () => {
  it("parses JSON-only responses even when a provider wraps them in a code fence", () => {
    expect(
      parseJsonText<Array<{ date: string; role: string; assignedName: string }>>(
        '```json\n[{"date":"2026-09-06","role":"Welcome","assignedName":"Jordan Member"}]\n```',
      ),
    ).toEqual([
      { date: "2026-09-06", role: "Welcome", assignedName: "Jordan Member" },
    ]);
  });

  it("keeps private channel messages prohibited in the general AI policy", () => {
    expect(() =>
      assertAiRequestAllowed({
        requestedDataClasses: ["private_channel_message"],
        publishAutomatically: false,
      }),
    ).toThrow(/prohibited data class/i);
  });

  it("keeps independent minor-facing AI blocked", () => {
    expect(() =>
      assertAiRequestAllowed({
        requestedDataClasses: [],
        publishAutomatically: false,
        recipientIsMinor: true,
      }),
    ).toThrow(/minors/i);
  });

  it("keeps automatic AI publication blocked", () => {
    expect(() =>
      assertAiRequestAllowed({
        requestedDataClasses: [],
        publishAutomatically: true,
      }),
    ).toThrow(/publish/i);
  });
});
