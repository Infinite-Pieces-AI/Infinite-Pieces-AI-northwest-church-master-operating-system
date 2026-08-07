import Link from "next/link";
import { AcceptInvitationForm } from "@/components/accept-invitation-form";
import { getViewer } from "@/lib/auth/viewer";

export const dynamic = "force-dynamic";

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;
  const viewer = await getViewer();
  const initialEmail = email ?? viewer?.email;
  if (!token)
    return (
      <div className="auth-card">
        <p className="hub-kicker">Invite-only membership</p>
        <h1>Invitation token missing</h1>
        <p>Open the complete authenticated invitation link sent to the approved email address.</p>
        <Link className="button button-secondary" href="/login">
          Sign in
        </Link>
      </div>
    );
  return (
    <div className="auth-card">
      <p className="hub-kicker">Invite-only membership</p>
      <h1>Activate your member access</h1>
      <p>
        {viewer
          ? `Signed in as ${viewer.email}.`
          : "First use the authenticated sign-in link in your invitation email, then return here."}
      </p>
      <AcceptInvitationForm token={token} {...(initialEmail ? { initialEmail } : {})} />
      <p className="auth-note">
        The token is single-use, expiring, email-bound, revocable, and recorded in the audit trail.
      </p>
    </div>
  );
}
