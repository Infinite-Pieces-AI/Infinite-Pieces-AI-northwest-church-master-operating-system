import webpush from "web-push";
import { sanitizePushPayload, type PushNotificationPayload } from "@church/notifications";
import { parseAllowedPushHosts, validatePushEndpoint } from "@church/pwa";
import { runWorker, type WorkerContext } from "@church/worker-runtime";

interface ClaimedJob {
  id: string;
  profile_id: string | null;
  template_key: string;
  payload: Record<string, unknown>;
  attempts: number;
}

interface PushSubscriptionRow {
  id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  failure_count: number;
}

function requireVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) throw new Error("VAPID configuration is incomplete");
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

function asPushPayload(value: Record<string, unknown>): PushNotificationPayload {
  return sanitizePushPayload({
    title: String(value.title ?? "Church Hub update"),
    body: String(value.body ?? "Open the member hub for the latest approved update."),
    url: String(value.url ?? "/this-week"),
    topic: (value.topic ?? "weekly_digest") as PushNotificationPayload["topic"],
    ...(typeof value.tag === "string" ? { tag: value.tag } : {}),
    ...(typeof value.icon === "string" ? { icon: value.icon } : { icon: "/icon.svg" }),
    ...(typeof value.badge === "string" ? { badge: value.badge } : { badge: "/icon.svg" })
  });
}

async function inspectOrClaimJobs(context: WorkerContext): Promise<ClaimedJob[]> {
  if (context.dryRun) {
    const { data, error } = await context.supabase
      .from("notification_jobs")
      .select("id,profile_id,template_key,payload,attempts")
      .eq("channel", "web_push")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .lt("attempts", 8)
      .order("scheduled_for", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(25);
    if (error) throw error;
    context.log("push.dry_run_inspection", { count: data?.length ?? 0 });
    return (data ?? []) as ClaimedJob[];
  }

  const { data, error } = await context.supabase.rpc("claim_notification_jobs", {
    requested_channel: "web_push",
    requested_limit: 25,
    worker_id: `${context.workerName}:${context.runId}`
  });
  if (error) throw error;
  return (data ?? []) as ClaimedJob[];
}

await runWorker("push-delivery", async (context) => {
  if (!context.dryRun) requireVapid();
  const jobs = await inspectOrClaimJobs(context);
  let sent = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      if (!job.profile_id) throw new Error("Web push job requires a profile_id");
      const payload = asPushPayload(job.payload);
      const { data, error: subscriptionError } = await context.supabase
        .from("push_subscriptions")
        .select("id,endpoint,p256dh_key,auth_key,failure_count")
        .eq("profile_id", job.profile_id)
        .eq("permission_status", "granted")
        .is("revoked_at", null);
      if (subscriptionError) throw subscriptionError;
      const subscriptions = (data ?? []) as PushSubscriptionRow[];

      if (context.dryRun) {
        context.log("push.would_send", {
          jobId: job.id,
          subscriptionCount: subscriptions.length,
          topic: payload.topic
        });
        continue;
      }

      let providerMessageId: string | null = subscriptions.length ? null : "no-active-subscription";
      const allowedHosts = parseAllowedPushHosts(process.env.WEB_PUSH_ALLOWED_HOSTS);
      for (const subscription of subscriptions) {
        try {
          validatePushEndpoint(subscription.endpoint, allowedHosts);
          const result = await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh_key, auth: subscription.auth_key }
            },
            JSON.stringify(payload),
            { TTL: 3600, urgency: payload.topic === "service_schedule" ? "high" : "normal" }
          );
          providerMessageId = result.headers.location ?? providerMessageId;
          const { error: successError } = await context.supabase
            .from("push_subscriptions")
            .update({ last_success_at: new Date().toISOString(), failure_count: 0 })
            .eq("id", subscription.id);
          if (successError) throw successError;
        } catch (deliveryError) {
          const statusCode =
            typeof deliveryError === "object" && deliveryError && "statusCode" in deliveryError
              ? Number((deliveryError as { statusCode?: unknown }).statusCode)
              : 0;
          if (statusCode === 404 || statusCode === 410) {
            const { error: revokeError } = await context.supabase
              .from("push_subscriptions")
              .update({
                permission_status: "revoked",
                revoked_at: new Date().toISOString(),
                last_failure_at: new Date().toISOString(),
                failure_count: subscription.failure_count + 1
              })
              .eq("id", subscription.id);
            if (revokeError) throw revokeError;
          } else {
            const { error: updateError } = await context.supabase
              .from("push_subscriptions")
              .update({
                last_failure_at: new Date().toISOString(),
                failure_count: subscription.failure_count + 1
              })
              .eq("id", subscription.id);
            if (updateError) throw updateError;
            throw deliveryError;
          }
        }
      }

      const { error: completeError } = await context.supabase.rpc("complete_notification_job", {
        requested_id: job.id,
        provider_name: "web-push",
        provider_message_id: providerMessageId
      });
      if (completeError) throw completeError;
      sent += 1;
    } catch (jobError) {
      failed += 1;
      const message = jobError instanceof Error ? jobError.message : "Push delivery failed";
      if (!context.dryRun) {
        const { error: failError } = await context.supabase.rpc("fail_notification_job", {
          requested_id: job.id,
          failure_message: message,
          permanent_failure: false
        });
        if (failError) context.log("push.fail_record_error", { jobId: job.id, message: failError.message });
      }
      context.log("push.failed", { jobId: job.id, message });
    }
  }

  return { inspectedOrClaimed: jobs.length, sent, failed, dryRun: context.dryRun };
});
