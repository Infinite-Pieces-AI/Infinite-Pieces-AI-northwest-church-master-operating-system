"use client";

import { useState } from "react";
import { trackPublicEvent } from "@/lib/analytics-client";

export function VisitForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [started, setStarted] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    payload.partySize = String(payload.partySize || "1");
    payload.communicationConsent = form.get("communicationConsent") === "on" ? "true" : "false";
    try {
      const response = await fetch("/api/public/visit-requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload, partySize: Number(payload.partySize), communicationConsent: payload.communicationConsent === "true" }) });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Unable to send your request");
      setStatus("success");
      setMessage(result.message ?? "Thank you. A welcome volunteer will follow up using the contact information you provided.");
      trackPublicEvent("plan_visit_submitted", { path: "/plan-a-visit" });
      event.currentTarget.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to send your request");
    }
  }

  return <form className="form-card" onFocusCapture={() => { if (!started) { setStarted(true); trackPublicEvent("plan_visit_started", { path: "/plan-a-visit" }); } }} onSubmit={submit}><div className="form-grid"><label><span>First name</span><input name="firstName" autoComplete="given-name" required maxLength={80} /></label><label><span>Last name</span><input name="lastName" autoComplete="family-name" required maxLength={80} /></label><label><span>Email</span><input type="email" name="email" autoComplete="email" required maxLength={254} /></label><label><span>Phone (optional)</span><input name="phone" autoComplete="tel" maxLength={40} /></label><label><span>Party size</span><input type="number" name="partySize" min={1} max={20} defaultValue={1} /></label><label><span>Children’s ages (optional)</span><input name="childrenAges" maxLength={200} placeholder="Example: 4, 7, 12" /></label><label className="form-grid__full"><span>How can we help?</span><select name="requestedNextStep" defaultValue="plan_visit"><option value="plan_visit">Plan a Sunday visit</option><option value="bible_study">Learn about a Bible study</option><option value="family_group">Connect with a family group</option><option value="prayer">Request prayer</option><option value="general_question">Ask a general question</option></select></label><label className="form-grid__full"><span>Message (optional)</span><textarea name="message" rows={5} maxLength={1500} /></label><label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label><input type="hidden" name="sourcePath" value="/plan-a-visit" /><label className="check-row form-grid__full"><input type="checkbox" name="communicationConsent" required /><span>I agree that an authorized church volunteer may contact me about this request. I can opt out at any time.</span></label></div><button className="button button--gold" disabled={status === "submitting"}>{status === "submitting" ? "Sending…" : "Send my visit request"}</button>{message ? <p className={`form-status form-status--${status}`} role="status">{message}</p> : null}</form>;
}
