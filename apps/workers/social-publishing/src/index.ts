import {
  claimOutboxEvents,
  completeOutboxEvent,
  failOutboxEvent,
  runWorker,
} from "@church/worker-runtime";

await runWorker("social-publishing", async (context) => {
  const events = await claimOutboxEvents(context, ["social_draft.approved"]);
  const enabled = process.env.SOCIAL_AUTO_PUBLISH_ENABLED === "true";
  const published = 0;
  for (const event of events) {
    try {
      const draftId =
        typeof event.payload.social_draft_id === "string" ? event.payload.social_draft_id : null;
      if (!draftId) throw new Error("Approved social event is missing social_draft_id");
      const { data: draft, error } = await context.supabase
        .from("social_drafts")
        .select("id,status,platform,body,approved_by,approved_at")
        .eq("id", draftId)
        .maybeSingle();
      if (error) throw error;
      if (!draft || draft.status !== "approved" || !draft.approved_by || !draft.approved_at) {
        throw new Error("Social draft does not contain a complete human approval record");
      }
      if (!enabled || context.dryRun) {
        context.log("social.would_publish", {
          draftId,
          platform: draft.platform,
          reason: enabled ? "dry-run" : "publication disabled",
        });
        await completeOutboxEvent(context, event.id);
        continue;
      }
      // Add a platform-specific adapter here. Never send member directories, prayer details,
      // child data, or private-channel content to advertising or social platforms.
      throw new Error("No production social platform adapter is configured");
    } catch (error) {
      await failOutboxEvent(
        context,
        event.id,
        error instanceof Error ? error.message : "Social publication failed",
      );
    }
  }
  return { claimed: events.length, published };
});
