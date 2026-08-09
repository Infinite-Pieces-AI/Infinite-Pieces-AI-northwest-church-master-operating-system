import { sanitizePushPayload, type PushNotificationPayload } from "@church/notifications";
import {
  claimOutboxEvents,
  completeOutboxEvent,
  failOutboxEvent,
  runWorker,
} from "@church/worker-runtime";

const supported = [
  "weekly_lesson.published",
  "service_occurrence.updated",
  "member.approved",
  "group_cycle.approved",
] as const;

function pushPayloadFor(eventType: string): PushNotificationPayload {
  switch (eventType) {
    case "service_occurrence.updated":
      return sanitizePushPayload({
        title: "Sunday schedule updated",
        body: "Open Church Hub for the approved time, location, and directions.",
        url: "/this-week",
        topic: "service_schedule",
        tag: "service-schedule",
      });
    case "weekly_lesson.published":
      return sanitizePushPayload({
        title: "This week's lesson is ready",
        body: "Open the approved lesson, Scripture references, and discussion questions.",
        url: "/bible",
        topic: "weekly_lesson",
        tag: "weekly-lesson",
      });
    case "group_cycle.approved":
      return sanitizePushPayload({
        title: "Your fellowship group was updated",
        body: "Sign in to view the leadership-approved assignment.",
        url: "/community",
        topic: "assigned_group",
        tag: "group-cycle",
      });
    default:
      return sanitizePushPayload({
        title: "Church Hub update",
        body: "Open the member hub for the latest approved update.",
        url: "/this-week",
        topic: "weekly_digest",
        tag: "church-hub-update",
      });
  }
}

await runWorker("notification-jobs", async (context) => {
  const events = await claimOutboxEvents(context, supported);
  let created = 0;
  for (const event of events) {
    try {
      const audience =
        typeof event.payload.audience === "string" ? event.payload.audience : "assigned-members";
      const profileIds = Array.isArray(event.payload.profileIds)
        ? event.payload.profileIds.filter((value): value is string => typeof value === "string")
        : [];
      if (context.dryRun) {
        context.log("notification.would_queue", {
          eventId: event.id,
          eventType: event.event_type,
          audience,
          webPushRecipients: profileIds.length,
        });
      } else {
        const jobs = [
          {
            source_event_id: event.id,
            channel: "email",
            audience_key: audience,
            template_key: event.event_type,
            payload: event.payload,
            status: "pending",
          },
          {
            source_event_id: event.id,
            channel: "in_app",
            audience_key: audience,
            template_key: event.event_type,
            payload: event.payload,
            status: "pending",
          },
          ...profileIds.map((profileId) => ({
            source_event_id: event.id,
            profile_id: profileId,
            channel: "web_push",
            template_key: event.event_type,
            payload: pushPayloadFor(event.event_type),
            status: "pending",
          })),
        ];
        const { error } = await context.supabase.from("notification_jobs").insert(jobs);
        if (error) throw error;
      }
      await completeOutboxEvent(context, event.id);
      created += 1;
    } catch (error) {
      await failOutboxEvent(
        context,
        event.id,
        error instanceof Error ? error.message : "Notification job creation failed",
      );
    }
  }
  return { claimed: events.length, created };
});
