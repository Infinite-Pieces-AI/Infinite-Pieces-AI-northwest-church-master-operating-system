"use client";

import { useMemo, useState } from "react";
import { createPeopleFirstContentBrief } from "@church/outreach";
import { aiVisibilityChecks, canonicalFacts, searchOpportunities } from "@/lib/demo-data";

type Segment = "all" | "local" | "online";

export function SearchIntelligence() {
  const [segment, setSegment] = useState<Segment>("all");
  const [selectedQuery, setSelectedQuery] = useState(searchOpportunities[0]?.query ?? "");
  const [brief, setBrief] = useState<ReturnType<typeof createPeopleFirstContentBrief> | null>(null);

  const rows = useMemo(
    () => searchOpportunities.filter((row) => segment === "all" || row.segment === segment),
    [segment],
  );
  const selected = rows.find((row) => row.query === selectedQuery) ?? rows[0] ?? null;

  function generateBrief() {
    if (!selected) return;
    const facts = Object.fromEntries(canonicalFacts.map((fact) => [fact.label, fact.value]));
    setBrief(
      createPeopleFirstContentBrief({
        title: selected.page
          ? `Improve: ${selected.query}`
          : `${selected.query.replace(/\b\w/g, (letter) => letter.toUpperCase())}`,
        searchIntent: selected.intent,
        locality:
          selected.segment === "online"
            ? "Massachusetts and approved online audience"
            : "Lowell, Massachusetts",
        approvedFacts: facts,
        recommendedSections: [
          "Direct answer to the visitor’s question",
          "Accurate current church or online-ministry information",
          "What someone should expect before responding",
          "Frequently asked questions",
          "Voluntary next step with clear consent",
        ],
      }),
    );
  }

  return (
    <>
      <section className="panel">
        <div className="panel__header">
          <div>
            <h2>Aggregate query opportunities</h2>
            <p>
              Synthetic Search Console-style data; no individual searcher identity exists in this
              view.
            </p>
          </div>
          <button className="secondary-button" type="button" onClick={generateBrief}>
            Generate selected brief
          </button>
        </div>
        <div className="search-toolbar">
          {(["all", "local", "online"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={`filter-chip${segment === value ? " active" : ""}`}
              onClick={() => {
                setSegment(value);
                setBrief(null);
              }}
            >
              {value === "all"
                ? "All intent"
                : value === "local"
                  ? "Local discovery"
                  : "Online / Zoom"}
            </button>
          ))}
        </div>
        <div className="search-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Query</th>
                <th>Intent</th>
                <th>Impressions</th>
                <th>Clicks / CTR</th>
                <th>Position</th>
                <th>Trend</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.query}>
                  <td>
                    <button
                      className="search-row-button"
                      type="button"
                      onClick={() => {
                        setSelectedQuery(row.query);
                        setBrief(null);
                      }}
                    >
                      {row.query}
                    </button>
                    <small>{row.page ?? "No dedicated page"}</small>
                  </td>
                  <td>{row.intent}</td>
                  <td>{row.impressions.toLocaleString()}</td>
                  <td>
                    {row.clicks} / {row.ctr}%
                  </td>
                  <td>{row.position || "Not visible"}</td>
                  <td>+{row.trend}%</td>
                  <td>
                    <strong>{row.score}</strong>
                    <div className="rank-bar">
                      <span style={{ width: `${row.score}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="search-detail-grid">
        <section className="panel">
          <div className="panel__header">
            <div>
              <h2>Selected opportunity</h2>
              <p>Why this topic deserves a useful public answer.</p>
            </div>
          </div>
          <div className="panel__body">
            {selected ? (
              <div className="brief-preview">
                <article>
                  <strong>{selected.query}</strong>
                  <span>
                    {selected.intent} · score {selected.score}
                  </span>
                </article>
                <article>
                  <strong>Current coverage</strong>
                  <span>{selected.page ?? "No dedicated people-first page exists."}</span>
                </article>
                <article>
                  <strong>Recommended action</strong>
                  <span>{selected.action}</span>
                </article>
                <article>
                  <strong>Success measure</strong>
                  <span>
                    Helpful impressions, qualified clicks, voluntary form starts, and completed next
                    steps—not raw page volume.
                  </span>
                </article>
                <button className="primary-button" type="button" onClick={generateBrief}>
                  Create reviewable content brief
                </button>
              </div>
            ) : (
              <p>No query selected.</p>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <h2>People-first brief</h2>
              <p>AI can structure a draft; leaders verify every fact and approve publication.</p>
            </div>
          </div>
          <div className="panel__body">
            {brief ? (
              <div className="generated-document">
                <span className="status-pill status-pill--review">DRAFT · HUMAN REVIEW</span>
                <h3>{brief.title}</h3>
                <p>
                  <strong>Intent:</strong> {brief.searchIntent}
                </p>
                <p>
                  <strong>Locality:</strong> {brief.locality}
                </p>
                <h4>Recommended sections</h4>
                <ol>
                  {brief.recommendedSections.map((section) => (
                    <li key={section}>{section}</li>
                  ))}
                </ol>
                <p className="notice notice--gold">
                  This draft cannot publish automatically. Approved facts must be rechecked on the
                  day of publication.
                </p>
              </div>
            ) : (
              <div className="empty-state">
                <span aria-hidden="true">✦</span>
                <h3>Create a brief from the selected opportunity.</h3>
                <p>
                  The demo generates structure only and never fabricates live traffic or church
                  facts.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel__header">
          <div>
            <h2>AI answer-engine visibility</h2>
            <p>
              Synthetic prompt checks for coverage and factual consistency; no attempt is made to
              manipulate or impersonate an answer engine.
            </p>
          </div>
        </div>
        <div className="panel__body visibility-grid">
          {aiVisibilityChecks.map((check) => (
            <article className="visibility-card" key={check.prompt}>
              <h3>“{check.prompt}”</h3>
              <div className="coverage-bar">
                <span style={{ width: `${check.coverage}%` }} />
              </div>
              <small>{check.coverage}% illustrative coverage</small>
              <p>
                {check.churchMentioned ? "Church mentioned" : "Church not surfaced"} ·{" "}
                {check.factsAccurate === true ? "facts accurate" : "accuracy not applicable"}
              </p>
              <p>{check.gap}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
