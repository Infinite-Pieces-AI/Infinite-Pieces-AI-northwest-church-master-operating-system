import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { normalizePushSubscription, parseAllowedPushHosts } from "@church/pwa";
import { getApiViewer } from "@/lib/auth/api-viewer";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function endpointHash(endpoint: string): string {
  return createHash("sha256").update(endpoint).digest("hex");
}

export async function GET() {
  const viewer = await getApiViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (viewer.demo) return NextResponse.json({ enabled: false, demo: true });
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", viewer.id)
    .is("revoked_at", null)
    .eq("permission_status", "granted");
  if (error) return NextResponse.json({ error: "Unable to read push settings" }, { status: 500 });
  return NextResponse.json({ enabled: (count ?? 0) > 0 });
}

export async function POST(request: Request) {
  const viewer = await getApiViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as { subscription?: unknown; deviceLabel?: unknown };
  let subscription;
  try {
    subscription = normalizePushSubscription(
      body.subscription,
      parseAllowedPushHosts(process.env.WEB_PUSH_ALLOWED_HOSTS),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid push subscription" },
      { status: 400 },
    );
  }
  const deviceLabel =
    typeof body.deviceLabel === "string" ? body.deviceLabel.trim().slice(0, 80) : null;
  if (viewer.demo) return NextResponse.json({ enabled: true, demo: true });

  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      profile_id: viewer.id,
      endpoint: subscription.endpoint,
      endpoint_hash: endpointHash(subscription.endpoint),
      p256dh_key: subscription.keys.p256dh,
      auth_key: subscription.keys.auth,
      expiration_time: subscription.expirationTime
        ? new Date(subscription.expirationTime).toISOString()
        : null,
      device_label: deviceLabel,
      permission_status: "granted",
      revoked_at: null,
      failure_count: 0,
    },
    { onConflict: "profile_id,endpoint_hash" },
  );
  if (error)
    return NextResponse.json({ error: "Unable to save push subscription" }, { status: 500 });
  return NextResponse.json({ enabled: true });
}

export async function DELETE(request: Request) {
  const viewer = await getApiViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as { endpoint?: unknown };
  if (typeof body.endpoint !== "string" || !body.endpoint.startsWith("https://")) {
    return NextResponse.json({ error: "Valid endpoint required" }, { status: 400 });
  }
  if (viewer.demo) return NextResponse.json({ enabled: false, demo: true });
  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .update({ permission_status: "revoked", revoked_at: new Date().toISOString() })
    .eq("profile_id", viewer.id)
    .eq("endpoint_hash", endpointHash(body.endpoint));
  if (error)
    return NextResponse.json({ error: "Unable to revoke push subscription" }, { status: 500 });
  return NextResponse.json({ enabled: false });
}
