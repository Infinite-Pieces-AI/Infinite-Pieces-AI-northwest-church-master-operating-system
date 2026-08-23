"use client";

import { useState } from "react";
import { trackPublicEvent } from "@/lib/analytics-client";

const interestLabels = {
  church_peer_support: "Learn about the church peer-support ministry",
  online_conversation: "Request a private online conversation",
  family_support: "Ask about support for a family member",
  treatment_resources: "Receive official treatment-resource links",
  general_question: "Ask a general question",
} as const;

export function RecoveryInterestForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [contactMethod, setContactMethod] = useState<"email" | "phone">("email");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      firstName: String(data.get("firstName") ?? ""),
      contactMethod,
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      interestType: String(data.get("interestType") ?? "church_peer_support"),
      message: String(data.get("message") ?? ""),
      consentToContact: data.get("consentToContact") === "on",
      sourcePath: "/recovery-support-lowell",
      campaign: new URLSearchParams(window.location.search).get("utm_campaign") ?? "",
      website: String(data.get("website") ?? ""),
    };

    try {
      const response = await fetch("/api/public/recovery-interest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Unable to send the request.");
      setStatus("success");
      setMessage(
        result.message ??
          "Your request was sent to an authorized ministry leader using the contact method you selected.",
      );
      trackPublicEvent("recovery_support_requested", {
        path: "/recovery-support-lowell",
        interestType: payload.interestType,
      });
      form.reset();
      setContactMethod("email");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to send the request.");
    }
  }

  return (
    <form className="form-card recovery-interest-form" onSubmit={submit}>
      <div className="form-grid">
        <label>
          <span>First name</span>
          <input name="firstName" autoComplete="given-name" required maxLength={80} />
        </label>
        <label>
          <span>What would help?</span>
          <select name="interestType" defaultValue="church_peer_support">
            {Object.entries(interestLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="form-grid__full contact-choice">
          <legend>How may an authorized leader contact you?</legend>
          <label>
            <input
              type="radio"
              name="contactMethod"
              value="email"
              checked={contactMethod === "email"}
              onChange={() => setContactMethod("email")}
            />
            Email
          </label>
          <label>
            <input
              type="radio"
              name="contactMethod"
              value="phone"
              checked={contactMethod === "phone"}
              onChange={() => setContactMethod("phone")}
            />
            Phone
          </label>
        </fieldset>
        {contactMethod === "email" ? (
          <label className="form-grid__full">
            <span>Email</span>
            <input type="email" name="email" autoComplete="email" required maxLength={254} />
          </label>
        ) : (
          <label className="form-grid__full">
            <span>Phone</span>
            <input name="phone" autoComplete="tel" required maxLength={40} />
          </label>
        )}
        <label className="form-grid__full">
          <span>Optional message</span>
          <textarea
            name="message"
            rows={5}
            maxLength={3000}
            placeholder="Share only what is needed for an appropriate response. Do not include another person’s treatment records or private information."
          />
        </label>
        <label className="honeypot" aria-hidden="true">
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
        <label className="check-row form-grid__full">
          <input type="checkbox" name="consentToContact" required />
          <span>
            I consent to an authorized church ministry leader contacting me about this request. I
            understand this church peer ministry is not medical treatment, detoxification, emergency
            care, or a promise of recovery outcomes.
          </span>
        </label>
      </div>
      <button className="button button--gold" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending privately…" : "Request a private response"}
      </button>
      {message ? (
        <p className={`form-status form-status--${status}`} role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
