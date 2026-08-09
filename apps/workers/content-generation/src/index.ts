import {
  claimOutboxEvents,
  completeOutboxEvent,
  failOutboxEvent,
  runWorker,
} from "@church/worker-runtime";

function allowedProxy(rawUrl: string, allowedHosts: string): URL {
  const url = new URL(rawUrl);
  const hosts = allowedHosts
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (url.protocol !== "https:" || !hosts.includes(url.hostname)) {
    throw new Error("Content-generation proxy must use HTTPS and an explicitly allowed host");
  }
  return url;
}

await runWorker("content-generation", async (context) => {
  const events = await claimOutboxEvents(context, ["outreach.content_draft_requested"]);
  const endpoint = process.env.CONTENT_GENERATION_PROXY_URL;
  const token = process.env.CONTENT_GENERATION_PROXY_TOKEN;
  const allowedHosts = process.env.CONTENT_GENERATION_ALLOWED_HOSTS ?? "";
  let drafted = 0;
  for (const event of events) {
    try {
      const actionId = typeof event.payload.action_id === "string" ? event.payload.action_id : null;
      if (!actionId) throw new Error("Content generation requires an action_id");
      const { data: action, error } = await context.supabase
        .from("public_conversation_actions")
        .select(
          "id,action_type,status,draft_text,signal_id,requires_human_review,publish_automatically",
        )
        .eq("id", actionId)
        .maybeSingle();
      if (error) throw error;
      if (!action || !action.requires_human_review || action.publish_automatically) {
        throw new Error("Content action does not satisfy human-review safeguards");
      }
      if (!endpoint || !token) {
        context.log("content_generation.disabled", { eventId: event.id, actionId });
        await completeOutboxEvent(context, event.id);
        continue;
      }
      const approvedFacts = event.payload.approved_facts;
      if (!approvedFacts || typeof approvedFacts !== "object" || Array.isArray(approvedFacts)) {
        throw new Error("Content generation requires approved_facts");
      }
      const proxy = allowedProxy(endpoint, allowedHosts);
      const response = await fetch(proxy, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({
          actionType: action.action_type,
          existingDraft: action.draft_text,
          approvedFacts,
          sourceExcerptIncluded: false,
          privateDataIncluded: false,
          publishAutomatically: false,
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`Content-generation proxy returned ${response.status}`);
      const payload = (await response.json()) as { draft?: unknown };
      const draft = typeof payload.draft === "string" ? payload.draft.trim().slice(0, 10000) : "";
      if (!draft) throw new Error("Content provider returned an empty draft");
      if (!context.dryRun) {
        const { error: updateError } = await context.supabase
          .from("public_conversation_actions")
          .update({ draft_text: draft, status: "in_review" })
          .eq("id", actionId);
        if (updateError) throw updateError;
      }
      drafted += 1;
      await completeOutboxEvent(context, event.id);
    } catch (error) {
      await failOutboxEvent(
        context,
        event.id,
        error instanceof Error ? error.message : "Content generation failed",
      );
    }
  }
  return { claimed: events.length, drafted };
});
