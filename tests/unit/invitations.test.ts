import { describe, expect, it } from "vitest";
import { createInvitationToken, invitationTokenMatches, isInvitationUsable } from "@church/authentication";

const pepper = "local-test-pepper-that-is-more-than-thirty-two-characters";

describe("invitation tokens", () => {
  it("stores a different hash rather than the raw token", () => {
    const invitation = createInvitationToken({ pepper, now: new Date("2026-08-02T12:00:00Z") });
    expect(invitation.token).not.toBe(invitation.tokenHash);
    expect(invitation.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(invitationTokenMatches({ token: invitation.token, expectedHash: invitation.tokenHash, pepper })).toBe(true);
  });

  it("rejects used, revoked, and expired invitations", () => {
    const expiresAt = new Date("2026-08-03T12:00:00Z");
    const now = new Date("2026-08-04T12:00:00Z");
    expect(isInvitationUsable({ expiresAt, now })).toBe(false);
    expect(isInvitationUsable({ expiresAt: new Date("2026-08-05T12:00:00Z"), usedAt: now, now })).toBe(false);
    expect(isInvitationUsable({ expiresAt: new Date("2026-08-05T12:00:00Z"), revokedAt: now, now })).toBe(false);
  });
});
