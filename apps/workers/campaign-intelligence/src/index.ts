import { assertAudiencePlanAllowed } from "@church/outreach";
import {
  claimOutboxEvents,
  completeOutboxEvent,
  failOutboxEvent,
  runWorker,
} from "@church/worker-runtime";

interface FunnelStage {
  funnelKey?: unknown;
  stageKey?: unknown;
  stageLabel?: unknown;
  value?: unknown;
  sourceSystem?: unknown;
}

interface ChannelRow {
  channelKey?: unknown;
  channelLabel?: unknown;
  visits?: unknown;
  conversions?: unknown;
  sourceSystem?: unknown;
}

const safeKey = (value: unknown) =>
  typeof value === "string" && /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(value) ? value : null;
const safeText = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
const safeCount = (value: unknown) => Math.max(0, Math.round(Number(value ?? 0)));

await runWorker("campaign-intelligence", async (context) => {
  const events = await claimOutboxEvents(context, ["outreach.campaign_analysis_requested"]);
  let snapshots = 0;
  for (const event of events) {
    try {
      assertAudiencePlanAllowed({
        audienceDescription:
          typeof event.payload.audience_description === "string"
            ? event.payload.audience_description
            : "contextual public campaign",
        sourceData: Array.isArray(event.payload.source_data)
          ? event.payload.source_data.filter((item): item is string => typeof item === "string")
          : ["aggregate analytics"],
      });
      const snapshotDate =
        typeof event.payload.snapshot_date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(event.payload.snapshot_date)
          ? event.payload.snapshot_date
          : new Date().toISOString().slice(0, 10);
      const funnelRows = (
        Array.isArray(event.payload.funnel_stages) ? event.payload.funnel_stages : []
      ).flatMap((stage: FunnelStage) => {
        const funnelKey = safeText(stage.funnelKey, 80);
        const stageKey = safeKey(stage.stageKey);
        const stageLabel = safeText(stage.stageLabel, 120);
        const sourceSystem = safeText(stage.sourceSystem, 120);
        if (!funnelKey || !stageKey || !stageLabel || !sourceSystem) return [];
        return [
          {
            snapshot_date: snapshotDate,
            funnel_key: funnelKey,
            stage_key: stageKey,
            stage_label: stageLabel,
            aggregate_value: safeCount(stage.value),
            source_system: sourceSystem,
          },
        ];
      });
      const channelRows = (
        Array.isArray(event.payload.channels) ? event.payload.channels : []
      ).flatMap((row: ChannelRow) => {
        const channelKey = safeKey(row.channelKey);
        const channelLabel = safeText(row.channelLabel, 120);
        const sourceSystem = safeText(row.sourceSystem, 120);
        if (!channelKey || !channelLabel || !sourceSystem) return [];
        const visits = safeCount(row.visits);
        const conversions = Math.min(visits, safeCount(row.conversions));
        return [
          {
            snapshot_date: snapshotDate,
            channel_key: channelKey,
            channel_label: channelLabel,
            aggregate_visits: visits,
            aggregate_conversions: conversions,
            source_system: sourceSystem,
          },
        ];
      });
      if (!context.dryRun) {
        if (funnelRows.length) {
          const { error } = await context.supabase
            .from("outreach_funnel_snapshots")
            .upsert(funnelRows, { onConflict: "snapshot_date,funnel_key,stage_key,source_system" });
          if (error) throw error;
        }
        if (channelRows.length) {
          const { error } = await context.supabase
            .from("outreach_channel_attribution")
            .upsert(channelRows, { onConflict: "snapshot_date,channel_key,source_system" });
          if (error) throw error;
        }
      }
      snapshots += funnelRows.length + channelRows.length;
      context.log("campaign.aggregate_snapshots_ready", {
        eventId: event.id,
        funnelRows: funnelRows.length,
        channelRows: channelRows.length,
      });
      await completeOutboxEvent(context, event.id);
    } catch (error) {
      await failOutboxEvent(
        context,
        event.id,
        error instanceof Error ? error.message : "Campaign intelligence failed",
      );
    }
  }
  return { claimed: events.length, snapshots };
});
