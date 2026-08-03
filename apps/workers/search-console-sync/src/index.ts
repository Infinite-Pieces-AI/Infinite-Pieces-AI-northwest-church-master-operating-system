import { scoreSearchOpportunity } from "@church/outreach";
import { claimOutboxEvents, completeOutboxEvent, failOutboxEvent, runWorker } from "@church/worker-runtime";

interface SearchConsoleRow {
  query?: unknown;
  page?: unknown;
  date?: unknown;
  country?: unknown;
  device?: unknown;
  clicks?: unknown;
  impressions?: unknown;
  ctr?: unknown;
  position?: unknown;
}

function finiteNumber(value: unknown, fallback = 0): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function safePath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value, "https://public.invalid");
    return `${url.pathname}${url.search}`.slice(0, 500);
  } catch {
    return null;
  }
}

await runWorker("search-console-sync", async (context) => {
  const events = await claimOutboxEvents(context, ["search_console.sync_requested"]);
  const endpoint = process.env.SEARCH_CONSOLE_PROXY_URL;
  const token = process.env.SEARCH_CONSOLE_PROXY_TOKEN;
  let imported = 0;
  let opportunities = 0;

  for (const event of events) {
    try {
      if (!endpoint || !token) {
        context.log("integration.disabled", { reason: "Search Console proxy not configured", eventId: event.id });
        await completeOutboxEvent(context, event.id);
        continue;
      }
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({
          siteUrl: process.env.PUBLIC_SITE_URL,
          startDate: event.payload.start_date,
          endDate: event.payload.end_date,
          dimensions: ["query", "page", "date"]
        }),
        signal: AbortSignal.timeout(15_000)
      });
      if (!response.ok) throw new Error(`Search Console proxy returned ${response.status}`);
      const metrics = (await response.json()) as { rows?: SearchConsoleRow[] };
      const rows = (metrics.rows ?? []).slice(0, 10_000).flatMap((row) => {
        const query = typeof row.query === "string" ? row.query.trim().slice(0, 500) : null;
        const snapshotDate = typeof row.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(row.date)
          ? row.date
          : new Date().toISOString().slice(0, 10);
        if (!query) return [];
        const clicks = Math.max(0, Math.round(finiteNumber(row.clicks)));
        const impressions = Math.max(0, Math.round(finiteNumber(row.impressions)));
        const averagePosition = Math.max(0, finiteNumber(row.position));
        const pagePath = safePath(row.page);
        return [{
          snapshot_date: snapshotDate,
          query,
          page_path: pagePath,
          country_code: typeof row.country === "string" ? row.country.slice(0, 8) : null,
          device: typeof row.device === "string" ? row.device.slice(0, 40) : null,
          clicks,
          impressions,
          average_position: averagePosition,
          click_through_rate: impressions > 0 ? clicks / impressions : Math.max(0, finiteNumber(row.ctr))
        }];
      });

      context.log("search_console.metrics_received", { eventId: event.id, rows: rows.length });
      if (!context.dryRun && rows.length) {
        const { error: snapshotError } = await context.supabase
          .from("search_performance_snapshots")
          .upsert(rows, { onConflict: "snapshot_date,query,page_path,country_code,device" });
        if (snapshotError) throw snapshotError;

        const opportunityRows = rows
          .filter((row) => row.impressions >= 25)
          .map((row) => {
            const scored = scoreSearchOpportunity({
              query: row.query,
              impressions: row.impressions,
              clicks: row.clicks,
              averagePosition: Number(row.average_position ?? 0),
              locality: "Lowell, Massachusetts",
              ...(row.page_path ? { existingPage: row.page_path } : {})
            });
            return {
              snapshot_date: row.snapshot_date,
              query: row.query,
              locality: scored.locality,
              impressions: row.impressions,
              clicks: row.clicks,
              average_position: row.average_position,
              existing_page_path: row.page_path,
              opportunity_score: scored.opportunityScore,
              recommended_action: scored.recommendedAction,
              source: "search_console"
            };
          });
        if (opportunityRows.length) {
          const { error: opportunityError } = await context.supabase
            .from("keyword_opportunities")
            .upsert(opportunityRows, { onConflict: "snapshot_date,query,locality" });
          if (opportunityError) throw opportunityError;
          opportunities += opportunityRows.length;
        }
      }
      await completeOutboxEvent(context, event.id);
      imported += rows.length;
    } catch (error) {
      await failOutboxEvent(context, event.id, error instanceof Error ? error.message : "Search Console import failed");
    }
  }
  return { claimed: events.length, imported, opportunities };
});
