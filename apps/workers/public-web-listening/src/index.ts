import { createHash } from "node:crypto";
import {
  assertPublicSourceAllowed,
  publicSourceKinds,
  scorePublicConversationOpportunity,
  type PublicConversationSignal,
  type PublicSourceKind,
} from "@church/outreach";
import {
  claimOutboxEvents,
  completeOutboxEvent,
  failOutboxEvent,
  runWorker,
} from "@church/worker-runtime";

interface ProxyRow {
  sourceKind?: unknown;
  sourceLabel?: unknown;
  title?: unknown;
  excerpt?: unknown;
  publicUrl?: unknown;
  publishedAt?: unknown;
  locality?: unknown;
  explicitChurchRequest?: unknown;
  familyRelevance?: unknown;
  onlineMinistryIntent?: unknown;
  freshness?: unknown;
  replyOpportunity?: unknown;
  contentOpportunity?: unknown;
  searchOpportunity?: unknown;
  riskSensitivity?: unknown;
  themes?: unknown;
  publiclyAccessible?: unknown;
  privateGroup?: unknown;
  requiresBypass?: unknown;
  containsRestrictedData?: unknown;
}

function allowedProxy(rawUrl: string, allowedHosts: string): URL {
  const url = new URL(rawUrl);
  const hosts = allowedHosts.split(",").map((value) => value.trim()).filter(Boolean);
  if (url.protocol !== "https:" || !hosts.includes(url.hostname)) {
    throw new Error("Public-listening proxy must use HTTPS and an explicitly allowed host");
  }
  return url;
}

function score(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(100, Math.round(numeric))) : 0;
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function sourceKind(value: unknown): PublicSourceKind {
  if (typeof value === "string" && publicSourceKinds.includes(value as PublicSourceKind)) {
    return value as PublicSourceKind;
  }
  throw new Error("Unsupported public source kind");
}

await runWorker("public-web-listening", async (context) => {
  const events = await claimOutboxEvents(context, ["outreach.public_scan_requested"]);
  const enabled = process.env.OUTREACH_SOURCE_SCAN_ENABLED === "true";
  const endpoint = process.env.PUBLIC_LISTENING_PROXY_URL;
  const token = process.env.PUBLIC_LISTENING_PROXY_TOKEN;
  const allowedHosts = process.env.PUBLIC_LISTENING_ALLOWED_HOSTS ?? "";
  let imported = 0;

  for (const event of events) {
    try {
      if (!enabled || !endpoint || !token) {
        context.log("public_listening.disabled", { eventId: event.id });
        await completeOutboxEvent(context, event.id);
        continue;
      }
      const proxy = allowedProxy(endpoint, allowedHosts);
      const response = await fetch(proxy, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({
          connectorId: event.payload.connector_id,
          querySet: event.payload.query_set,
          limit: Math.min(100, Math.max(1, Number(event.payload.limit ?? 50))),
          publicOnly: true,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`Public-listening proxy returned ${response.status}`);
      const payload = (await response.json()) as { rows?: ProxyRow[] };
      const rows = (payload.rows ?? []).slice(0, 100).flatMap((row) => {
        const signal: PublicConversationSignal = {
          sourceKind: sourceKind(row.sourceKind),
          sourceLabel: text(row.sourceLabel, 160),
          title: text(row.title, 500),
          excerpt: text(row.excerpt, 2000),
          publicUrl: text(row.publicUrl, 2000),
          publishedAt: text(row.publishedAt, 80),
          locality: text(row.locality, 160) || "Unspecified",
          explicitChurchRequest: row.explicitChurchRequest === true,
          familyRelevance: score(row.familyRelevance),
          onlineMinistryIntent: score(row.onlineMinistryIntent),
          freshness: score(row.freshness),
          replyOpportunity: score(row.replyOpportunity),
          contentOpportunity: score(row.contentOpportunity),
          searchOpportunity: score(row.searchOpportunity),
          riskSensitivity: score(row.riskSensitivity),
        };
        if (!signal.sourceLabel || !signal.title || signal.excerpt.length < 10) return [];
        assertPublicSourceAllowed({
          url: signal.publicUrl,
          publiclyAccessible: row.publiclyAccessible === true,
          privateGroup: row.privateGroup === true,
          requiresBypass: row.requiresBypass === true,
          containsRestrictedData: row.containsRestrictedData === true,
        });
        const scores = scorePublicConversationOpportunity(signal);
        const fingerprint = createHash("sha256").update(signal.publicUrl).digest("hex");
        return [{
          connector_id: typeof event.payload.connector_id === "string" ? event.payload.connector_id : null,
          source_kind: signal.sourceKind,
          source_label: signal.sourceLabel,
          source_url: signal.publicUrl,
          source_fingerprint: fingerprint,
          title: signal.title,
          excerpt: signal.excerpt,
          published_at: signal.publishedAt || null,
          locality: signal.locality,
          themes: Array.isArray(row.themes) ? row.themes.filter((item): item is string => typeof item === "string").slice(0, 20) : [],
          explicit_church_request: signal.explicitChurchRequest,
          local_relevance: scores.localRelevance,
          church_intent: scores.churchIntent,
          family_relevance: scores.familyRelevance,
          online_ministry_intent: scores.onlineMinistryIntent,
          freshness: scores.freshness,
          reply_opportunity: scores.replyOpportunity,
          content_opportunity: scores.contentOpportunity,
          search_opportunity: scores.searchOpportunity,
          risk_sensitivity: scores.riskSensitivity,
          priority_score: scores.priority,
        }];
      });

      context.log("public_listening.rows_validated", { eventId: event.id, count: rows.length });
      if (!context.dryRun && rows.length) {
        const { error } = await context.supabase
          .from("public_conversation_signals")
          .upsert(rows, { onConflict: "source_fingerprint" });
        if (error) throw error;
      }
      imported += rows.length;
      await completeOutboxEvent(context, event.id);
    } catch (error) {
      await failOutboxEvent(context, event.id, error instanceof Error ? error.message : "Public listening failed");
    }
  }
  return { claimed: events.length, imported };
});
