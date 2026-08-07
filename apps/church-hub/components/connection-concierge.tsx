"use client";

import Link from "next/link";
import { useState } from "react";

const suggestions = {
  company: {
    label: "I could use company",
    title: "You do not have to figure out the next step alone.",
    body:
      "There are open, low-pressure gatherings this week: a family prayer walk, coffee and Scripture, and Sunday lunch tables. You choose what feels manageable; nothing is shared until you join.",
    href: "/fellowship",
    action: "See open invitations"
  },
  today: {
    label: "What is happening today?",
    title: "Two member-led invitations are open today.",
    body:
      "The family prayer walk is designed for last-minute joins, and the Connection Guide can also help you create a simple coffee, walk, or playground invitation in under a minute.",
    href: "/fellowship",
    action: "Open today’s meetups"
  },
  host: {
    label: "Help me invite people",
    title: "Start small and make the invitation clear.",
    body:
      "A strong invitation includes a public place, a simple activity, a start and end time, who it fits, and permission to come late or leave early. The Fellowship form drafts this structure for you.",
    href: "/fellowship#host-meetup-form",
    action: "Draft a meetup"
  },
  serve: {
    label: "Where can I serve?",
    title: "Connection can grow while serving side by side.",
    body:
      "The supply-packing gathering is open to multiple ages and abilities. Future recommendations can match interests and availability without exposing private prayer, child, or pastoral information.",
    href: "/fellowship",
    action: "Find service gatherings"
  },
  scripture: {
    label: "Help me reconnect with God",
    title: "Begin with one small movement through this week’s story.",
    body:
      "Open Genesis 1-2, notice what the passage says about God and human purpose, pray one honest sentence, and choose one relationship where you can practice dignity and care today.",
    href: "/bible",
    action: "Open the Bible journey"
  }
} as const;

type SuggestionKey = keyof typeof suggestions;

export function ConnectionConcierge({ compact = false }: { compact?: boolean }) {
  const [selected, setSelected] = useState<SuggestionKey>("company");
  const current = suggestions[selected];

  return (
    <section className={`connection-concierge${compact ? " connection-concierge--compact" : ""}`}>
      <div className="connection-concierge__intro">
        <span className="connection-spark" aria-hidden="true">✦</span>
        <div>
          <p className="hub-kicker">Connection Guide · demo intelligence</p>
          <h2>What would help you feel connected right now?</h2>
          <p>
            Choose a need, not a perfect plan. The real assistant will recommend approved church
            resources and member-created invitations without reading private prayer, child,
            counseling, or safeguarding information.
          </p>
        </div>
      </div>
      <div className="concierge-chips" aria-label="Connection guide options">
        {(Object.entries(suggestions) as Array<[SuggestionKey, (typeof suggestions)[SuggestionKey]]>).map(
          ([key, suggestion]) => (
            <button
              key={key}
              type="button"
              className={selected === key ? "active" : ""}
              onClick={() => setSelected(key)}
            >
              {suggestion.label}
            </button>
          )
        )}
      </div>
      <div className="concierge-answer" aria-live="polite">
        <div>
          <small>Suggested next step</small>
          <strong>{current.title}</strong>
          <p>{current.body}</p>
        </div>
        <Link className="hub-button hub-button--light" href={current.href}>
          {current.action}
        </Link>
      </div>
      {!compact ? (
        <p className="connection-boundary">
          This guide supports connection; it is not emergency, clinical, legal, or mandatory-reporting
          support. Urgent safety concerns must follow the church’s approved escalation process.
        </p>
      ) : null}
    </section>
  );
}
