import { describe, expect, it } from "vitest";
import {
  normalizePushSubscription,
  parseAllowedPushHosts,
  validatePushEndpoint,
} from "../src/index";

describe("web-push endpoint boundaries", () => {
  it("accepts an approved provider endpoint", () => {
    expect(validatePushEndpoint("https://fcm.googleapis.com/fcm/send/synthetic").hostname).toBe(
      "fcm.googleapis.com",
    );
  });

  it("rejects an arbitrary HTTPS endpoint to prevent server-side request abuse", () => {
    expect(() => validatePushEndpoint("https://example.invalid/collect")).toThrow(/not approved/i);
  });

  it("supports an explicit deployment allowlist", () => {
    const hosts = parseAllowedPushHosts("push.provider.example,*.notify.example");
    expect(validatePushEndpoint("https://tenant.notify.example/push/1", hosts).hostname).toBe(
      "tenant.notify.example",
    );
  });

  it("normalizes a browser subscription only after endpoint validation", () => {
    const subscription = normalizePushSubscription({
      endpoint: "https://updates.push.services.mozilla.com/wpush/v2/synthetic",
      expirationTime: null,
      keys: { p256dh: "synthetic-p256dh", auth: "synthetic-auth" },
    });
    expect(subscription.keys.auth).toBe("synthetic-auth");
  });
});
