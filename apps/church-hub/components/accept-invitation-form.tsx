"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AcceptInvitationForm({ token, initialEmail }: { token: string; initialEmail?: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/invitations/accept", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token,
        email: String(form.get("email") ?? ""),
        privacyAccepted: form.get("privacyAccepted") === "on",
        communityGuidelinesAccepted: form.get("communityGuidelinesAccepted") === "on"
      })
    });
    const result = await response.json().catch(() => ({ message: "Invitation could not be accepted." }));
    setSubmitting(false);
    if (!response.ok) {
      setMessage(result.message ?? "Invitation could not be accepted.");
      return;
    }
    setMessage(result.message ?? "Membership access activated.");
    router.replace(result.next ?? "/this-week");
    router.refresh();
  }

  return <form className="auth-form" onSubmit={submit}>
    <label>Email used for this invitation
      <input name="email" type="email" autoComplete="email" defaultValue={initialEmail} required />
    </label>
    <label className="check-row"><input name="privacyAccepted" type="checkbox" required /> <span>I have read and accept the privacy notice.</span></label>
    <label className="check-row"><input name="communityGuidelinesAccepted" type="checkbox" required /> <span>I accept the member community guidelines.</span></label>
    <button className="button button-primary" type="submit" disabled={submitting}>{submitting ? "Activating…" : "Activate member access"}</button>
    {message ? <p className="form-message" role="status" aria-live="polite">{message}</p> : null}
  </form>;
}
