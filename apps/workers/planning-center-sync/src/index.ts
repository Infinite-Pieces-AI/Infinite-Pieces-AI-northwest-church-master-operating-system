
import {
  PlanningCenterClient,
  type PlanningCenterCollection
} from "@church/planning-center";
import {
  claimOutboxEvents,
  completeOutboxEvent,
  failOutboxEvent,
  runWorker
} from "@church/worker-runtime";

await runWorker("planning-center-sync", async (context) => {
  const events = await claimOutboxEvents(context, [
    "planning_center.sync_requested",
    "checkin.status_updated"
  ]);
  const appId = process.env.PLANNING_CENTER_APP_ID;
  const secret = process.env.PLANNING_CENTER_SECRET;

  if (!appId || !secret) {
    context.log("integration.disabled", {
      reason: "Planning Center credentials not configured",
      claimed: events.length
    });
    return { claimed: events.length, processed: 0 };
  }

  const client = new PlanningCenterClient({ appId, secret });
  let processed = 0;

  for (const event of events) {
    try {
      if (event.event_type === "planning_center.sync_requested") {
        const resource =
          typeof event.payload.resource === "string"
            ? event.payload.resource
            : "/people/v2/people";
        const response = await client.get<PlanningCenterCollection>(resource, {
          per_page: "25"
        });
        context.log("planning_center.read", {
          eventId: event.id,
          resource,
          recordCount: response.data.length
        });
        // Production mapping must copy only approved fields into integration mirror tables.
      } else {
        context.log("checkin.status_observed", {
          eventId: event.id,
          externalReference: event.payload.external_reference ?? null
        });
      }

      await completeOutboxEvent(context, event.id);
      processed += 1;
    } catch (error) {
      await failOutboxEvent(
        context,
        event.id,
        error instanceof Error ? error.message : "Planning Center synchronization failed"
      );
    }
  }

  return { claimed: events.length, processed };
});
