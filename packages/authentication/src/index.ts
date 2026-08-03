import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export interface InvitationTokenPair {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export function hashInvitationToken(token: string, pepper: string): string {
  if (pepper.length < 32) throw new Error("Invitation pepper must be at least 32 characters");
  return createHash("sha256").update(`${pepper}:${token}`, "utf8").digest("hex");
}

export function createInvitationToken(input: { pepper: string; ttlHours?: number; now?: Date }): InvitationTokenPair {
  const now = input.now ?? new Date();
  const ttlHours = input.ttlHours ?? 72;
  if (ttlHours < 1 || ttlHours > 168) throw new Error("Invitation TTL must be between 1 and 168 hours");

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashInvitationToken(token, input.pepper);
  const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
  return { token, tokenHash, expiresAt };
}

export function invitationTokenMatches(input: { token: string; expectedHash: string; pepper: string }): boolean {
  const actual = Buffer.from(hashInvitationToken(input.token, input.pepper), "hex");
  const expected = Buffer.from(input.expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export interface VerifiedClaims {
  sub: string;
  email?: string;
  aal?: "aal1" | "aal2";
  exp?: number;
}

export function isInvitationUsable(input: { expiresAt: Date; usedAt?: Date | null; revokedAt?: Date | null; now?: Date }): boolean {
  const now = input.now ?? new Date();
  return !input.usedAt && !input.revokedAt && input.expiresAt.getTime() > now.getTime();
}
