"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ConnectionPathwayState, ConnectionStepKey, ConnectionStepStatus } from "@/lib/connection-pathway";

const initialSteps = [
  { key: "visit", week: "Week 1", title: "Plan a Sunday and meet one welcome person", body: "Review the current gathering, decide whether a welcome contact would help, and attend at your own pace.", href: "/this-week", action: "Review this week" },
  { key: "fellowship", week: "Week 2", title: "Attend one low-pressure fellowship invitation", body: "Choose a meal, walk, playdate, active meetup, or small conversation that fits your explicit preferences.", href: "/fellowship", action: "Find fellowship" },
  { key: "bible", week: "Week 3", title: "Explore one Bible conversation or group", body: "Open the current whole-Bible lesson and bring one honest question to another person.", href: "/bible", action: "Open Bible Journey" },
  { key: "service", week: "Week 4", title: "Discover one service opportunity", body: "Find a real need, understand the shift and partner, and decide whether serving beside others is a helpful next step.", href: "/service", action: "Explore service" },
] as const;

export function ConnectionPathway({ initial, demo }: { initial: ConnectionPathwayState; demo: boolean }) {
  const [statuses, setStatuses] = useState(initial.steps);
  const [enrollmentStatus, setEnrollmentStatus] = useState(initial.status);
  const [notice, setNotice] = useState(demo ? "Demo progress stays in this browser session." : "Your pathway is private and member-owned.");
  const completed = useMemo(() => Object.values(statuses).filter((value) => value === "completed").length, [statuses]);
  const progress = Math.round((completed / initialSteps.length) * 100);
  const paused = enrollmentStatus === "paused";

  async function setEnrollment(status: ConnectionPathwayState["status"]) {
    const response = await fetch("/api/connection-pathway", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "set_enrollment", status }) });
    const result = (await response.json()) as { message?: string };
    if (!response.ok) { setNotice(result.message ?? "Pathway status could not be saved."); return; }
    setEnrollmentStatus(status); setNotice(status === "paused" ? "Your pathway is paused." : "Your pathway is active.");
  }

  async function update(key: ConnectionStepKey, status: ConnectionStepStatus) {
    const response = await fetch("/api/connection-pathway", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "set_step", stepKey: key, status }) });
    const result = (await response.json()) as { message?: string };
    if (!response.ok) { setNotice(result.message ?? "Pathway step could not be saved."); return; }
    setStatuses((current) => ({ ...current, [key]: status })); setNotice(status === "completed" ? "Step marked complete. This is not a spiritual score." : status === "skipped" ? "Step skipped for now." : "Step restored.");
  }

  return <section className="connection-pathway">
    <header className="pathway-progress-header"><div><p className="hub-kicker">Voluntary 30-day connection path</p><h2>{paused ? "Your pathway is paused." : "One meaningful next step at a time."}</h2><p>Completion is not a measure of spirituality, worth, eligibility, or leadership potential. Skip, pause, or change any step.</p></div><div className="pathway-progress-ring" style={{ "--path-progress": `${progress}%` } as React.CSSProperties}><strong>{progress}%</strong><span>{completed} complete</span></div></header>
    <div className="pathway-control-row"><button className="hub-button hub-button--secondary" type="button" onClick={() => setEnrollment(paused ? "active" : "paused")}>{paused ? "Resume pathway" : "Pause pathway"}</button><Link className="hub-button hub-button--secondary" href="/profile">Change connection preferences</Link></div>
    <p className="service-notice" role="status">{notice}</p>
    <div className={`pathway-step-list${paused ? " pathway-step-list--paused" : ""}`}>{initialSteps.map((step) => { const status = statuses[step.key]; return <article key={step.key} className={`pathway-step pathway-step--${status}`}><span className="pathway-week">{step.week}</span><div><h3>{step.title}</h3><p>{step.body}</p><div className="row-actions"><Link className="hub-button hub-button--primary" href={step.href}>{step.action}</Link><button type="button" className="pathway-text-button" onClick={() => update(step.key, status === "completed" ? "not_started" : "completed")}>{status === "completed" ? "Mark not complete" : "Mark complete"}</button><button type="button" className="pathway-text-button" onClick={() => update(step.key, status === "skipped" ? "not_started" : "skipped")}>{status === "skipped" ? "Restore" : "Skip for now"}</button></div></div><strong className="pathway-status">{status === "completed" ? "Completed ✓" : status === "skipped" ? "Skipped" : "Open"}</strong></article>; })}</div>
  </section>;
}
