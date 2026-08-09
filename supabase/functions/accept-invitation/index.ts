import { createClient } from "npm:@supabase/supabase-js@2.110.9";
import { corsHeaders } from "../_shared/cors.ts";
import { hashInvitationToken } from "../_shared/crypto.ts";
import { jsonResponse } from "../_shared/responses.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ message: "Method not allowed" }, 405);
  const authorization = request.headers.get("authorization");
  if (!authorization) return jsonResponse({ message: "Authentication required" }, 401);
  const body = (await request.json().catch(() => null)) as {
    token?: string;
    privacyAccepted?: boolean;
    communityGuidelinesAccepted?: boolean;
  } | null;
  if (
    !body?.token ||
    body.token.length < 32 ||
    !body.privacyAccepted ||
    !body.communityGuidelinesAccepted
  ) {
    return jsonResponse({ message: "Invitation and policy acceptance are required" }, 400);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const pepper = Deno.env.get("INVITATION_TOKEN_PEPPER");
  if (!url || !anonKey || !pepper)
    return jsonResponse({ message: "Invitation service is not configured" }, 503);
  const userClient = createClient(url, anonKey, {
    global: { headers: { authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const tokenHash = await hashInvitationToken(body.token, pepper);
  const { data, error } = await userClient.rpc("consume_invitation", {
    p_token_hash: tokenHash,
    p_accept_privacy: true,
    p_accept_community_guidelines: true,
  });
  if (error)
    return jsonResponse(
      { message: "Invitation is invalid, expired, revoked, used, or belongs to another email" },
      400,
    );
  return jsonResponse(data, 200);
});
