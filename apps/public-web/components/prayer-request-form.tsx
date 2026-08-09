"use client";

import { useState } from "react";

export function PrayerRequestForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [responseRequested, setResponseRequested] = useState(false);
  const [contactMethod, setContactMethod] = useState<"email" | "phone">("email");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    const form = new FormData(event.currentTarget);
    const payload = {
      firstName: String(form.get("firstName") ?? ""),
      prayerText: String(form.get("prayerText") ?? ""),
      responseRequested,
      contactMethod: responseRequested ? contactMethod : undefined,
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      consentToContact: responseRequested && form.get("consentToContact") === "on",
      sourcePath: "/request-prayer",
      website: String(form.get("website") ?? ""),
    };

    try {
      const response = await fetch("/api/public/prayer-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Unable to send your request");
      setStatus("success");
      setMessage(result.message ?? "Your request was sent to the restricted prayer workflow.");
      event.currentTarget.reset();
      setResponseRequested(false);
      setContactMethod("email");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to send your request");
    }
  }

  return (
    <form className="form-card prayer-form" onSubmit={submit}>
      <div className="form-grid">
        <label>
          <span>First name (optional)</span>
          <input name="firstName" autoComplete="given-name" maxLength={80} />
        </label>
        <label className="form-grid__full">
          <span>Prayer request</span>
          <textarea name="prayerText" rows={7} minLength={3} maxLength={2500} required />
        </label>
        <label className="check-row form-grid__full">
          <input
            type="checkbox"
            name="responseRequested"
            checked={responseRequested}
            onChange={(event) => setResponseRequested(event.target.checked)}
          />
          <span>I would like an authorized ministry leader to respond.</span>
        </label>
        {responseRequested ? (
          <>
            <label>
              <span>How should a leader respond?</span>
              <select
                value={contactMethod}
                onChange={(event) => setContactMethod(event.target.value as "email" | "phone")}
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </label>
            {contactMethod === "email" ? (
              <label>
                <span>Email</span>
                <input type="email" name="email" autoComplete="email" required maxLength={254} />
              </label>
            ) : (
              <label>
                <span>Phone</span>
                <input name="phone" autoComplete="tel" required maxLength={40} />
              </label>
            )}
            <label className="check-row form-grid__full">
              <input type="checkbox" name="consentToContact" required />
              <span>I agree that an authorized ministry leader may contact me about this request.</span>
            </label>
          </>
        ) : null}
        <label className="honeypot" aria-hidden="true">
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <button className="button button--gold" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending securely…" : "Send prayer request"}
      </button>
      {message ? (
        <p className={`form-status form-status--${status}`} role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
    </form>
  );
}
