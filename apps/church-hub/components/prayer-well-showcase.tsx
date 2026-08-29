"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useShowcaseStore } from "./use-showcase-store";

type PrayerStatus = "open" | "answered" | "archived";
type PrayerPrivacy = "church" | "leaders_only" | "requester_and_leaders";
type DisplayMode = "named" | "first_name" | "anonymous_to_members";

interface PrayerEncouragement {
  id: string;
  label: string;
  message: string;
  createdAt: string;
  requesterOnly: boolean;
}

interface PrayerRequest {
  id: string;
  title: string;
  request: string;
  displayLabel: string;
  displayMode: DisplayMode;
  privacy: PrayerPrivacy;
  status: PrayerStatus;
  prayedCount: number;
  prayedByMe: boolean;
  allowEncouragement: boolean;
  mine: boolean;
  createdAt: string;
  answerTestimony?: string;
  encouragements: PrayerEncouragement[];
}

interface PrayerState {
  requests: PrayerRequest[];
}

const initialState: PrayerState = {
  requests: [
    {
      id: "prayer-interview",
      title: "Peace and wisdom for an important interview",
      request:
        "Please pray for calm, clear thinking, and trust in God while I prepare for an important job conversation this week.",
      displayLabel: "Church member",
      displayMode: "anonymous_to_members",
      privacy: "church",
      status: "open",
      prayedCount: 14,
      prayedByMe: false,
      allowEncouragement: true,
      mine: false,
      createdAt: "Today",
      encouragements: [
        {
          id: "enc-1",
          label: "Member encouragement",
          message: "Praying that you feel supported and at peace as you prepare.",
          createdAt: "2 hours ago",
          requesterOnly: false,
        },
      ],
    },
    {
      id: "prayer-health",
      title: "Prayer around a family medical appointment",
      request:
        "Please pray for wisdom for the care team and strength for our family. We are keeping the medical details private.",
      displayLabel: "A family in our church",
      displayMode: "anonymous_to_members",
      privacy: "church",
      status: "open",
      prayedCount: 27,
      prayedByMe: true,
      allowEncouragement: true,
      mine: false,
      createdAt: "Yesterday",
      encouragements: [],
    },
    {
      id: "prayer-housing",
      title: "Thanksgiving for a housing answer",
      request: "We had asked for prayer around stable housing and are grateful that a safe option opened.",
      displayLabel: "My request",
      displayMode: "first_name",
      privacy: "church",
      status: "answered",
      prayedCount: 31,
      prayedByMe: true,
      allowEncouragement: true,
      mine: true,
      createdAt: "Last week",
      answerTestimony:
        "A lease was approved and several members helped us move. Thank you for praying and showing up.",
      encouragements: [
        {
          id: "enc-2",
          label: "Member encouragement",
          message: "Celebrating this answer with you!",
          createdAt: "3 days ago",
          requesterOnly: false,
        },
      ],
    },
    {
      id: "prayer-leaders",
      title: "Private pastoral follow-up",
      request:
        "This request is visible only to the person who submitted it and approved pastoral leaders.",
      displayLabel: "Private request",
      displayMode: "named",
      privacy: "requester_and_leaders",
      status: "open",
      prayedCount: 2,
      prayedByMe: false,
      allowEncouragement: false,
      mine: true,
      createdAt: "Today",
      encouragements: [],
    },
  ],
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function PrayerWellShowcase() {
  const [state, setState, reset, hydrated] = useShowcaseStore(
    "church-hub-prayer-well-showcase-v1",
    initialState,
  );
  const [filter, setFilter] = useState<"open" | "answered" | "mine" | "all">("open");
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(state.requests[0]?.id ?? null);
  const [encouraging, setEncouraging] = useState<string | null>(null);
  const [answering, setAnswering] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      state.requests.filter((request) => {
        if (filter === "all") return true;
        if (filter === "mine") return request.mine;
        return request.status === filter;
      }),
    [filter, state.requests],
  );

  function createRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const requestText = String(form.get("request") ?? "").trim();
    if (!title || !requestText) return;
    const displayMode = String(form.get("displayMode") ?? "first_name") as DisplayMode;
    const privacy = String(form.get("privacy") ?? "church") as PrayerPrivacy;
    const label =
      displayMode === "anonymous_to_members"
        ? "Church member"
        : displayMode === "first_name"
          ? "My first name"
          : "My name";
    const request: PrayerRequest = {
      id: makeId("prayer"),
      title,
      request: requestText,
      displayLabel: label,
      displayMode,
      privacy,
      status: "open",
      prayedCount: 0,
      prayedByMe: false,
      allowEncouragement: form.get("allowEncouragement") === "on",
      mine: true,
      createdAt: "Just now",
      encouragements: [],
    };
    setState((current) => ({ requests: [request, ...current.requests] }));
    setCreating(false);
    setExpanded(request.id);
    event.currentTarget.reset();
  }

  function togglePrayed(id: string) {
    setState((current) => ({
      requests: current.requests.map((request) =>
        request.id === id
          ? {
              ...request,
              prayedByMe: !request.prayedByMe,
              prayedCount: Math.max(0, request.prayedCount + (request.prayedByMe ? -1 : 1)),
            }
          : request,
      ),
    }));
  }

  function addEncouragement(event: FormEvent<HTMLFormElement>, requestId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const message = String(form.get("message") ?? "").trim();
    if (!message) return;
    setState((current) => ({
      requests: current.requests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              encouragements: [
                ...request.encouragements,
                {
                  id: makeId("encouragement"),
                  label: "My encouragement",
                  message,
                  createdAt: "Just now",
                  requesterOnly: form.get("requesterOnly") === "on",
                },
              ],
            }
          : request,
      ),
    }));
    setEncouraging(null);
  }

  function markAnswered(event: FormEvent<HTMLFormElement>, requestId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const testimony = String(form.get("testimony") ?? "").trim();
    setState((current) => ({
      requests: current.requests.map((request) =>
        request.id === requestId
          ? { ...request, status: "answered", answerTestimony: testimony || "Marked answered." }
          : request,
      ),
    }));
    setAnswering(null);
  }

  function archive(id: string) {
    setState((current) => ({
      requests: current.requests.map((request) =>
        request.id === id ? { ...request, status: "archived" } : request,
      ),
    }));
  }

  const openCount = state.requests.filter((item) => item.status === "open").length;
  const totalPrayer = state.requests.reduce((sum, item) => sum + item.prayedCount, 0);

  return (
    <div className="ministry-showcase prayer-showcase" aria-busy={!hydrated}>
      <section className="space-hero space-hero--prayer">
        <div>
          <p className="space-eyebrow">Carry one another in prayer</p>
          <h2>The Prayer Well</h2>
          <p>
            Share a request at the privacy level you choose, pray through the church’s current list,
            leave encouragement, and celebrate when a prayer is answered.
          </p>
          <div className="space-hero__actions">
            <button className="hub-button hub-button--light" type="button" onClick={() => setCreating(true)}>
              + Share a prayer request
            </button>
            <button className="hub-button hub-button--ghost-light" type="button" onClick={() => setFilter("open")}>
              Pray through the open list
            </button>
          </div>
        </div>
        <div className="prayer-well-visual" aria-hidden="true">
          <span>◉</span>
          <strong>{openCount}</strong>
          <small>open requests</small>
        </div>
      </section>

      <section className="prayer-safety-note">
        <strong>This space is for prayer and encouragement—not emergency response.</strong>
        <span>
          Call 911 for immediate danger. In the United States, call or text 988 for urgent crisis
          support. Prayer posts are not monitored continuously and do not replace medical,
          safeguarding, or mandated-reporting procedures.
        </span>
      </section>

      <nav className="space-tabs" aria-label="Prayer Well filters">
        {(["open", "answered", "mine", "all"] as const).map((value) => (
          <button key={value} className={filter === value ? "active" : ""} type="button" onClick={() => setFilter(value)}>
            {value === "mine" ? "My requests" : value[0].toUpperCase() + value.slice(1)}
          </button>
        ))}
        <button className="space-tabs__reset" type="button" onClick={reset}>Reset preview</button>
      </nav>

      <section className="prayer-summary-grid">
        <article><strong>{openCount}</strong><span>Requests currently open</span></article>
        <article><strong>{totalPrayer}</strong><span>Prayer acknowledgements</span></article>
        <article><strong>{state.requests.filter((item) => item.status === "answered").length}</strong><span>Answers celebrated</span></article>
        <article><strong>3</strong><span>Privacy choices</span></article>
      </section>

      {creating ? (
        <section className="space-form-card">
          <div className="panel-heading">
            <div><p className="hub-kicker">Share only what you choose</p><h2>New prayer request</h2></div>
            <button className="space-icon-button" type="button" onClick={() => setCreating(false)} aria-label="Close form">×</button>
          </div>
          <form className="space-form" onSubmit={createRequest}>
            <label className="space-form__wide">Short title<input name="title" required maxLength={180} /></label>
            <label className="space-form__wide">
              Prayer request
              <textarea name="request" rows={5} required maxLength={4000} placeholder="Share enough for people to pray without including details you want to keep private." />
            </label>
            <label>
              How should your name appear?
              <select name="displayMode" defaultValue="first_name">
                <option value="first_name">First name only</option>
                <option value="named">Full member name</option>
                <option value="anonymous_to_members">Anonymous to members</option>
              </select>
            </label>
            <label>
              Who may see it?
              <select name="privacy" defaultValue="church">
                <option value="church">Church members</option>
                <option value="leaders_only">Approved prayer leaders</option>
                <option value="requester_and_leaders">Only me and approved leaders</option>
              </select>
            </label>
            <label className="space-check space-form__wide">
              <input name="allowEncouragement" type="checkbox" defaultChecked />
              Allow visible encouragement from church members
            </label>
            <div className="space-form__wide space-form__actions">
              <button className="hub-button hub-button--primary" type="submit">Post prayer request</button>
              <small>
                Prayer content is excluded from advertising, public search, marketing profiles, and
                AI processing by default.
              </small>
            </div>
          </form>
        </section>
      ) : null}

      <section className="prayer-list">
        {visible.map((request) => {
          const isExpanded = expanded === request.id;
          return (
            <article className={`prayer-card prayer-card--${request.status}`} key={request.id}>
              <button className="prayer-card__header" type="button" onClick={() => setExpanded(isExpanded ? null : request.id)} aria-expanded={isExpanded}>
                <span className="prayer-card__icon" aria-hidden="true">{request.status === "answered" ? "✓" : "◉"}</span>
                <span>
                  <small>{request.displayLabel} · {request.createdAt}</small>
                  <strong>{request.title}</strong>
                  <em>{request.privacy.replaceAll("_", " ")}</em>
                </span>
                <b>{isExpanded ? "−" : "+"}</b>
              </button>

              {isExpanded ? (
                <div className="prayer-card__body">
                  <p>{request.request}</p>
                  {request.status === "answered" && request.answerTestimony ? (
                    <div className="answered-testimony"><strong>Answer update</strong><span>{request.answerTestimony}</span></div>
                  ) : null}

                  <div className="prayer-actions">
                    <button className={`prayed-button${request.prayedByMe ? " active" : ""}`} type="button" onClick={() => togglePrayed(request.id)}>
                      {request.prayedByMe ? "✓ I prayed" : "I prayed"} · {request.prayedCount}
                    </button>
                    {request.allowEncouragement ? (
                      <button className="hub-button hub-button--secondary" type="button" onClick={() => setEncouraging(request.id)}>
                        Leave encouragement
                      </button>
                    ) : null}
                    {request.mine && request.status === "open" ? (
                      <button className="hub-button hub-button--secondary" type="button" onClick={() => setAnswering(request.id)}>
                        Mark answered
                      </button>
                    ) : null}
                    {request.mine && request.status !== "archived" ? (
                      <button className="space-text-button" type="button" onClick={() => archive(request.id)}>Archive</button>
                    ) : null}
                  </div>

                  {request.encouragements.length ? (
                    <div className="space-thread">
                      {request.encouragements.filter((item) => !item.requesterOnly || request.mine).map((item) => (
                        <div key={item.id}>
                          <strong>{item.label}</strong>
                          <span>{item.message}</span>
                          <small>{item.createdAt}{item.requesterOnly ? " · Private to requester" : ""}</small>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {encouraging === request.id ? (
                    <form className="inline-reply" onSubmit={(event) => addEncouragement(event, request.id)}>
                      <textarea name="message" rows={3} required maxLength={2000} placeholder="Offer kind, non-directive encouragement…" />
                      <label className="space-check"><input name="requesterOnly" type="checkbox" /> Show only to the requester</label>
                      <div><button className="hub-button hub-button--primary" type="submit">Post encouragement</button><button className="hub-button hub-button--secondary" type="button" onClick={() => setEncouraging(null)}>Cancel</button></div>
                    </form>
                  ) : null}

                  {answering === request.id ? (
                    <form className="inline-reply" onSubmit={(event) => markAnswered(event, request.id)}>
                      <label>
                        Optional answer update
                        <textarea name="testimony" rows={4} maxLength={4000} placeholder="Share only what you want the same audience to see." />
                      </label>
                      <div><button className="hub-button hub-button--primary" type="submit">Celebrate this answer</button><button className="hub-button hub-button--secondary" type="button" onClick={() => setAnswering(null)}>Cancel</button></div>
                    </form>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </div>
  );
}
