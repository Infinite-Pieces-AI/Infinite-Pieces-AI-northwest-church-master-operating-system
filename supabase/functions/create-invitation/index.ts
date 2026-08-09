import { createClient } from "npm:@supabase/supabase-js@2.110.9";
import { corsHeaders } from "../_shared/cors.ts";
import { hashInvitationToken, randomToken } from "../_shared/crypto.ts";
import { jsonResponse } from "../_shared/responses.ts";

interface RequestBody {
  intendedEmail?: string;
  accessRequestId?: string;
  householdId?: string;
  roles?: string[];
  ttlHours?: number;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ message: "Method not allowed" }, 405);

  const authorization = request.headers.get("authorization");
  if (!authorization) return jsonResponse({ message: "Authentication required" }, 401);
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const pepper = Deno.env.get("INVITATION_TOKEN_PEPPER");
  const emailWebhook = Deno.env.get("EMAIL_DELIVERY_WEBHOOK_URL");
  const emailWebhookToken = Deno.env.get("EMAIL_DELIVERY_WEBHOOK_TOKEN");
  const appUrl = Deno.env.get("CHURCH_HUB_URL") ?? "http://localhost:3001";
  const localTokenReturn = Deno.env.get("ALLOW_LOCAL_INVITE_TOKEN_RETURN") === "true";
  if (!url || !anonKey || !serviceRole || !pepper)
    return jsonResponse({ message: "Invitation service is not configured" }, 503);

  const body = (await request.json().catch(() => null)) as RequestBody | null;
  const email = body?.intendedEmail?.trim().toLowerCase();
  const ttlHours = Math.min(Math.max(body?.ttlHours ?? 72, 1), 168);
  const roles = body?.roles?.length ? body.roles : ["member"];
  if (!email || !email.includes("@") || roles.length > 8)
    return jsonResponse({ message: "Invalid invitation request" }, 400);

  // The caller-context client enforces the minister/super-admin role and aal2 policy in PostgreSQL.
  const userClient = createClient(url, anonKey, {
    global: { headers: { authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const serviceClient = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const token = randomToken();
  const tokenHash = await hashInvitationToken(token, pepper);
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();
  const { data: invitationId, error } = await userClient.rpc("create_invitation", {
    p_intended_email: email,
    p_token_hash: tokenHash,
    p_expires_at: expiresAt,
    p_roles: roles,
    p_access_request_id: body?.accessRequestId ?? null,
    p_household_id: body?.householdId ?? null,
  });
  if (error)
    return jsonResponse(
      { message: "Invitation could not be created" },
      error.code === "42501" ? 403 : 400,
    );

  const nextPath = `/accept-invitation?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  const redirectTo = `${appUrl.replace(/\/$/, "")}/auth/callback?next=${encodeURIComponent(nextPath)}`;
  const revokeUndelivered = async (reason: string) => {
    await serviceClient
      .from("invitations")
      .update({
        revoked_at: new Date().toISOString(),
        revocation_reason: reason,
      })
      .eq("id", invitationId);
  };

  // For a new identity, Supabase sends an authenticated invite link and returns to the token page.
  const { error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    redirectTo,
  });
  let deliveryMode = "supabase-auth-invite";

  if (inviteError) {
    // Existing approved/pending users need a magic link. Generate it server-side and hand it only
    // to the church's transactional email adapter; never return it in production.
    if (!emailWebhook) {
      if (!localTokenReturn) {
        await revokeUndelivered("Authentication email could not be delivered");
        return jsonResponse(
          { message: "Invitation delivery failed and the invitation was revoked" },
          502,
        );
      }
      deliveryMode = "local-development-token";
    } else {
      const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });
      if (linkError || !linkData.properties?.action_link) {
        await revokeUndelivered("Existing-user sign-in link could not be generated");
        return jsonResponse(
          { message: "Invitation delivery failed and the invitation was revoked" },
          502,
        );
      }
      const delivery = await fetch(emailWebhook, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(emailWebhookToken ? { authorization: `Bearer ${emailWebhookToken}` } : {}),
        },
        body: JSON.stringify({
          template: "church-member-invitation",
          to: email,
          variables: { authenticatedInvitationUrl: linkData.properties.action_link, expiresAt },
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!delivery.ok) {
        await revokeUndelivered("Transactional email adapter rejected the invitation");
        return jsonResponse(
          { message: "Invitation delivery failed and the invitation was revoked" },
          502,
        );
      }
      deliveryMode = "existing-user-magic-link";
    }
  }

  return jsonResponse(
    {
      invitationId,
      expiresAt,
      deliveryMode,
      ...(localTokenReturn
        ? { localDevelopmentAcceptanceUrl: `${appUrl.replace(/\/$/, "")}${nextPath}` }
        : {}),
    },
    201,
  );
});
