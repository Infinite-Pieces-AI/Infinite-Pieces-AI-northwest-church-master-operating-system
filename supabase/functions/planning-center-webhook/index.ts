import { createClient } from "npm:@supabase/supabase-js@2.110.9";
import { jsonResponse } from "../_shared/responses.ts";
import { sha256Hex } from "../_shared/crypto.ts";

/**
 * Provider adapter boundary. Before production, confirm Planning Center's current webhook
 * signature and retry contract and replace `verifyProviderSignature` accordingly.
 * Unknown signatures are rejected; this function never trusts an unverified payload.
 */
async function verifyProviderSignature(
  rawBody: string,
  suppliedSignature: string | null,
): Promise<boolean> {
  const mode = Deno.env.get("PLANNING_CENTER_WEBHOOK_VERIFICATION_MODE");
  const secret = Deno.env.get("PLANNING_CENTER_WEBHOOK_SECRET");
  if (mode !== "configured-adapter" || !secret || !suppliedSignature) return false;
  const expected = await sha256Hex(`${secret}:${rawBody}`);
  if (expected.length !== suppliedSignature.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1)
    difference |= expected.charCodeAt(index) ^ suppliedSignature.charCodeAt(index);
  return difference === 0;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return jsonResponse({ message: "Method not allowed" }, 405);
  const rawBody = await request.text();
  const signature = request.headers.get("x-provider-signature");
  const signatureValid = await verifyProviderSignature(rawBody, signature);
  if (!signatureValid)
    return jsonResponse(
      { message: "Webhook verification adapter is not configured or signature is invalid" },
      401,
    );

  const payloadHash = await sha256Hex(rawBody);
  const payload = JSON.parse(rawBody) as { id?: string; type?: string };
  const externalEventId = payload.id ?? payloadHash;
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRole)
    return jsonResponse({ message: "Webhook storage is not configured" }, 503);
  const service = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await service.from("webhook_receipts").upsert(
    {
      provider: "planning_center",
      external_event_id: externalEventId,
      signature_valid: true,
      event_type: payload.type ?? null,
      payload_hash: payloadHash,
    },
    { onConflict: "provider,external_event_id", ignoreDuplicates: true },
  );
  if (error) return jsonResponse({ message: "Webhook receipt could not be stored" }, 503);
  await service.from("outbox_events").insert({
    aggregate_type: "planning_center_webhook",
    event_type: "planning_center.sync_requested",
    payload: { webhook_event_id: externalEventId, resource: "/check-ins/v2/check_ins" },
  });
  return jsonResponse({ accepted: true }, 202);
});
