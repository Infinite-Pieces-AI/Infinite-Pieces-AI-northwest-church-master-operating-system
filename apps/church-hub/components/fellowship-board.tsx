"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  fellowshipMeetups,
  type FellowshipCategory,
  type FellowshipMeetup
} from "@/lib/demo-data";

const filters = [
  ["all", "All invitations"],
  ["today", "Today"],
  ["families", "Families"],
  ["prayer", "Prayer"],
  ["food", "Coffee & meals"],
  ["service", "Serve together"],
  ["sports", "Active"]
] as const;

type FilterKey = (typeof filters)[number][0];

const categoryLabels: Record<FellowshipCategory, string> = {
  prayer: "Prayer",
  families: "Families",
  outdoors: "Outdoors",
  food: "Coffee & meals",
  service: "Service",
  sports: "Sports",
  "young-adults": "Young adults",
  "whole-church": "Whole church"
};

function meetupMatchesFilter(meetup: FellowshipMeetup, filter: FilterKey) {
  if (filter === "all") return true;
  if (filter === "today") return meetup.dateLabel === "Today";
  if (filter === "families") return meetup.familyFriendly || meetup.category === "families";
  return meetup.category === filter;
}

export function FellowshipBoard() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [joinedIds, setJoinedIds] = useState<Set<string>>(() => new Set(["meetup-2"]));
  const [createdMeetups, setCreatedMeetups] = useState<FellowshipMeetup[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState(
    "Demo mode: joining, chats, and new invitations stay in this browser session only."
  );

  useEffect(() => {
    if (window.location.hash === "#host-meetup-form") {
      setShowForm(true);
    }
  }, []);

  const allMeetups = useMemo(
    () => [...createdMeetups, ...fellowshipMeetups],
    [createdMeetups]
  );
  const visibleMeetups = useMemo(
    () => allMeetups.filter((meetup) => meetupMatchesFilter(meetup, filter)),
    [allMeetups, filter]
  );

  function toggleJoin(meetup: FellowshipMeetup) {
    setJoinedIds((current) => {
      const next = new Set(current);
      if (next.has(meetup.id)) {
        next.delete(meetup.id);
        setNotice(`You left “${meetup.title}” in this synthetic demo.`);
      } else {
        next.add(meetup.id);
        setNotice(
          `You joined “${meetup.title}.” In production, the member-only meetup thread and approved meeting instructions would now unlock.`
        );
      }
      return next;
    });
  }

  function createMeetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const category = String(form.get("category") ?? "prayer") as FellowshipCategory;
    const date = String(form.get("date") ?? "").trim();
    const time = String(form.get("time") ?? "").trim();
    const location = String(form.get("location") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const familyFriendly = form.get("familyFriendly") === "on";

    if (!title || !date || !time || !location || !description) {
      setNotice("Add a title, date, time, public meeting place, and short description.");
      return;
    }

    const newMeetup: FellowshipMeetup = {
      id: `local-${Date.now()}`,
      title,
      category,
      host: "Jordan Member",
      hostInitial: "J",
      dateLabel: date,
      timeLabel: time,
      locationName: location,
      area: "Lowell area",
      description,
      audience: "Church members",
      attendeeCount: 1,
      capacity: 20,
      familyFriendly,
      spontaneous: date.toLowerCase().includes("today"),
      exactLocationAfterJoin: true,
      tags: [categoryLabels[category], familyFriendly ? "Kids welcome" : "Member created"]
    };

    setCreatedMeetups((current) => [newMeetup, ...current]);
    setJoinedIds((current) => new Set(current).add(newMeetup.id));
    setNotice(
      `“${title}” was added to this synthetic demo. A real post would require the selected visibility, safety, and moderation checks.`
    );
    setShowForm(false);
    event.currentTarget.reset();
  }

  return (
    <div className="fellowship-board">
      <div className="fellowship-toolbar">
        <div className="filter-chips" aria-label="Filter fellowship invitations">
          {filters.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={filter === key ? "active" : ""}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          className="hub-button hub-button--primary"
          type="button"
          onClick={() => setShowForm((value) => !value)}
          aria-expanded={showForm}
          aria-controls="host-meetup-form"
        >
          {showForm ? "Close form" : "+ Host a meetup"}
        </button>
      </div>

      <p className="fellowship-notice" aria-live="polite">{notice}</p>

      {showForm ? (
        <section id="host-meetup-form" className="host-meetup-panel">
          <div>
            <p className="hub-kicker">One-minute invitation builder</p>
            <h2>Invite people into ordinary life.</h2>
            <p>
              Share a public activity, general location, start and end time, and who it fits. Home
              addresses, children’s schedules, custody information, and precise live location do not
              belong in the public invitation.
            </p>
          </div>
          <form onSubmit={createMeetup} className="host-meetup-form">
            <label>
              Invitation title
              <input name="title" placeholder="Family prayer walk at the park" maxLength={100} />
            </label>
            <div className="host-meetup-form__row">
              <label>
                Type
                <select name="category" defaultValue="prayer">
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label>
                Day
                <input name="date" placeholder="Today or Saturday" maxLength={40} />
              </label>
              <label>
                Time
                <input name="time" placeholder="5:30-6:15 PM" maxLength={40} />
              </label>
            </div>
            <label>
              Public meeting place
              <input
                name="location"
                placeholder="Shedd Park playground or public coffee shop"
                maxLength={120}
              />
            </label>
            <label>
              What should people expect?
              <textarea
                name="description"
                rows={4}
                placeholder="Low-pressure, stroller friendly, come late or leave early..."
                maxLength={500}
              />
            </label>
            <label className="meetup-check-line">
              <input name="familyFriendly" type="checkbox" />
              <span>Children and families are welcome</span>
            </label>
            <div className="row-actions">
              <button className="hub-button hub-button--primary" type="submit">
                Add synthetic invitation
              </button>
              <button className="hub-button hub-button--secondary" type="button" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <div className="meetup-grid">
        {visibleMeetups.map((meetup) => {
          const joined = joinedIds.has(meetup.id);
          const displayedAttendees = meetup.attendeeCount + (joined && meetup.id !== "meetup-2" ? 1 : 0);
          const remaining = meetup.capacity ? Math.max(meetup.capacity - displayedAttendees, 0) : null;

          return (
            <article className={`meetup-card meetup-card--${meetup.category}`} key={meetup.id}>
              <div className="meetup-card__glow" aria-hidden="true" />
              <header className="meetup-card__header">
                <div className="meetup-category">
                  <span aria-hidden="true">{meetup.spontaneous ? "⚡" : "∞"}</span>
                  <div>
                    <small>{meetup.spontaneous ? "Open today" : categoryLabels[meetup.category]}</small>
                    <strong>{meetup.audience}</strong>
                  </div>
                </div>
                {meetup.familyFriendly ? <span className="family-pill">Kids welcome</span> : null}
              </header>

              <div className="meetup-card__body">
                <h2>{meetup.title}</h2>
                <p>{meetup.description}</p>
                <dl className="meetup-details">
                  <div><dt>When</dt><dd>{meetup.dateLabel} · {meetup.timeLabel}</dd></div>
                  <div><dt>Where</dt><dd>{meetup.locationName} · {meetup.area}</dd></div>
                  <div><dt>Host</dt><dd>{meetup.host}</dd></div>
                </dl>
                {meetup.exactLocationAfterJoin ? (
                  <p className={`location-reveal${joined ? " location-reveal--open" : ""}`}>
                    <span aria-hidden="true">{joined ? "✓" : "⌁"}</span>
                    {joined
                      ? "Member-only meeting instructions would be available in the meetup thread."
                      : "Exact meeting instructions appear after you join."}
                  </p>
                ) : null}
                <div className="meetup-tags">
                  {meetup.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
              </div>

              <footer className="meetup-card__footer">
                <div className="attendee-stack" aria-label={`${displayedAttendees} members joining`}>
                  <span>{meetup.hostInitial}</span><span>A</span><span>K</span>
                  <strong>{displayedAttendees} joining</strong>
                  {remaining !== null ? <small>{remaining} spots open</small> : null}
                </div>
                <div className="meetup-actions">
                  <button
                    type="button"
                    className={`hub-button ${joined ? "hub-button--secondary" : "hub-button--primary"}`}
                    onClick={() => toggleJoin(meetup)}
                  >
                    {joined ? "Joined ✓" : "I’m in"}
                  </button>
                  <button
                    type="button"
                    className="meetup-chat-button"
                    onClick={() => setNotice(
                      joined
                        ? `The member-only thread for “${meetup.title}” would open here.`
                        : `Join “${meetup.title}” before opening its member-only thread.`
                    )}
                  >
                    Open meetup chat
                  </button>
                </div>
              </footer>
            </article>
          );
        })}
      </div>

      {!visibleMeetups.length ? (
        <section className="hub-panel empty-meetups">
          <span aria-hidden="true">∞</span>
          <h2>No invitations match this filter yet.</h2>
          <p>Be the person who creates the first simple invitation.</p>
          <button className="hub-button hub-button--primary" type="button" onClick={() => setShowForm(true)}>
            Host a meetup
          </button>
        </section>
      ) : null}
    </div>
  );
}
