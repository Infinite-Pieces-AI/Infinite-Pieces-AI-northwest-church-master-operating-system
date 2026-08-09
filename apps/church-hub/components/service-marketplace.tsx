"use client";

import { useMemo, useState } from "react";
import type { ServiceOpportunityView, ServiceSignupStatus } from "@/lib/service";

type Filter = "all" | "family" | "accessible" | "remote" | "recurring";

export function ServiceMarketplace({ initialOpportunities, demo }: { initialOpportunities: ServiceOpportunityView[]; demo: boolean }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [statuses, setStatuses] = useState<Record<string, ServiceSignupStatus>>(() => Object.fromEntries(initialOpportunities.map((item) => [item.shiftId, item.joinedStatus])));
  const [notice, setNotice] = useState(demo ? "Demo mode: shift selections remain in this browser session." : "Shift responses save through member-scoped database permissions.");
  const visible = useMemo(() => opportunities.filter((item) => { if (filter === "family") return item.familyFriendly; if (filter === "accessible") return /seated|accessible|remote|screen-reader/i.test(item.accessibility); if (filter === "remote") return /online|home/i.test(item.location); if (filter === "recurring") return item.recurring; return true; }), [filter, opportunities]);

  async function toggle(item: ServiceOpportunityView) {
    const current = statuses[item.shiftId];
    const next = current === "going" || current === "waitlisted" ? "cancelled" : "going";
    const response = await fetch(`/api/service/shifts/${item.shiftId}/signup`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: next, partySize: 1 }) });
    const result = (await response.json()) as { status?: ServiceSignupStatus; count?: number | null; message?: string };
    if (!response.ok) { setNotice(result.message ?? "Shift response could not be saved."); return; }
    const saved = result.status ?? next;
    setStatuses((values) => ({ ...values, [item.shiftId]: saved }));
    if (typeof result.count === "number") setOpportunities((values) => values.map((value) => value.shiftId === item.shiftId ? { ...value, signedUp: result.count ?? value.signedUp } : value));
    setNotice(saved === "waitlisted" ? `“${item.title}” is full, so you were placed on the waitlist.` : saved === "cancelled" ? `You left the shift for “${item.title}.”` : `You joined the shift for “${item.title}.”`);
  }

  return <>
    <div className="service-filter-row" aria-label="Service opportunity filters">{(["all", "family", "accessible", "remote", "recurring"] as const).map((value) => <button key={value} type="button" className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{value === "all" ? "All opportunities" : value}</button>)}</div>
    <p className="service-notice" role="status">{notice}</p>
    <div className="service-market-grid">{visible.map((item) => { const status = statuses[item.shiftId]; const count = item.signedUp; return <article className="service-opportunity-card" key={item.id}><header><div><p className="hub-kicker">{item.partner}</p><h2>{item.title}</h2></div><span className={item.familyFriendly ? "service-family-badge" : "service-standard-badge"}>{item.familyFriendly ? "Family fit" : "Specific audience"}</span></header><div className="service-impact"><strong>Need</strong><p>{item.need}</p><strong>Expected impact</strong><p>{item.impact}</p></div><dl className="service-detail-list"><div><dt>When</dt><dd>{item.dateLabel} · {item.duration}</dd></div><div><dt>Where</dt><dd>{item.location}</dd></div><div><dt>Age</dt><dd>{item.ageRequirement}</dd></div><div><dt>Physical</dt><dd>{item.physicalRequirements}</dd></div><div><dt>Accessibility</dt><dd>{item.accessibility}</dd></div><div><dt>Safeguarding</dt><dd>{item.safeguarding}</dd></div><div><dt>Bring</dt><dd>{item.whatToBring}</dd></div></dl><div className="service-skill-row">{item.skills.map((skill) => <span key={skill}>{skill}</span>)}</div><footer><div><strong>{count} of {item.capacity}</strong><span>Shift: {item.shiftLabel}</span></div><button className={`hub-button ${status === "going" || status === "waitlisted" ? "hub-button--secondary" : "hub-button--primary"}`} type="button" onClick={() => toggle(item)}>{status === "waitlisted" ? "Waitlisted ✓" : status === "going" ? "Joined ✓" : "Join this shift"}</button></footer></article>; })}</div>
    <section className="hub-panel service-integrity-panel"><div><p className="hub-kicker">Service with integrity</p><h2>Meet a real need without turning service into a spiritual leaderboard.</h2></div><ul><li>No points, public holiness rankings, or pressure-based streaks.</li><li>Partners and leaders define the need, safeguards, and practical work.</li><li>Recipient dignity matters more than promotional content.</li><li>Private team logistics belong in authorized channels.</li></ul></section>
  </>;
}
