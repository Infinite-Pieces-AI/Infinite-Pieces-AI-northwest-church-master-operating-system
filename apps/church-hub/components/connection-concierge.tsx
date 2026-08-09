"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const suggestions = {
  company: {
    label: "I would like company",
    title: "Choose a low-pressure open invitation.",
    body: "Start with a meal, walk, coffee, or public gathering where coming late or leaving early is okay.",
    href: "/fellowship",
    action: "See open invitations",
    reason: "You explicitly selected company and low-pressure connection.",
  },
  parents: {
    label: "I want to meet other parents",
    title: "Look for a guardian-led family invitation.",
    body: "Family playdates and public park meetups help adults build friendships while guardians remain responsible for their children.",
    href: "/fellowship",
    action: "See family meetups",
    reason: "You explicitly selected parent connection; child records were not used.",
  },
  bible: {
    label: "I want a Bible conversation",
    title: "Move this week’s story into a shared conversation.",
    body: "Open the current Bible Journey, choose a question, and join or host a discussion with approved members.",
    href: "/bible",
    action: "Open Bible Journey",
    reason: "You explicitly selected a Bible conversation.",
  },
  serve: {
    label: "I want to serve",
    title: "Build connection while meeting a real need.",
    body: "Find an approved service opportunity with a named partner, clear shift, accessibility notes, and practical expectations.",
    href: "/service",
    action: "Open Service Marketplace",
    reason: "You explicitly selected service; no hidden engagement score was used.",
  },
  new: {
    label: "I am new here",
    title: "Take one voluntary step each week.",
    body: "The Connection Path offers a first Sunday, one low-pressure meetup, a Bible conversation, and a service opportunity. Skip or pause anything.",
    href: "/connection-path",
    action: "Open my Connection Path",
    reason: "You explicitly selected the new-member pathway.",
  },
  active: {
    label: "I want an active meetup",
    title: "Find movement, outdoors, or sports.",
    body: "Browse public-place invitations for walking, basketball, hiking, and other activities that match the host’s accessibility details.",
    href: "/fellowship",
    action: "See active meetups",
    reason: "You explicitly selected an active gathering.",
  },
  small: {
    label: "I prefer a small group",
    title: "Start with a smaller table or conversation.",
    body: "Choose invitations with a clear capacity so the setting is easier to understand before you join.",
    href: "/fellowship",
    action: "Browse smaller gatherings",
    reason: "You explicitly selected a small-group preference.",
  },
  today: {
    label: "I am open to something today",
    title: "See what is happening soon.",
    body: "Last-minute recommendations use only the availability and general area you choose, never private messages, prayer, counseling, or child data.",
    href: "/fellowship",
    action: "See today’s invitations",
    reason: "You explicitly selected today and opted into last-minute suggestions.",
  },
} as const;

type SuggestionKey = keyof typeof suggestions;

export function ConnectionConcierge({ compact = false }: { compact?: boolean }) {
  const [selected, setSelected] = useState<SuggestionKey>("company");
  const [paused, setPaused] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [notice, setNotice] = useState(
    "Recommendations are based on choices you make in this panel.",
  );
  const current = suggestions[selected];
  const selectedLabels = useMemo(() => [suggestions[selected].label], [selected]);

  return (
    <section className={`connection-concierge${compact ? " connection-concierge--compact" : ""}`}>
      <div className="connection-concierge__intro">
        <span className="connection-spark" aria-hidden="true">
          ✦
        </span>
        <div>
          <p className="hub-kicker">Connection Guide · explicit choices only</p>
          <h2>What would help you feel connected right now?</h2>
          <p>
            Choose a need instead of waiting for the system to guess. Recommendations never read
            prayer, child, counseling, safeguarding, attendance, or private-message content.
          </p>
        </div>
      </div>

      {paused ? (
        <div className="concierge-paused" aria-live="polite">
          <div>
            <strong>Recommendations are paused.</strong>
            <span>Your preferences remain under your control.</span>
          </div>
          <button
            type="button"
            className="hub-button hub-button--light"
            onClick={() => {
              setPaused(false);
              setNotice("Recommendations resumed.");
            }}
          >
            Resume
          </button>
        </div>
      ) : (
        <>
          <div className="concierge-chips" aria-label="Connection guide options">
            {(
              Object.entries(suggestions) as Array<
                [SuggestionKey, (typeof suggestions)[SuggestionKey]]
              >
            ).map(([key, suggestion]) => (
              <button
                key={key}
                type="button"
                className={selected === key ? "active" : ""}
                onClick={() => {
                  setSelected(key);
                  setNotice(`Selected: ${suggestion.label}`);
                }}
              >
                {suggestion.label}
              </button>
            ))}
          </div>
          <div className="concierge-answer" aria-live="polite">
            <div>
              <small>Suggested next step</small>
              <strong>{current.title}</strong>
              <p>{current.body}</p>
              <span className="recommendation-reason">Suggested because: {current.reason}</span>
            </div>
            <Link className="hub-button hub-button--light" href={current.href}>
              {current.action}
            </Link>
          </div>
        </>
      )}

      <div className="concierge-controls">
        <button type="button" onClick={() => setShowPreferences((value) => !value)}>
          Change my preferences
        </button>
        <button
          type="button"
          onClick={() =>
            setNotice(`We will show fewer suggestions like “${current.label}” in this demo.`)
          }
        >
          Show me fewer like this
        </button>
        <button
          type="button"
          onClick={() => {
            setPaused(true);
            setNotice("Recommendations paused.");
          }}
        >
          Pause recommendations
        </button>
      </div>
      {showPreferences ? (
        <div className="preference-summary">
          <strong>Current explicit preference</strong>
          <span>{selectedLabels.join(", ")}</span>
          <p>
            Production saves only the preferences and availability you submit. You can delete or
            pause them from your profile.
          </p>
        </div>
      ) : null}
      <p className="connection-boundary" role="status">
        {notice} This guide is not emergency, clinical, legal, pastoral-decision, or
        mandatory-reporting support.
      </p>
    </section>
  );
}
