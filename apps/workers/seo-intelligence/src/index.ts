import { scoreSearchOpportunity } from "@church/outreach";
import {
  claimOutboxEvents,
  completeOutboxEvent,
  failOutboxEvent,
  runWorker,
} from "@church/worker-runtime";

interface SnapshotRow {
  snapshot_date: string;
  query: string;
  page_path: string | null;
  clicks: number;
  impressions: number;
  average_position: number | null;
}

await runWorker("seo-intelligence", async (context) => {
  const events = await claimOutboxEvents(context, ["outreach.seo_analysis_requested"]);
  let scoredCount = 0;
  for (const event of events) {
    try {
      const minimumImpressions = Math.max(1, Number(event.payload.minimum_impressions ?? 25));
      const locality = typeof event.payload.locality === "string" ? event.payload.locality.slice(0, 160) : "Lowell, Massachusetts";
      const { data, error } = await context.supabase
        .from("search_performance_snapshots")
        .select("snapshot_date,query,page_path,clicks,impressions,average_position")
        .gte("impressions", minimumImpressions)
        .order("snapshot_date", { ascending: false })
        .limit(5000);
      if (error) throw error;
      const opportunities = ((data ?? []) as SnapshotRow[]).map((row) => {
        const scored = scoreSearchOpportunity({
          query: row.query,
          impressions: row.impressions,
          clicks: row.clicks,
          averagePosition: Number(row.average_position ?? 0),
          locality,
          ...(row.page_path ? { existingPage: row.page_path } : {}),
        });
        return {
          snapshot_date: row.snapshot_date,
          query: row.query,
          locality,
          impressions: row.impressions,
          clicks: row.clicks,
          average_position: row.average_position,
          existing_page_path: row.page_path,
          opportunity_score: scored.opportunityScore,
          recommended_action: scored.recommendedAction,
          source: "seo_intelligence",
        };
      });
      if (!context.dryRun && opportunities.length) {
        const { error: upsertError } = await context.supabase
          .from("keyword_opportunities")
          .upsert(opportunities, { onConflict: "snapshot_date,query,locality" });
        if (upsertError) throw upsertError;
      }
      scoredCount += opportunities.length;
      context.log("seo.opportunities_scored", { eventId: event.id, count: opportunities.length });
      await completeOutboxEvent(context, event.id);
    } catch (error) {
      await failOutboxEvent(context, event.id, error instanceof Error ? error.message : "SEO analysis failed");
    }
  }
  return { claimed: events.length, scored: scoredCount };
});
