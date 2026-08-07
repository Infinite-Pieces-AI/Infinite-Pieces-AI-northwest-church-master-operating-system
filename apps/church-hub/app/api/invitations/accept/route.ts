import { NextResponse } from "next/server";
import { invitationAcceptSchema } from "@church/validation";
import { hashInvitationToken } from "@church/authentication";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const parsed = invitationAcceptSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ message: "Invitation details are invalid." }, { status: 400 });
  const pepper = process.env.INVITATION_TOKEN_PEPPER;
  if (!pepper)
    return NextResponse.json(
      { message: "Invitation acceptance is not configured." },
      { status: 503 },
    );
  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claims?.claims?.sub)
    return NextResponse.json(
      { message: "Please sign in using the invitation email first." },
      { status: 401 },
    );
  const claimsEmail =
    typeof claims.claims.email === "string" ? claims.claims.email.toLowerCase() : "";
  if (claimsEmail !== parsed.data.email.toLowerCase())
    return NextResponse.json(
      { message: "The signed-in email does not match this invitation." },
      { status: 403 },
    );

  const tokenHash = hashInvitationToken(parsed.data.token, pepper);
  const { data, error } = await supabase.rpc("consume_invitation", {
    p_token_hash: tokenHash,
    p_accept_privacy: parsed.data.privacyAccepted,
    p_accept_community_guidelines: parsed.data.communityGuidelinesAccepted,
  });
  if (error)
    return NextResponse.json(
      {
        message:
          "This invitation is invalid, expired, revoked, already used, or tied to another email.",
      },
      { status: 400 },
    );
  return NextResponse.json({
    message: "Membership access activated.",
    result: data,
    next: "/this-week",
  });
}
