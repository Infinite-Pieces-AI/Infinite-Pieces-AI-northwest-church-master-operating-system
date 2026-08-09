"use client";

import { useState, type FormEvent } from "react";
import type { FellowshipMeetupDetail, FellowshipMessageView, FellowshipResponseStatus } from "@/lib/fellowship";

export function FellowshipThread({ initial, demo }: { initial: FellowshipMeetupDetail; demo: boolean }) {
  const [messages, setMessages] = useState<FellowshipMessageView[]>(initial.messages);
  const [status, setStatus] = useState<FellowshipResponseStatus | null>(initial.meetup.joinedStatus ?? null);
  const [notice, setNotice] = useState(status ? "Participant details are available according to your RSVP state." : "Join or express interest before opening private details and conversation.");
  const joined = status === "host" || status === "interested" || status === "going" || status === "waitlisted";

  async function respond(next: "interested" | "going" | "cancelled") {
    const response = await fetch(`/api/fellowship/meetups/${initial.meetup.id}/rsvp`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: next, partySize: 1 }) });
    const result = (await response.json()) as { status?: FellowshipResponseStatus; message?: string };
    if (!response.ok) { setNotice(result.message ?? "Response could not be saved."); return; }
    setStatus(result.status ?? next);
    setNotice(next === "cancelled" ? "Your response was cancelled." : `Your response is now ${result.status ?? next}.`);
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = String(form.get("body") ?? "").trim();
    if (!body) return;
    const response = await fetch(`/api/fellowship/meetups/${initial.meetup.id}/messages`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body, clientMessageId: crypto.randomUUID() }) });
    const result = (await response.json()) as { id?: string; createdAt?: string; message?: string };
    if (!response.ok) { setNotice(result.message ?? "Message could not be sent."); return; }
    setMessages((current) => [...current, { id: result.id ?? `message-${Date.now()}`, authorProfileId: "self", authorLabel: "You", body, createdAt: result.createdAt ?? new Date().toISOString() }]);
    event.currentTarget.reset();
    setNotice(demo ? "Synthetic message added to this browser session." : "Message sent to the participant-only thread.");
  }

  return <div className="fellowship-thread-layout">
    <section className="hub-panel fellowship-detail-card"><p className="hub-kicker">{initial.meetup.audience}</p><h2>{initial.meetup.title}</h2><p>{initial.meetup.description}</p><dl className="meetup-details"><div><dt>When</dt><dd>{initial.meetup.dateLabel} · {initial.meetup.timeLabel}</dd></div><div><dt>General place</dt><dd>{initial.meetup.locationName} · {initial.meetup.area}</dd></div><div><dt>Host</dt><dd>{initial.meetup.host}</dd></div><div><dt>Accessibility</dt><dd>{initial.meetup.accessibilityNote ?? "Ask the host in the participant thread."}</dd></div><div><dt>Cost</dt><dd>{initial.meetup.costNote ?? "No approved cost note is attached."}</dd></div></dl><div className="row-actions"><button className="hub-button hub-button--primary" type="button" onClick={() => respond("going")}>I’m going</button><button className="hub-button hub-button--secondary" type="button" onClick={() => respond("interested")}>Interested</button>{joined ? <button className="hub-button hub-button--secondary" type="button" onClick={() => respond("cancelled")}>Cancel response</button> : null}</div><p className="fellowship-notice" role="status">{notice}</p></section>
    <section className="hub-panel fellowship-private-card"><p className="hub-kicker">Participant-only details</p><h2>Prepare without exposing private locations publicly.</h2>{joined ? <><div className="private-instruction-box"><strong>Exact instructions</strong><p>{initial.exactMeetingInstructions ?? "The host has not posted additional instructions yet."}</p>{initial.virtualJoinUrl ? <a href={initial.virtualJoinUrl}>Open approved virtual link</a> : null}<p>{initial.hostContactNote}</p></div><a className="hub-button hub-button--secondary" href={`/api/fellowship/meetups/${initial.meetup.id}/calendar`}>Add to my calendar</a></> : <p>Join or express interest to unlock the authorized instruction record.</p>}</section>
    <section className="hub-panel fellowship-chat-card"><div className="panel-heading"><div><p className="hub-kicker">Temporary purpose-specific conversation</p><h2>Meetup thread</h2></div><span className="pill">Participants only</span></div>{joined ? <><div className="thread-messages">{messages.map((message) => <article key={message.id}><strong>{message.authorLabel}</strong><p>{message.body}</p><small>{new Date(message.createdAt).toLocaleString()}</small></article>)}</div><form className="thread-composer" onSubmit={send}><label><span>Message participants</span><textarea name="body" rows={3} maxLength={2000} required /></label><button className="hub-button hub-button--primary">Send message</button></form></> : <p>Join the meetup before reading or posting in its thread.</p>}</section>
  </div>;
}
