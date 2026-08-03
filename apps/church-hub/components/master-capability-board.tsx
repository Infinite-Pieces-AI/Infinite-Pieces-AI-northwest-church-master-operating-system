import type { ReactNode } from "react";

export type CapabilityStatus = "ready" | "configured" | "review" | "blocked" | "planned";

export interface CapabilityCard {
  title: string;
  description: string;
  status: CapabilityStatus;
  owner: string;
  boundary?: string;
  evidence?: string;
  action?: ReactNode;
}

const statusLabels: Record<CapabilityStatus, string> = {
  ready: "Ready",
  configured: "Configured",
  review: "Needs review",
  blocked: "Blocked by gate",
  planned: "Planned"
};

export function MasterCapabilityBoard({
  heading,
  introduction,
  cards
}: {
  heading: string;
  introduction: string;
  cards: readonly CapabilityCard[];
}) {
  return (
    <section className="hub-panel capability-board">
      <div className="panel-heading">
        <div>
          <p className="hub-kicker">Master operating system</p>
          <h2>{heading}</h2>
        </div>
        <span className="pill">{cards.length} governed capabilities</span>
      </div>
      <p className="capability-board__intro">{introduction}</p>
      <div className="capability-grid">
        {cards.map((card) => (
          <article className="capability-card" key={card.title}>
            <div className="capability-card__topline">
              <span className={`capability-status capability-status--${card.status}`}>
                {statusLabels[card.status]}
              </span>
              <small>{card.owner}</small>
            </div>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            {card.boundary ? (
              <div className="capability-boundary">
                <strong>Safety boundary</strong>
                <span>{card.boundary}</span>
              </div>
            ) : null}
            {card.evidence ? <small className="capability-evidence">Evidence: {card.evidence}</small> : null}
            {card.action ? <div className="row-actions">{card.action}</div> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export function ApprovalRail({
  steps
}: {
  steps: readonly { label: string; detail: string; state: "complete" | "current" | "future" }[];
}) {
  return (
    <ol className="approval-rail" aria-label="Approval workflow">
      {steps.map((step, index) => (
        <li className={`approval-rail__item approval-rail__item--${step.state}`} key={step.label}>
          <span>{index + 1}</span>
          <div>
            <strong>{step.label}</strong>
            <small>{step.detail}</small>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ReadinessChecklist({
  title,
  items
}: {
  title: string;
  items: readonly { label: string; complete: boolean; evidence?: string }[];
}) {
  const completed = items.filter((item) => item.complete).length;
  const percent = items.length ? Math.round((completed / items.length) * 100) : 0;
  return (
    <section className="hub-panel readiness-card">
      <div className="panel-heading">
        <div>
          <p className="hub-kicker">Readiness</p>
          <h2>{title}</h2>
        </div>
        <strong>{percent}%</strong>
      </div>
      <div className="release-meter" aria-label={`${percent} percent complete`}>
        <span style={{ width: `${percent}%` }} />
      </div>
      <ul className="readiness-list">
        {items.map((item) => (
          <li key={item.label}>
            <span aria-hidden="true">{item.complete ? "✓" : "○"}</span>
            <div>
              <strong>{item.label}</strong>
              {item.evidence ? <small>{item.evidence}</small> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
