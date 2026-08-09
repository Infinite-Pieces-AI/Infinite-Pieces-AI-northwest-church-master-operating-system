import { scoreMinistryOpportunity, scoreSearchOpportunity } from "@church/outreach";
import {
  claimOutboxEvents,
  completeOutboxEvent,
  failOutboxEvent,
  runWorker,
} from "@church/worker-runtime";
import { crawlPublicSite } from "./site-crawler";

interface SnapshotRow {
  snapshot_date: string;
  query: string;
  page_path: string | null;
  clicks: number;
  impressions: number;
  average_position: number | null;
}

await runWorker("seo-intelligence", async (context) => {
  const events = await claimOutboxEvents(context, [
    "outreach.seo_analysis_requested",
    "outreach.site_crawl_requested",
  ]);
  let scoredCount = 0;
  let crawlFindings = 0;
  for (const event of events) {
    try {
      if (event.event_type === "outreach.site_crawl_requested") {
        const baseUrl =
          typeof event.payload.base_url === "string"
            ? event.payload.base_url
            : process.env.PUBLIC_SITE_URL;
        if (!baseUrl) throw new Error("Site crawl requires the church-owned public origin");
        const result = await crawlPublicSite(baseUrl, Number(event.payload.maximum_pages ?? 100));
        context.log("site_quality.crawl_complete", {
          eventId: event.id,
          pages: result.pagesChecked,
          findings: result.findings.length,
        });
        if (!context.dryRun) {
          const { data: run, error: runError } = await context.supabase
            .from("site_quality_crawl_runs")
            .insert({
              base_url: baseUrl,
              status: "completed",
              pages_checked: result.pagesChecked,
              links_checked: result.linksChecked,
              finding_count: result.findings.length,
              completed_at: new Date().toISOString(),
              dry_run: false,
            })
            .select("id")
            .single();
          if (runError || !run) throw runError ?? new Error("Crawl run could not be stored");
          if (result.findings.length) {
            const { error: findingError } = await context.supabase
              .from("site_quality_findings")
              .insert(
                result.findings.map((finding) => ({
                  crawl_run_id: run.id,
                  page_url: finding.pageUrl,
                  rule_key: finding.ruleKey,
                  severity: finding.severity,
                  detail: finding.detail,
                  evidence: finding.evidence ?? {},
                })),
              );
            if (findingError) throw findingError;
          }
        }
        crawlFindings += result.findings.length;
        await completeOutboxEvent(context, event.id);
        continue;
      }

      const minimumImpressions = Math.max(1, Number(event.payload.minimum_impressions ?? 25));
      const locality =
        typeof event.payload.locality === "string"
          ? event.payload.locality.slice(0, 160)
          : "Lowell, Massachusetts";
      const { data, error } = await context.supabase
        .from("search_performance_snapshots")
        .select("snapshot_date,query,page_path,clicks,impressions,average_position")
        .gte("impressions", minimumImpressions)
        .order("snapshot_date", { ascending: false })
        .limit(5000);
      if (error) throw error;
      const assessments = ((data ?? []) as SnapshotRow[]).map((row) => {
        const simple = scoreSearchOpportunity({
          query: row.query,
          impressions: row.impressions,
          clicks: row.clicks,
          averagePosition: Number(row.average_position ?? 0),
          locality,
          ...(row.page_path ? { existingPage: row.page_path } : {}),
        });
        const queryText = row.query.toLowerCase();
        const advanced = scoreMinistryOpportunity({
          topic: row.query,
          churchVisitIntent: /church|worship|sunday|bible study|jesus/.test(queryText) ? 95 : 55,
          localRelevance: /lowell|near me/.test(queryText)
            ? 100
            : /massachusetts|online|zoom/.test(queryText)
              ? 70
              : 35,
          demandGrowth: Math.min(100, Math.round(Math.log10(row.impressions + 1) * 30)),
          rankingOpportunity:
            row.average_position && row.average_position > 3 && row.average_position <= 20
              ? 95
              : row.average_position > 20
                ? 70
                : 35,
          contentGap: row.page_path ? 50 : 95,
          conversionFit: /visit|church|service|bible study|online|zoom/.test(queryText) ? 90 : 55,
          freshness: 80,
          sensitivityRisk: /crisis|suicide|abuse|trauma/.test(queryText) ? 90 : 0,
          confidence: 78,
          source: "Google Search Console aggregate query performance",
          dateRange: { start: row.snapshot_date, end: row.snapshot_date },
        });
        return { row, simple, advanced };
      });
      if (!context.dryRun && assessments.length) {
        const opportunityRows = assessments.map(({ row, simple }) => ({
          snapshot_date: row.snapshot_date,
          query: row.query,
          locality,
          impressions: row.impressions,
          clicks: row.clicks,
          average_position: row.average_position,
          existing_page_path: row.page_path,
          opportunity_score: simple.opportunityScore,
          recommended_action: simple.recommendedAction,
          source: "seo_intelligence",
        }));
        const { error: upsertError } = await context.supabase
          .from("keyword_opportunities")
          .upsert(opportunityRows, { onConflict: "snapshot_date,query,locality" });
        if (upsertError) throw upsertError;
        const { error: assessmentError } = await context.supabase
          .from("outreach_opportunity_assessments")
          .insert(
            assessments.map(({ advanced }) => ({
              topic: advanced.topic,
              priority_score: advanced.priority,
              weighted_base: advanced.weightedBase,
              risk_penalty: advanced.riskPenalty,
              confidence_score: advanced.confidence,
              source_label: advanced.source,
              date_range_start: advanced.dateRange.start,
              date_range_end: advanced.dateRange.end,
              score_inputs: Object.fromEntries(
                advanced.contributions.map((item) => [item.key, item.input]),
              ),
              explanation: advanced.explanation,
              recommended_actions: advanced.recommendedActions,
            })),
          );
        if (assessmentError) throw assessmentError;
      }
      scoredCount += assessments.length;
      context.log("seo.opportunities_scored", { eventId: event.id, count: assessments.length });
      await completeOutboxEvent(context, event.id);
    } catch (error) {
      await failOutboxEvent(
        context,
        event.id,
        error instanceof Error ? error.message : "SEO intelligence failed",
      );
    }
  }
  return { claimed: events.length, scored: scoredCount, crawlFindings };
});
