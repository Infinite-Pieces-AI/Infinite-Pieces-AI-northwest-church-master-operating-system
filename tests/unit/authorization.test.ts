import { describe, expect, it } from "vitest";
import { hasPermission, requiresMfa } from "@church/authorization";

describe("authorization map", () => {
  it("does not grant a technical administrator pastoral or child permissions", () => {
    expect(hasPermission(["technical_admin"], "system.health.read")).toBe(true);
    expect(hasPermission(["technical_admin"], "child.read_linked")).toBe(false);
    expect(hasPermission(["technical_admin"], "moderation.review")).toBe(false);
  });

  it("requires MFA for every privileged role", () => {
    expect(requiresMfa(["content_editor"])).toBe(true);
    expect(requiresMfa(["minister"])).toBe(true);
    expect(requiresMfa(["member"])).toBe(false);
  });
});
