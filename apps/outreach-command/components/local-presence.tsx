"use client";

import { useState } from "react";
import { aiVisibilityChecks, canonicalFacts, localPresenceChecks } from "@/lib/demo-data";

type CheckState = (typeof localPresenceChecks)[number] & { localStatus?: string };

export function LocalPresence() {
  const [checks, setChecks] = useState<CheckState[]>([...localPresenceChecks]);

  function advance(index: number) {
    setChecks((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const status = item.localStatus ?? item.status;
        return {
          ...item,
          localStatus: status === "blocked" || status === "planned" ? "review" : "ready",
        };
      }),
    );
  }

  return (
    <>
      <section className="command-hero">
        <div>
          <p className="eyebrow">Canonical facts before campaigns</p>
          <h2>
            Search engines and AI systems cannot recommend information they cannot confidently
            understand.
          </h2>
          <p>
            One church-controlled record should drive the public website, structured data, event
            pages, social drafts, directions, and campaign landing pages.
          </p>
        </div>
        <div className="hero-rail">
          <article>
            <span>10</span>
            <div>
              <strong>Sunday worship</strong>
              <small>10:00 AM · demo canonical record</small>
            </div>
          </article>
          <article>
            <span>◎</span>
            <div>
              <strong>Butler Middle School</strong>
              <small>1140 Gorham Street, Lowell</small>
            </div>
          </article>
          <article>
            <span>2×</span>
            <div>
              <strong>Recovery owners</strong>
              <small>Required for every production account</small>
            </div>
          </article>
        </div>
      </section>

      <div className="section-grid">
        <section className="panel">
          <div className="panel__header">
            <div>
              <h2>Canonical public facts</h2>
              <p>Synthetic or proposed values must still be approved by central leadership.</p>
            </div>
          </div>
          <div className="panel__body fact-grid">
            {canonicalFacts.map((fact) => (
              <article className="fact-card" key={fact.label}>
                <strong>{fact.label}</strong>
                <span>{fact.value}</span>
                <span
                  className={`status-pill status-pill--${fact.status.includes("Needs") || fact.status === "Proposed" ? "review" : "ready"}`}
                >
                  {fact.status}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <h2>Local-profile readiness</h2>
              <p>Progress can be recorded only with verifiable evidence.</p>
            </div>
          </div>
          <div className="panel__body check-grid">
            {checks.map((check, index) => {
              const status = check.localStatus ?? check.status;
              return (
                <article className="check-card" key={check.label}>
                  <span
                    className={`status-pill status-pill--${status === "ready" ? "ready" : status === "blocked" ? "blocked" : "review"}`}
                  >
                    {status}
                  </span>
                  <strong>{check.label}</strong>
                  <span>Owner: {check.owner}</span>
                  <button className="ghost-button" type="button" onClick={() => advance(index)}>
                    Advance synthetic check
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel__header">
          <div>
            <h2>AI visibility evidence</h2>
            <p>
              Public prompt checks reveal missing facts and weak content; they do not guarantee
              recommendations.
            </p>
          </div>
        </div>
        <div className="panel__body visibility-grid">
          {aiVisibilityChecks.map((check) => (
            <article className="visibility-card" key={check.prompt}>
              <h3>{check.prompt}</h3>
              <div className="coverage-bar">
                <span style={{ width: `${check.coverage}%` }} />
              </div>
              <small>{check.coverage}% synthetic coverage</small>
              <p>{check.gap}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="notice notice--green" style={{ marginTop: 18 }}>
        A rented school venue must be represented accurately. The OS should never imply permanent
        ownership, staffed hours, or access beyond the church’s actual approved use.
      </section>
    </>
  );
}
