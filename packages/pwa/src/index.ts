export const OFFLINE_CACHE_VERSION = "church-hub-offline-v2";

/**
 * Only deliberately low-sensitivity, non-personalized resources may be stored
 * by the service worker. Private messages, household data, child status,
 * invitations, auth responses, and personalized dashboards are network-only.
 */
export const offlineSafePaths = [
  "/api/offline/service-schedule",
  "/api/offline/weekly-lesson",
  "/offline",
] as const;

export type OfflineSafePath = (typeof offlineSafePaths)[number];

export function isOfflineSafePath(pathname: string): pathname is OfflineSafePath {
  return offlineSafePaths.includes(pathname as OfflineSafePath);
}

export function base64UrlToUint8Array(value: string): Uint8Array {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const normalized = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  if (typeof globalThis.atob !== "function") {
    throw new Error("This runtime does not provide a base64 decoder");
  }
  const decoded = globalThis.atob(normalized);
  return Uint8Array.from(decoded, (character: string) => character.charCodeAt(0));
}

export const defaultWebPushEndpointHosts = [
  "fcm.googleapis.com",
  "updates.push.services.mozilla.com",
  "web.push.apple.com",
] as const;

export function parseAllowedPushHosts(value: string | undefined): string[] {
  const configured = (value ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  return configured.length ? [...new Set(configured)] : [...defaultWebPushEndpointHosts];
}

export function validatePushEndpoint(
  endpoint: string,
  allowedHosts: readonly string[] = defaultWebPushEndpointHosts,
): URL {
  let parsed: URL;
  try {
    parsed = new URL(endpoint);
  } catch {
    throw new Error("Push subscription endpoint is not a valid URL");
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    throw new Error("Push subscription endpoint must use credential-free HTTPS");
  }
  if (parsed.port && parsed.port !== "443") {
    throw new Error("Push subscription endpoint must use the standard HTTPS port");
  }
  const hostname = parsed.hostname.toLowerCase();
  const normalizedHosts = allowedHosts.map((host) => host.trim().toLowerCase()).filter(Boolean);
  const permitted = normalizedHosts.some((host) => {
    if (host.startsWith("*.")) {
      const suffix = host.slice(1);
      return hostname.endsWith(suffix) && hostname.length > suffix.length;
    }
    return hostname === host;
  });
  if (!permitted) throw new Error("Push subscription endpoint host is not approved");
  return parsed;
}

export interface BrowserPushSubscription {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function normalizePushSubscription(
  value: unknown,
  allowedHosts: readonly string[] = defaultWebPushEndpointHosts,
): BrowserPushSubscription {
  if (!value || typeof value !== "object") throw new Error("Push subscription is missing");
  const candidate = value as {
    endpoint?: unknown;
    expirationTime?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
  };
  if (typeof candidate.endpoint !== "string") {
    throw new Error("Push subscription endpoint is missing");
  }
  validatePushEndpoint(candidate.endpoint, allowedHosts);
  if (
    !candidate.keys ||
    typeof candidate.keys.p256dh !== "string" ||
    typeof candidate.keys.auth !== "string"
  ) {
    throw new Error("Push subscription encryption keys are missing");
  }
  if (
    candidate.keys.p256dh.length > 512 ||
    candidate.keys.auth.length > 256 ||
    candidate.endpoint.length > 2048
  ) {
    throw new Error("Push subscription exceeds allowed limits");
  }
  return {
    endpoint: candidate.endpoint,
    expirationTime: typeof candidate.expirationTime === "number" ? candidate.expirationTime : null,
    keys: { p256dh: candidate.keys.p256dh, auth: candidate.keys.auth },
  };
}

export const offlineSafeResponseHeaders = {
  "Cache-Control": "private, max-age=0, must-revalidate",
  "X-Church-Offline-Safe": "true",
  "X-Content-Type-Options": "nosniff",
} as const;
