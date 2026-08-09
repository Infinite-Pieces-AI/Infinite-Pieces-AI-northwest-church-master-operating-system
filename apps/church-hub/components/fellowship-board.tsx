"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import type { FellowshipCategory } from "@/lib/demo-data";
import type { FellowshipMeetupView, FellowshipResponseStatus } from "@/lib/fellowship";

const filters = [["all","All invitations"],["today","Today"],["families","Families"],["prayer","Prayer"],["food","Coffee & meals"],["service","Serve together"],["sports","Active"]] as const;
type FilterKey = (typeof filters)[number][0];
const categoryLabels: Record<FellowshipCategory, string> = { prayer: "Prayer", families: "Families", outdoors: "Outdoors", food: "Coffee & meals", service: "Service", sports: "Sports", "young-adults": "Young adults", "whole-church": "Whole church" };

function matches(meetup: FellowshipMeetupView, filter: FilterKey) { if (filter === "all") return true; if (filter === "today") return meetup.dateLabel === "Today"; if (filter === "families") return meetup.familyFriendly || meetup.category === "families"; return meetup.category === filter; }

export function FellowshipBoard({ initialMeetups, demo }: { initialMeetups: FellowshipMeetupView[]; demo: boolean }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [meetups, setMeetups] = useState(initialMeetups);
  const [responses, setResponses] = useState<Record<string, FellowshipResponseStatus | null>>(() => Object.fromEntries(initialMeetups.map((item) => [item.id, item.joinedStatus ?? null])));
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState(demo ? "Demo mode: responses and new invitations stay in this browser session." : "Responses save through database-enforced member permissions.");
  const visible = useMemo(() => meetups.filter((meetup) => matches(meetup, filter)), [meetups, filter]);

  async function respond(meetup: FellowshipMeetupView, status: "interested" | "going" | "cancelled") {
    const response = await fetch(`/api/fellowship/meetups/${meetup.id}/rsvp`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ status, partySize: 1 }) });
    const result = (await response.json()) as { status?: FellowshipResponseStatus; attendeeCount?: number | null; message?: string };
    if (!response.ok) { setNotice(result.message ?? "Response could not be saved."); return; }
    const savedStatus = result.status ?? status;
    setResponses((current) => ({ ...current, [meetup.id]: savedStatus }));
    if (typeof result.attendeeCount === "number") setMeetups((current) => current.map((item) => item.id === meetup.id ? { ...item, attendeeCount: result.attendeeCount ?? item.attendeeCount } : item));
    setNotice(savedStatus === "waitlisted" ? `“${meetup.title}” is full, so you were added to the waitlist.` : status === "cancelled" ? `Your response to “${meetup.title}” was cancelled.` : `Your response to “${meetup.title}” is now ${savedStatus}.`);
  }

  async function createMeetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const startsLocal = String(form.get("startsAt") ?? "");
    const endsLocal = String(form.get("endsAt") ?? "");
    const payload = {
      title: String(form.get("title") ?? ""), category: String(form.get("category") ?? "prayer"), description: String(form.get("description") ?? ""), visibility: String(form.get("visibility") ?? "church"), audienceLabel: String(form.get("audienceLabel") ?? "Church members"),
      startsAt: new Date(startsLocal).toISOString(), endsAt: new Date(endsLocal).toISOString(), timezone: "America/New_York", generalLocationName: String(form.get("location") ?? ""), generalArea: String(form.get("area") ?? "Lowell area"), familyFriendly: form.get("familyFriendly") === "on", capacity: Number(form.get("capacity") ?? 20), allowWaitlist: true,
      exactMeetingInstructions: String(form.get("exactInstructions") ?? ""), accessibilityNotes: String(form.get("accessibility") ?? ""), foodNotes: String(form.get("food") ?? ""), costNotes: String(form.get("cost") ?? ""), transportationNotes: String(form.get("transportation") ?? ""), recurrenceRule: String(form.get("recurrence") ?? ""), weatherPlan: String(form.get("weather") ?? ""),
    };
    if (Number.isNaN(Date.parse(startsLocal)) || Number.isNaN(Date.parse(endsLocal))) { setNotice("Choose a valid start and end time."); return; }
    const response = await fetch("/api/fellowship/meetups", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = (await response.json()) as { id?: string; message?: string };
    if (!response.ok || !result.id) { setNotice(result.message ?? "Invitation could not be created."); return; }
    const start = new Date(startsLocal);
    const newMeetup: FellowshipMeetupView = { id: result.id, title: payload.title, category: payload.category as FellowshipCategory, host: "You", hostInitial: "Y", dateLabel: start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }), timeLabel: start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }), locationName: payload.generalLocationName, area: payload.generalArea, description: payload.description, audience: payload.audienceLabel, attendeeCount: 1, capacity: payload.capacity, familyFriendly: payload.familyFriendly, exactLocationAfterJoin: true, tags: [categoryLabels[payload.category as FellowshipCategory], payload.familyFriendly ? "Kids welcome" : "Member created"], startsAt: payload.startsAt, endsAt: payload.endsAt, visibility: "church", joinedStatus: "host", accessibilityNote: payload.accessibilityNotes, foodNote: payload.foodNotes, costNote: payload.costNotes, transportationNote: payload.transportationNotes, recurrenceLabel: payload.recurrenceRule, weatherPlan: payload.weatherPlan };
    setMeetups((current) => [newMeetup, ...current]);
    setResponses((current) => ({ ...current, [newMeetup.id]: "host" }));
    setShowForm(false); event.currentTarget.reset(); setNotice(`“${payload.title}” was created${demo ? " in this synthetic demo" : " for its authorized member audience"}.`);
  }

  return <div className="fellowship-board">
    <div className="fellowship-toolbar"><div className="filter-chips">{filters.map(([key,label]) => <button key={key} type="button" className={filter === key ? "active" : ""} onClick={() => setFilter(key)}>{label}</button>)}</div><button className="hub-button hub-button--primary" type="button" onClick={() => setShowForm((value) => !value)}>{showForm ? "Close form" : "+ Host a meetup"}</button></div>
    <p className="fellowship-notice" role="status">{notice}</p>
    {showForm ? <section className="host-meetup-panel host-meetup-panel--expanded"><div><p className="hub-kicker">One-minute invitation builder</p><h2>Invite people into ordinary life.</h2><p>Use a public or general meeting place. Exact instructions remain separate and unlock only to authorized participants.</p></div><form className="host-meetup-form" onSubmit={createMeetup}><label>Invitation title<input name="title" required maxLength={100} placeholder="Family prayer walk at the park" /></label><div className="host-meetup-form__row"><label>Type<select name="category">{Object.entries(categoryLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Start<input name="startsAt" type="datetime-local" required /></label><label>End<input name="endsAt" type="datetime-local" required /></label></div><div className="host-meetup-form__row"><label>Visibility<select name="visibility"><option value="church">Church members</option><option value="ministry">Assigned ministry</option><option value="group">Assigned group</option></select></label><label>Audience label<input name="audienceLabel" defaultValue="Church members" /></label><label>Capacity<input name="capacity" type="number" min={2} max={500} defaultValue={20} /></label></div><label>General public meeting place<input name="location" required maxLength={120} placeholder="Shedd Park playground" /></label><label>General area<input name="area" defaultValue="Lowell area" maxLength={100} /></label><label>What should people expect?<textarea name="description" rows={4} required maxLength={1000} /></label><div className="host-meetup-form__row"><label>Accessibility<textarea name="accessibility" rows={3} maxLength={800} /></label><label>Food<textarea name="food" rows={3} maxLength={800} /></label><label>Cost<textarea name="cost" rows={3} maxLength={500} /></label></div><div className="host-meetup-form__row"><label>Transportation<textarea name="transportation" rows={3} maxLength={800} /></label><label>Recurrence<textarea name="recurrence" rows={3} maxLength={500} /></label><label>Weather plan<textarea name="weather" rows={3} maxLength={800} /></label></div><label>Participant-only instructions<textarea name="exactInstructions" rows={3} maxLength={1200} placeholder="Exact entrance, table, or meeting-point information" /></label><label className="meetup-check-line"><input name="familyFriendly" type="checkbox" /><span>Children and families are welcome</span></label><button className="hub-button hub-button--primary">Create invitation</button></form></section> : null}
    <div className="meetup-grid">{visible.map((meetup) => { const status = responses[meetup.id]; const joined = Boolean(status && status !== "cancelled"); return <article className={`meetup-card meetup-card--${meetup.category}`} key={meetup.id}><div className="meetup-card__glow" /><header className="meetup-card__header"><div className="meetup-category"><span>{meetup.spontaneous ? "⚡" : "∞"}</span><div><small>{categoryLabels[meetup.category]}</small><strong>{meetup.audience}</strong></div></div>{meetup.familyFriendly ? <span className="family-pill">Kids welcome</span> : null}</header><div className="meetup-card__body"><h2>{meetup.title}</h2><p>{meetup.description}</p><dl className="meetup-details"><div><dt>When</dt><dd>{meetup.dateLabel} · {meetup.timeLabel}</dd></div><div><dt>Where</dt><dd>{meetup.locationName} · {meetup.area}</dd></div><div><dt>Host</dt><dd>{meetup.host}</dd></div></dl>{meetup.accessibilityNote ? <p className="meetup-practical-note"><strong>Accessibility:</strong> {meetup.accessibilityNote}</p> : null}{meetup.costNote ? <p className="meetup-practical-note"><strong>Cost:</strong> {meetup.costNote}</p> : null}<p className={`location-reveal${joined ? " location-reveal--open" : ""}`}><span>{joined ? "✓" : "⌁"}</span>{joined ? "Participant instructions and thread are available." : "Exact instructions appear after an authorized response."}</p><div className="meetup-tags">{meetup.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><footer className="meetup-card__footer"><div className="attendee-stack"><span>{meetup.hostInitial}</span><span>A</span><span>K</span><strong>{meetup.attendeeCount} going</strong><small>{meetup.capacity ? `${Math.max(meetup.capacity - meetup.attendeeCount, 0)} spots open` : "Open capacity"}</small></div><div className="meetup-actions"><button className={`hub-button ${status === "going" ? "hub-button--secondary" : "hub-button--primary"}`} type="button" onClick={() => respond(meetup, status === "going" ? "cancelled" : "going")}>{status === "going" ? "Going ✓" : "I’m going"}</button><button className="meetup-chat-button" type="button" onClick={() => respond(meetup, "interested")}>{status === "interested" ? "Interested ✓" : "Interested"}</button>{joined ? <Link className="meetup-chat-button" href={`/fellowship/${meetup.id}`}>Open meetup thread</Link> : null}</div></footer></article>; })}</div>
  </div>;
}
