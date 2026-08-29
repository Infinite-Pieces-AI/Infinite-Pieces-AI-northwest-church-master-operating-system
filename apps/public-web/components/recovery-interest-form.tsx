"use client";

import { useState, type FormEvent } from "react";

export function RecoveryInterestForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      displayName: String(form.get("displayName") ?? ""),
      contactMethod: String(form.get("contactMethod") ?? "email"),
      contactValue: String(form.get("contactValue") ?? ""),
      requestedNextStep: String(form.get("requestedNextStep") ?? "learn_about_group"),
      message: String(form.get("message") ?? ""),
      consentToContact: form.get("consentToContact") === "on",
      website: String(form.get("website") ?? ""),
      sourcePath: "/recovery-support",
    };
    try {
      const response = await fetch("/api/public/recovery-inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Unable to send this request");
      setStatus("sent");
      setMessage(
        result.message ??
          "Your request was received. An approved church leader will use only the contact method you selected.",
      );
      event.currentTarget.reset();
    } catch (caught) {
      setStatus("error");
      setMessage(caught instanceof Error ? caught.message : "Unable to send this request");
    }
  }

  return (
    <form className="recovery-public-form" onSubmit={submit}>
      <label>
        Name you want us to use
        <input name="displayName" autoComplete="name" maxLength={160} required />
      </label>
      <label>
        Contact method
        <select name="contactMethod" defaultValue="email">
          <option value="email">Email</option>
          <option value="phone">Phone</option>
        </select>
      </label>
      <label className="recovery-public-form__wide">
        Email address or phone number
        <input name="contactValue" maxLength={254} required />
      </label>
      <label className="recovery-public-form__wide">
        What next step would be helpful?
        <select name="requestedNextStep" defaultValue="learn_about_group">
          <option value="learn_about_group">Learn about the church recovery group</option>
          <option value="speak_with_leader">Speak privately with an approved leader</option>
          <option value="find_treatment_resources">Find verified treatment resources</option>
          <option value="online_option">Ask about an online option</option>
        </select>
      </label>
      <label className="recovery-public-form__wide">
        Optional message
        <textarea
          name="message"
          rows={5}
          maxLength={2000}
          placeholder="Please avoid medical records, detailed substance-use history, or information about another person."
        />
      </label>
      <label className="recovery-public-form__honeypot" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="recovery-public-consent recovery-public-form__wide">
        <input name="consentToContact" type="checkbox" required />
        <span>
          I consent to an approved church leader contacting me about the next step I selected. I
          understand this form is not emergency, medical, or treatment care.
        </span>
      </label>
      <button className="button button--gold" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending securely…" : "Request a confidential conversation"}
      </button>
      {message ? (
        <p className={`recovery-public-form__status recovery-public-form__status--${status}`} role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
