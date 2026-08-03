export function randomToken(bytes = 32): string {
  const values = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...values)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashInvitationToken(token: string, pepper: string): Promise<string> {
  if (pepper.length < 32) throw new Error("INVITATION_TOKEN_PEPPER must be at least 32 characters");
  return sha256Hex(`${pepper}:${token}`);
}
