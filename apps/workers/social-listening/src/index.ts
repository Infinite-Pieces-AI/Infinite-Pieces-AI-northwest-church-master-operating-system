import { assertPublicSourceAllowed } from "@church/outreach";
import {
  claimOutboxEvents,
  completeOutboxEvent,
  failOutboxEvent,
  runWorker,
} from "@church/worker-runtime";

function allowedProxy(rawUrl: string, allowedHosts: string): URL {
  const url = new URL(rawUrl);
  const hosts = allowedHosts.split(",").map((value) => value.trim()).filter(Boolean);
  if (url.protocol !== "https:" || !hosts.includes(url.hostname)) {
    throw new Error("Social-listening proxy must use HTTPS and an explicitly allowed host");
  }
  return url;
}

await runWorker("social-listening", async (context) => {
  const events = await claimOutboxEvents(context, ["outreach.social_scan_requested"]);
  const endpoint = process.env.SOCIAL_LISTENING_PROXY_URL;
  const token = process.env.SOCIAL_LISTENING_PROXY_TOKEN;
  const allowedHosts = process.env.SOCIAL_LISTENING_ALLOWED_HOSTS ?? "";
  for (const event of events) {
    try {
      if (process.env.OUTREACH_SOURCE_SCAN_ENABLED !== "true" || !endpoint || !token) {
        context.log("social_listening.disabled", { eventId: event.id });
        await completeOutboxEvent(context, event.id);
        continue;
      }
      const sourceUrl = typeof event.payload.source_url === "string" ? event.payload.source_url : "";
      assertPublicSourceAllowed({
        url: sourceUrl,
        publiclyAccessible: event.payload.publicly_accessible === true,
        privateGroup: event.payload.private_group === true,
        requiresBypass: event.payload.requires_bypass === true,
        containsRestrictedData: event.payload.contains_restricted_data === true,
      });
      const proxy = allowedProxy(endpoint, allowedHosts);
      const response = await fetch(proxy, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ sourceUrl, publicOnly: true, includeDirectMessages: false, includePrivateGroups: false }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`Social-listening proxy returned ${response.status}`);
      const payload = (await response.json()) as { publicItems?: unknown[] };
      context.log("social_listening.public_items_received", { eventId: event.id, count: Math.min(payload.publicItems?.length ?? 0, 100) });
      // Provider-specific public rows are normalized by the public-web-listening ingestion path.
      // This worker never stores direct messages, hidden groups, follower lists, or person dossiers.
      await completeOutboxEvent(context, event.id);
    } catch (error) {
      await failOutboxEvent(context, event.id, error instanceof Error ? error.message : "Social listening failed");
    }
  }
  return { claimed: events.length };
});
