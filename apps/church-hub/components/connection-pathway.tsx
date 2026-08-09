"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const initialSteps = [
  { key: "visit", week: "Week 1", title: "Plan a Sunday and meet one welcome person", body: "Review the current gathering, decide whether a welcome contact would help, and attend at your own pace.", href: "/this-week", action: "Review this week" },
  { key: "fellowship", week: "Week 2", title: "Attend one low-pressure fellowship invitation", body: "Choose a meal, walk, playdate, active meetup, or small conversation that fits your explicit preferences.", href: "/fellowship", action: "Find fellowship" },
  { key: "bible", week: "Week 3", title: "Explore one Bible conversation or group", body: "Open the current whole-Bible lesson and bring one honest question to another person.", href: "/bible", action: "Open Bible Journey" },
  { key: "service", week: "Week 4", title: "Discover one service opportunity", body: "Find a real need, understand the shift and partner, and decide whether serving beside others is a helpful next step.", href: "/service", action: "Explore service" },
] as const;

type StepKey = (typeof initialSteps)[number]["key"];
type StepStatus = "not_started" | "completed" | "skipped";

export function ConnectionPathway() {
  const [statuses, setStatuses] = useState<Record<StepKey, StepStatus>>({ visit: "not_started", fellowship: "not_started", bible: "not_started", service: "not_started" });
  const [paused, setPaused] = useState(false);
  const completed = useMemo(() => Object.values(statuses).filter((value) => value === "completed").length, [statuses]);
  const progress = Math.round((completed / initialSteps.length) * 100);

  function update(key: StepKey, status: StepStatus) {
    setStatuses((current) => ({ ...current, [key]: status }));
  }

  return <section className="connection-pathway">
    <header className="pathway-progress-header"><div><p className="hub-kicker">Voluntary 30-day connection path</p><h2>{paused ? "Your pathway is paused." : "One meaningful next step at a time."}</h2><p>Completion is not a measure of spirituality, worth, eligibility, or leadership potential. Skip, pause, or change any step.</p></div><div className="pathway-progress-ring" style={{ "--path-progress": `${progress}%` } as React.CSSProperties}><strong>{progress}%</strong><span>{completed} complete</span></div></header>
    <div className="pathway-control-row"><button className="hub-button hub-button--secondary" type="button" onClick={() => setPaused((value) => !value)}>{paused ? "Resume pathway" : "Pause pathway"}</button><Link className="hub-button hub-button--secondary" href="/profile">Change connection preferences</Link></div>
    <div className={`pathway-step-list${paused ? " pathway-step-list--paused" : ""}`}>
      {initialSteps.map((step) => { const status = statuses[step.key]; return <article key={step.key} className={`pathway-step pathway-step--${status}`}><span className="pathway-week">{step.week}</span><div><h3>{step.title}</h3><p>{step.body}</p><div className="row-actions"><Link className="hub-button hub-button--primary" href={step.href}>{step.action}</Link><button type="button" className="pathway-text-button" onClick={() => update(step.key, status === "completed" ? "not_started" : "completed")}>{status === "completed" ? "Mark not complete" : "Mark complete"}</button><button type="button" className="pathway-text-button" onClick={() => update(step.key, status === "skipped" ? "not_started" : "skipped")}>{status === "skipped" ? "Restore" : "Skip for now"}</button></div></div><strong className="pathway-status">{status === "completed" ? "Completed ✓" : status === "skipped" ? "Skipped" : "Open"}</strong></article>; })}
    </div>
  </section>;
}
