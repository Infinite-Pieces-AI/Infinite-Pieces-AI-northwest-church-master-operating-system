"use client";

import { useMemo, useState } from "react";
import { serviceOpportunities } from "@/lib/service-data";

type Filter = "all" | "family" | "accessible" | "remote" | "recurring";

export function ServiceMarketplace() {
  const [filter, setFilter] = useState<Filter>("all");
  const [signedUp, setSignedUp] = useState<Set<string>>(() => new Set());
  const [notice, setNotice] = useState("Demo mode: shift selections remain in this browser session.");
  const opportunities = useMemo(() => serviceOpportunities.filter((item) => {
    if (filter === "family") return item.familyFriendly;
    if (filter === "accessible") return /seated|accessible|remote/i.test(item.accessibility);
    if (filter === "remote") return /online|home/i.test(item.location);
    if (filter === "recurring") return item.recurring;
    return true;
  }), [filter]);

  function toggle(shiftId: string, title: string) {
    const joined = signedUp.has(shiftId);
    setSignedUp((current) => {
      const next = new Set(current);
      if (joined) next.delete(shiftId); else next.add(shiftId);
      return next;
    });
    setNotice(joined ? `You left the synthetic shift for “${title}.”` : `You joined the synthetic shift for “${title}.” Production would open the approved team thread and reminders.`);
  }

  return <>
    <div className="service-filter-row" aria-label="Service opportunity filters">
      {(["all", "family", "accessible", "remote", "recurring"] as const).map((value) => <button key={value} type="button" className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{value === "all" ? "All opportunities" : value}</button>)}
    </div>
    <p className="service-notice" role="status">{notice}</p>
    <div className="service-market-grid">
      {opportunities.map((item) => {
        const joined = signedUp.has(item.shiftId);
        const count = item.signedUp + (joined ? 1 : 0);
        return <article className="service-opportunity-card" key={item.id}>
          <header><div><p className="hub-kicker">{item.partner}</p><h2>{item.title}</h2></div><span className={item.familyFriendly ? "service-family-badge" : "service-standard-badge"}>{item.familyFriendly ? "Family fit" : "Specific audience"}</span></header>
          <div className="service-impact"><strong>Need</strong><p>{item.need}</p><strong>Expected impact</strong><p>{item.impact}</p></div>
          <dl className="service-detail-list"><div><dt>When</dt><dd>{item.dateLabel} · {item.duration}</dd></div><div><dt>Where</dt><dd>{item.location}</dd></div><div><dt>Age</dt><dd>{item.ageRequirement}</dd></div><div><dt>Physical</dt><dd>{item.physicalRequirements}</dd></div><div><dt>Accessibility</dt><dd>{item.accessibility}</dd></div><div><dt>Safeguarding</dt><dd>{item.safeguarding}</dd></div><div><dt>Bring</dt><dd>{item.whatToBring}</dd></div></dl>
          <div className="service-skill-row">{item.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
          <footer><div><strong>{count} of {item.capacity}</strong><span>Shift: {item.shiftLabel}</span></div><button className={`hub-button ${joined ? "hub-button--secondary" : "hub-button--primary"}`} type="button" onClick={() => toggle(item.shiftId, item.title)}>{joined ? "Joined ✓" : "Join this shift"}</button></footer>
        </article>;
      })}
    </div>
    <section className="hub-panel service-integrity-panel"><div><p className="hub-kicker">Service with integrity</p><h2>Meet a real need without turning service into a spiritual leaderboard.</h2></div><ul><li>No points, public holiness rankings, or pressure-based streaks.</li><li>Partners and leaders define the need, safeguards, and practical work.</li><li>Recipient dignity matters more than promotional content.</li><li>Private team logistics belong in authorized channels.</li></ul></section>
  </>;
}
