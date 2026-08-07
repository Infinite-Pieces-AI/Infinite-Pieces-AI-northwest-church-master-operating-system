"use client";
import { useState } from "react";
export function AccessRequestForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const response = await fetch("/api/access-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...body,
        policyAcknowledged: form.get("policyAcknowledged") === "on",
      }),
    });
    const result = (await response.json()) as { message: string };
    setMessage(result.message);
    setBusy(false);
    if (response.ok) event.currentTarget.reset();
  }
  return (
    <form className="auth-form auth-form--wide" onSubmit={submit}>
      <div className="auth-grid">
        <label>
          <span>First name</span>
          <input name="firstName" required />
        </label>
        <label>
          <span>Last name</span>
          <input name="lastName" required />
        </label>
        <label>
          <span>Email</span>
          <input type="email" name="email" required />
        </label>
        <label>
          <span>Phone (optional)</span>
          <input name="phone" />
        </label>
        <label className="auth-grid__full">
          <span>Relationship to the church</span>
          <select name="relationshipToChurch">
            <option value="member">Member</option>
            <option value="regular_attendee">Regular attendee</option>
            <option value="parent_guardian">Parent or guardian</option>
            <option value="teen">Teen</option>
            <option value="group_leader">Group leader</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="auth-grid__full">
          <span>Known leader (optional)</span>
          <input name="knownLeader" />
        </label>
        <label className="auth-grid__full">
          <span>Why are you requesting access?</span>
          <textarea name="reason" required minLength={10} maxLength={1000} rows={4} />
        </label>
        <label className="honeypot">
          Website
          <input name="website" tabIndex={-1} />
        </label>
        <label className="check-line auth-grid__full">
          <input type="checkbox" name="policyAcknowledged" required />
          <span>
            I understand access is reviewed, ministry-limited, and governed by the church privacy
            and community policies.
          </span>
        </label>
      </div>
      <button className="hub-button hub-button--primary" disabled={busy}>
        {busy ? "Submitting…" : "Request member access"}
      </button>
      {message ? (
        <p className="auth-message" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
