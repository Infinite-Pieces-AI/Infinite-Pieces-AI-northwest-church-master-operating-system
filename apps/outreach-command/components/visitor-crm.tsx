"use client";

import { useMemo, useState } from "react";
import { visitorRecords } from "@/lib/demo-data";

type StageFilter = "all" | "new" | "scheduled" | "study" | "online";

export function VisitorCrm() {
  const [filter, setFilter] = useState<StageFilter>("all");
  const [selectedId, setSelectedId] = useState<string>(visitorRecords[0]?.id ?? "");
  const [assigned, setAssigned] = useState<Record<string, string>>({});

  const records = useMemo(
    () =>
      visitorRecords.filter((record) => {
        if (filter === "all") return true;
        const text = `${record.stage} ${record.pathway}`.toLowerCase();
        if (filter === "new") return text.includes("new");
        if (filter === "scheduled") return text.includes("scheduled");
        if (filter === "study") return text.includes("bible study");
        return text.includes("online") || text.includes("zoom");
      }),
    [filter],
  );
  const selected = records.find((record) => record.id === selectedId) ?? records[0] ?? null;

  return (
    <>
      <section className="notice notice--green" style={{ marginBottom: 18 }}>
        A CRM record begins only after a person voluntarily submits a form and selects a contact
        method. The demo names below are synthetic.
      </section>
      <div className="crm-layout">
        <section className="panel">
          <div className="panel__header">
            <div>
              <h2>Welcome queue</h2>
              <p>{records.length} synthetic records in this view.</p>
            </div>
          </div>
          <div className="search-toolbar">
            {(["all", "new", "scheduled", "study", "online"] as const).map((value) => (
              <button
                key={value}
                className={`filter-chip${filter === value ? " active" : ""}`}
                type="button"
                onClick={() => setFilter(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <div>
            {records.map((record) => (
              <button
                className={`crm-record${selected?.id === record.id ? " active" : ""}`}
                type="button"
                key={record.id}
                onClick={() => setSelectedId(record.id)}
              >
                <span>{record.displayName.slice(-1)}</span>
                <span>
                  <strong>{record.displayName}</strong>
                  <small>
                    {record.pathway} · {record.source}
                  </small>
                </span>
                <span className="status-pill status-pill--review">{record.stage}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          {selected ? (
            <div className="crm-detail">
              <span className="status-pill status-pill--demo">SYNTHETIC · CONSENTED</span>
              <h2>{selected.displayName}</h2>
              <p>
                {selected.pathway} from {selected.source}
              </p>
              <div className="fact-grid">
                <article className="fact-card">
                  <strong>Stage</strong>
                  <span>{selected.stage}</span>
                </article>
                <article className="fact-card">
                  <strong>Consent</strong>
                  <span>{selected.consent}</span>
                </article>
                <article className="fact-card">
                  <strong>Owner</strong>
                  <span>{assigned[selected.id] ?? selected.owner}</span>
                </article>
                <article className="fact-card">
                  <strong>Age</strong>
                  <span>{selected.age}</span>
                </article>
              </div>
              <div className="timeline">
                <article>
                  <strong>Public next step selected</strong>
                  <small>{selected.pathway} · voluntary submission</small>
                </article>
                <article>
                  <strong>Welcome queue created</strong>
                  <small>
                    Only submitted contact information is available to the assigned team
                  </small>
                </article>
                <article>
                  <strong>Next action</strong>
                  <small>{selected.nextStep}</small>
                </article>
              </div>
              <div className="detail-actions">
                <button
                  className="primary-button"
                  type="button"
                  onClick={() =>
                    setAssigned((current) => ({
                      ...current,
                      [selected.id]: "Jordan Outreach Leader",
                    }))
                  }
                >
                  Assign to me
                </button>
                <button className="secondary-button" type="button">
                  Record synthetic follow-up
                </button>
              </div>
              <p className="notice notice--gold">
                Do not copy private prayer, counseling, child, or safeguarding details into the
                outreach CRM. Route those through their restricted ministry workflows.
              </p>
            </div>
          ) : (
            <div className="empty-state">
              <span>◇</span>
              <h3>No record selected.</h3>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
