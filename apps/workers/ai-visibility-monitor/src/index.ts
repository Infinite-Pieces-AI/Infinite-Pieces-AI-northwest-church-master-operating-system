import {
  claimOutboxEvents,
  completeOutboxEvent,
  failOutboxEvent,
  runWorker,
} from "@church/worker-runtime";

interface VisibilityResult {
  prompt?: unknown;
  providerName?: unknown;
  churchMentioned?: unknown;
  factsAccurate?: unknown;
  coverageScore?: unknown;
  confidenceScore?: unknown;
  citedPagePath?: unknown;
  otherOrganizations?: unknown;
  evidenceUrls?: unknown;
  evidenceExcerpt?: unknown;
  contentGap?: unknown;
}

function allowedProxy(rawUrl: string, allowedHosts: string): URL {
  const url = new URL(rawUrl);
  const hosts = allowedHosts
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (url.protocol !== "https:" || !hosts.includes(url.hostname)) {
    throw new Error("AI visibility proxy must use HTTPS and an explicitly allowed host");
  }
  return url;
}

function score(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(100, Math.round(number))) : 0;
}

await runWorker("ai-visibility-monitor", async (context) => {
  const events = await claimOutboxEvents(context, ["outreach.ai_visibility_requested"]);
  const endpoint = process.env.AI_VISIBILITY_PROXY_URL;
  const token = process.env.AI_VISIBILITY_PROXY_TOKEN;
  const allowedHosts = process.env.AI_VISIBILITY_ALLOWED_HOSTS ?? "";
  let checks = 0;

  for (const event of events) {
    let runId: string | null = null;
    try {
      const prompts = Array.isArray(event.payload.prompts)
        ? event.payload.prompts
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim().slice(0, 1000))
            .filter(Boolean)
            .slice(0, 50)
        : [];
      if (!prompts.length) throw new Error("AI visibility run requires approved public prompts");
      if (!endpoint || !token) {
        context.log("ai_visibility.disabled", { eventId: event.id, promptCount: prompts.length });
        await completeOutboxEvent(context, event.id);
        continue;
      }
      const proxy = allowedProxy(endpoint, allowedHosts);
      const providerKey =
        typeof event.payload.provider_key === "string"
          ? event.payload.provider_key
          : "approved-proxy";
      if (!context.dryRun) {
        const { data, error } = await context.supabase
          .from("ai_visibility_runs")
          .insert({
            provider_key: providerKey,
            locality:
              typeof event.payload.locality === "string"
                ? event.payload.locality.slice(0, 160)
                : "Lowell, Massachusetts",
            prompt_count: prompts.length,
            status: "running",
            dry_run: false,
            requested_by:
              typeof event.payload.requested_by === "string" ? event.payload.requested_by : null,
            started_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        if (error) throw error;
        runId = String(data.id);
      }
      const response = await fetch(proxy, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({
          prompts,
          publicSourcesOnly: true,
          noPersonalization: true,
          returnCitations: true,
          returnOtherOrganizations: true,
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`AI visibility proxy returned ${response.status}`);
      const payload = (await response.json()) as { results?: VisibilityResult[] };
      const rows = (payload.results ?? []).slice(0, prompts.length).flatMap((result) => {
        const prompt = typeof result.prompt === "string" ? result.prompt.trim().slice(0, 1000) : "";
        if (!prompt || !runId) return [];
        const urls = Array.isArray(result.evidenceUrls)
          ? result.evidenceUrls
              .filter(
                (item): item is string => typeof item === "string" && item.startsWith("https://"),
              )
              .slice(0, 10)
          : [];
        const organizations = Array.isArray(result.otherOrganizations)
          ? result.otherOrganizations
              .filter((item): item is string => typeof item === "string")
              .map((item) => item.slice(0, 160))
              .slice(0, 20)
          : [];
        const citedPath =
          typeof result.citedPagePath === "string" && result.citedPagePath.startsWith("/")
            ? result.citedPagePath.slice(0, 500)
            : null;
        return [
          {
            run_id: runId,
            prompt,
            provider_name:
              typeof result.providerName === "string"
                ? result.providerName.slice(0, 120)
                : providerKey,
            church_mentioned:
              typeof result.churchMentioned === "boolean" ? result.churchMentioned : null,
            facts_accurate: typeof result.factsAccurate === "boolean" ? result.factsAccurate : null,
            coverage_score: score(result.coverageScore),
            confidence_score: score(result.confidenceScore),
            cited_page_path: citedPath,
            other_organizations: organizations,
            public_evidence_urls: urls,
            evidence_excerpt:
              typeof result.evidenceExcerpt === "string"
                ? result.evidenceExcerpt.slice(0, 3000)
                : null,
            content_gap:
              typeof result.contentGap === "string" ? result.contentGap.slice(0, 2000) : null,
          },
        ];
      });
      if (!context.dryRun && runId) {
        if (rows.length) {
          const { error: checkError } = await context.supabase
            .from("ai_visibility_checks")
            .insert(rows);
          if (checkError) throw checkError;
        }
        const { error: runError } = await context.supabase
          .from("ai_visibility_runs")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", runId);
        if (runError) throw runError;
      }
      checks += rows.length || prompts.length;
      await completeOutboxEvent(context, event.id);
    } catch (error) {
      if (!context.dryRun && runId) {
        await context.supabase
          .from("ai_visibility_runs")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            error_summary:
              error instanceof Error ? error.message.slice(0, 2000) : "AI visibility failed",
          })
          .eq("id", runId);
      }
      await failOutboxEvent(
        context,
        event.id,
        error instanceof Error ? error.message : "AI visibility failed",
      );
    }
  }
  return { claimed: events.length, checks };
});
