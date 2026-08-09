"use client";

import { useState } from "react";
import { trackPublicEvent } from "@/lib/analytics-client";

const topics = [
  ["first_visit", "A first visit"],
  ["beliefs", "Beliefs or questions about Jesus"],
  ["bible_study", "Bible study"],
  ["kids_teens", "Kids or teens"],
  ["accessibility", "Accessibility"],
  ["online", "Online participation"],
  ["other", "Something else"],
] as const;

type Topic = (typeof topics)[number][0];

export function QuestionForm({ defaultTopic = "first_visit" }: { defaultTopic?: Topic }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [contactMethod, setContactMethod] = useState<"email" | "phone">("email");
  const [topic, setTopic] = useState<Topic>(defaultTopic);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    const form = new FormData(event.currentTarget);
    const payload = {
      firstName: String(form.get("firstName") ?? ""),
      contactMethod,
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      topic,
      message: String(form.get("message") ?? ""),
      communicationConsent: form.get("communicationConsent") === "on",
      sourcePath: window.location.pathname,
      website: String(form.get("website") ?? ""),
    };

    try {
      const response = await fetch("/api/public/questions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Unable to send your question");
      setStatus("success");
      setMessage(result.message ?? "Thank you. An authorized volunteer will respond.");
      trackPublicEvent(
        topic === "online"
          ? "online_conversation_requested"
          : topic === "bible_study"
            ? "bible_study_requested"
            : "question_submitted",
        { path: window.location.pathname, topic },
      );
      event.currentTarget.reset();
      setContactMethod("email");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to send your question");
    }
  }

  return (
    <form className="form-card consent-first-form" onSubmit={submit}>
      <div className="form-grid">
        <label>
          <span>First name</span>
          <input name="firstName" autoComplete="given-name" required maxLength={80} />
        </label>
        <label>
          <span>Question topic</span>
          <select value={topic} onChange={(event) => setTopic(event.target.value as Topic)}>
            {topics.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>How should we respond?</span>
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
        <label className="form-grid__full">
          <span>Your question</span>
          <textarea name="message" rows={6} minLength={10} maxLength={2000} required />
        </label>
        <label className="honeypot" aria-hidden="true">
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
        <label className="check-row form-grid__full">
          <input type="checkbox" name="communicationConsent" required />
          <span>
            I agree that an authorized church volunteer may contact me only about this question. I
            can opt out at any time.
          </span>
        </label>
      </div>
      <button className="button button--gold" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Send my question"}
      </button>
      {message ? (
        <p className={`form-status form-status--${status}`} role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
    </form>
  );
}
