"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { buildRespectfulResponseDraft } from "@church/outreach";
import { publicOpportunities, type PublicOpportunity } from "@/lib/demo-data";

type Disposition = "new" | "saved" | "drafted" | "dismissed";
type SourceFilter = "all" | PublicOpportunity["sourceKind"];

const sourceFilters: Array<[SourceFilter, string]> = [
  ["all", "All public sources"],
  ["public_forum", "Forums"],
  ["public_comment", "Public comments"],
  ["public_web", "Public web"],
  ["public_rss", "RSS / feeds"],
];

const scoreLabels = [
  ["localRelevance", "Local relevance"],
  ["churchIntent", "Church intent"],
  ["familyRelevance", "Family relevance"],
  ["onlineMinistryIntent", "Online intent"],
  ["freshness", "Freshness"],
  ["replyOpportunity", "Reply opportunity"],
  ["contentOpportunity", "Content opportunity"],
  ["searchOpportunity", "Search opportunity"],
  ["riskSensitivity", "Risk / sensitivity"],
] as const;

export function RadarWorkspace() {
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [minimumPriority, setMinimumPriority] = useState(0);
  const [selectedId, setSelectedId] = useState(publicOpportunities[0]?.id ?? "");
  const [dispositions, setDispositions] = useState<Record<string, Disposition>>({});
  const [responseDraft, setResponseDraft] = useState<ReturnType<typeof buildRespectfulResponseDraft> | null>(null);
  const [scanMessage, setScanMessage] = useState(
    "Synthetic signal set loaded. Approved source connectors are still disabled.",
  );

  const visibleOpportunities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return publicOpportunities.filter((opportunity) => {
      const sourceMatches = sourceFilter === "all" || opportunity.sourceKind === sourceFilter;
      const priorityMatches = opportunity.scores.priority >= minimumPriority;
      const textMatches =
        !normalizedQuery ||
        `${opportunity.title} ${opportunity.excerpt} ${opportunity.themes.join(" ")} ${opportunity.locality}`
          .toLowerCase()
          .includes(normalizedQuery);
      return sourceMatches && priorityMatches && textMatches;
    });
  }, [minimumPriority, query, sourceFilter]);

  const selected =
    visibleOpportunities.find((opportunity) => opportunity.id === selectedId) ??
    visibleOpportunities[0] ??
    null;

  function setDisposition(opportunityId: string, disposition: Disposition) {
    setDispositions((current) => ({ ...current, [opportunityId]: disposition }));
  }

  function draftResponse(opportunity: PublicOpportunity) {
    const draft = buildRespectfulResponseDraft({
      question: opportunity.title,
      approvedChurchName: "Boston Church Lowell",
      approvedServiceSummary:
        "Our public information currently describes Sunday worship at 10:00 AM at Butler Middle School in Lowell, with ministry information and a voluntary Plan a Visit path.",
      approvedNextStepUrl: "http://localhost:3000/plan-a-visit",
    });
    setResponseDraft(draft);
    setDisposition(opportunity.id, "drafted");
  }

  return (
    <>
      <section className="scan-strip" aria-live="polite">
        <div>
          <strong>Public-source scanner</strong>
          <span>{scanMessage}</span>
        </div>
        <button
          className="secondary-button"
          type="button"
          onClick={() =>
            setScanMessage(
              "Demo scan completed: 6 synthetic public opportunities analyzed. No external request was made.",
            )
          }
        >
          Run synthetic scan
        </button>
      </section>

      <div className="radar-layout">
        <section className="panel">
          <div className="panel__header">
            <div>
              <h2>Opportunity stream</h2>
              <p>{visibleOpportunities.length} public conversation signals match the current view.</p>
            </div>
          </div>
          <div className="radar-toolbar">
            <input
              aria-label="Search public opportunities"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Lowell, families, Zoom, teens…"
            />
            <select
              aria-label="Minimum priority"
              value={minimumPriority}
              onChange={(event) => setMinimumPriority(Number(event.target.value))}
            >
              <option value={0}>Any priority</option>
              <option value={70}>70+</option>
              <option value={80}>80+</option>
              <option value={90}>90+</option>
            </select>
          </div>
          <div className="radar-toolbar" aria-label="Public source filters">
            {sourceFilters.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`filter-chip${sourceFilter === value ? " active" : ""}`}
                onClick={() => setSourceFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="opportunity-list">
            {visibleOpportunities.map((opportunity) => {
              const disposition = dispositions[opportunity.id] ?? "new";
              return (
                <button
                  className={`opportunity-row${selected?.id === opportunity.id ? " active" : ""}`}
                  type="button"
                  key={opportunity.id}
                  onClick={() => {
                    setSelectedId(opportunity.id);
                    setResponseDraft(null);
                  }}
                >
                  <span
                    className="priority-dial"
                    style={{ "--priority": opportunity.scores.priority } as CSSProperties}
                    aria-label={`Priority ${opportunity.scores.priority}`}
                  >
                    {opportunity.scores.priority}
                  </span>
                  <span>
                    <h3>{opportunity.title}</h3>
                    <p>{opportunity.sourceLabel} · {opportunity.publishedLabel}</p>
                    <span className="opportunity-meta">
                      <span className="tag">{opportunity.locality}</span>
                      <span className={`status-pill status-pill--${disposition === "dismissed" ? "disabled" : disposition === "new" ? "demo" : "ready"}`}>
                        {disposition}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
            {!visibleOpportunities.length ? (
              <div className="empty-state">
                <span aria-hidden="true">⌕</span>
                <h3>No signals match this view.</h3>
                <p>Adjust the text, source, or priority filters. A real connector would remain subject to its approved allowlist.</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="panel opportunity-detail">
          {selected ? (
            <>
              <div className="opportunity-detail__hero">
                <div className="opportunity-meta">
                  <span className="status-pill status-pill--demo">PUBLIC · SYNTHETIC</span>
                  {selected.themes.map((theme) => <span className="tag" key={theme}>{theme}</span>)}
                </div>
                <h2>{selected.title}</h2>
                <p>{selected.sourceLabel} · {selected.locality} · {selected.publishedLabel}</p>
                <blockquote>“{selected.excerpt}”</blockquote>
                <div className="score-matrix">
                  {scoreLabels.map(([key, label]) => (
                    <div className={`score-cell${key === "riskSensitivity" ? " score-cell--risk" : ""}`} key={key}>
                      <strong>{selected.scores[key]}</strong>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="recommendation-box">
                <strong>Recommended posture</strong>
                <p>{selected.recommendation}</p>
              </div>

              <div className="action-list" aria-label="Recommended actions">
                {selected.suggestedActions.map((action, index) => (
                  <button key={action} type="button" onClick={() => setScanMessage(`Queued for human review: ${action}`)}>
                    <span>{index + 1}</span>
                    {action}
                  </button>
                ))}
              </div>

              {responseDraft ? (
                <div className="response-draft" aria-live="polite">
                  <strong>Transparent response draft · human review required</strong>
                  <p>{responseDraft.response}</p>
                  <p>{responseDraft.privateFollowUpPrompt}</p>
                </div>
              ) : null}

              <div className="detail-actions">
                <button className="primary-button" type="button" onClick={() => draftResponse(selected)}>
                  Draft respectful response
                </button>
                <button className="secondary-button" type="button" onClick={() => setDisposition(selected.id, "saved")}>
                  Save opportunity
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => setScanMessage("Synthetic source link withheld because this demo does not represent a real public post.")}
                >
                  Open public source
                </button>
                <button className="ghost-button" type="button" onClick={() => setDisposition(selected.id, "dismissed")}>
                  Dismiss
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <span aria-hidden="true">∞</span>
              <h2>Select a public opportunity.</h2>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
