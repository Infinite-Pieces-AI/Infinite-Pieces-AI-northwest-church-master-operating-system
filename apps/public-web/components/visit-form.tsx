"use client";

import { useState } from "react";
import { trackPublicEvent } from "@/lib/analytics-client";

export function VisitForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [started, setStarted] = useState(false);
  const [contactMethod, setContactMethod] = useState<"email" | "phone">("email");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    const form = new FormData(event.currentTarget);
    const payload = {
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      contactMethod,
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      partySize: Number(form.get("partySize") ?? 1),
      childrenAttending: form.get("childrenAttending") === "on",
      practicalNote: String(form.get("practicalNote") ?? ""),
      requestedNextStep: "plan_visit",
      communicationConsent: form.get("communicationConsent") === "on",
      sourcePath: "/plan-a-visit",
      website: String(form.get("website") ?? ""),
    };

    try {
      const response = await fetch("/api/public/visit-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Unable to send your request");
      setStatus("success");
      setMessage(
        result.message ??
          "Thank you. A welcome volunteer will follow up using the contact method you selected.",
      );
      trackPublicEvent("plan_visit_submitted", { path: "/plan-a-visit" });
      event.currentTarget.reset();
      setContactMethod("email");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to send your request");
    }
  }

  return (
    <form
      className="form-card consent-first-form"
      onFocusCapture={() => {
        if (!started) {
          setStarted(true);
          trackPublicEvent("plan_visit_started", { path: "/plan-a-visit" });
        }
      }}
      onSubmit={submit}
    >
      <div className="form-grid">
        <label>
          <span>First name</span>
          <input name="firstName" autoComplete="given-name" required maxLength={80} />
        </label>
        <label>
          <span>Last name (optional)</span>
          <input name="lastName" autoComplete="family-name" maxLength={80} />
        </label>
        <label>
          <span>How should we contact you?</span>
          <select
            name="contactMethod"
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
        <label>
          <span>Approximate party size</span>
          <input type="number" name="partySize" min={1} max={20} defaultValue={1} />
        </label>
        <label className="check-row compact-check-row">
          <input type="checkbox" name="childrenAttending" />
          <span>Children will be attending with me</span>
        </label>
        <label className="form-grid__full">
          <span>Anything practical we should know? (optional)</span>
          <textarea
            name="practicalNote"
            rows={4}
            maxLength={1500}
            placeholder="Accessibility, arrival, seating, or Kids Kingdom questions. Please do not include medical or highly sensitive information here."
          />
        </label>
        <label className="honeypot" aria-hidden="true">
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
        <label className="check-row form-grid__full">
          <input type="checkbox" name="communicationConsent" required />
          <span>
            I agree that an authorized welcome volunteer may contact me about this visit request. I
            can opt out at any time.
          </span>
        </label>
      </div>
      <button className="button button--gold" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Tell someone I’m coming"}
      </button>
      {message ? (
        <p className={`form-status form-status--${status}`} role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
    </form>
  );
}
