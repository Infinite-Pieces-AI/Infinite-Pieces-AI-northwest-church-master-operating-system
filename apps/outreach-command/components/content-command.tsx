"use client";

import { useMemo, useState } from "react";
import { canonicalFacts, contentQueue } from "@/lib/demo-data";

const contentTypes = [
  { key: "seo", label: "SEO / AIO page", detail: "Useful public answer with structured sections" },
  { key: "response", label: "Public response", detail: "Transparent, non-pressuring forum reply" },
  { key: "social", label: "Social campaign", detail: "Captions, visual direction, and CTA" },
  { key: "video", label: "Short video", detail: "Hook, scenes, narration, and next step" },
  { key: "event", label: "Event campaign", detail: "Landing page, promotion, reminders" },
  { key: "image", label: "Image prompt", detail: "Fictional people and approved church facts" },
] as const;

type ContentType = (typeof contentTypes)[number]["key"];

type QueueItem = (typeof contentQueue)[number] & { localStatus?: string };

export function ContentCommand() {
  const [type, setType] = useState<ContentType>("seo");
  const [intent, setIntent] = useState("Online Bible study in Massachusetts");
  const [audience, setAudience] = useState("Adults voluntarily looking for an online Bible conversation");
  const [draft, setDraft] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([...contentQueue]);
  const facts = useMemo(() => canonicalFacts.map((fact) => `${fact.label}: ${fact.value}`).join(" · "), []);

  function generate() {
    const selectedType = contentTypes.find((item) => item.key === type)?.label ?? "Draft";
    const body = [
      `${selectedType}: ${intent}`,
      `Audience and need: ${audience}`,
      `Approved-fact context: ${facts}`,
      type === "response"
        ? "Disclosure: I’m part of Boston Church Lowell, so I want to be transparent about my connection. Answer the public question directly, offer accurate information without pressure, and point to a voluntary next step."
        : type === "seo"
          ? "Structure: direct answer, who this helps, what to expect, current approved details, FAQs, accessibility, online or local next step, and accurate structured data."
          : type === "video"
            ? "Structure: 3-second question, authentic public answer, practical details, one calm invitation, and no exaggerated spiritual claims."
            : type === "image"
              ? "Visual direction: premium, welcoming Lowell community scene with fictional illustrative people only; no claim that generated people are actual members or attendees."
              : "Structure: clear purpose, approved facts, helpful details, human voice, accessible format, and voluntary next step.",
      "Publication state: draft only. Communications review is required; theological review is required when the content teaches or interprets Scripture.",
    ].join("\n\n");
    setDraft(body);
  }

  function advance(id: string) {
    setQueue((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const status = item.localStatus ?? item.status;
        const next = status === "Draft" ? "In review" : status === "In review" ? "Approved" : status;
        return { ...item, localStatus: next };
      }),
    );
  }

  return (
    <>
      <div className="content-layout">
        <section className="panel">
          <div className="panel__header"><div><h2>Draft generator</h2><p>Deterministic demo generation from approved facts and a stated public need.</p></div></div>
          <div className="panel__body">
            <div className="content-type-grid">
              {contentTypes.map((item) => (
                <button key={item.key} type="button" className={type === item.key ? "active" : ""} onClick={() => setType(item.key)}>
                  <strong>{item.label}</strong><small>{item.detail}</small>
                </button>
              ))}
            </div>
            <div className="field-grid">
              <label className="field field--span2">Public question or content goal<input value={intent} onChange={(event) => setIntent(event.target.value)} /></label>
              <label className="field field--span2">Intended public audience and need<textarea rows={4} value={audience} onChange={(event) => setAudience(event.target.value)} /></label>
            </div>
            <button className="primary-button" style={{ marginTop: 14 }} type="button" onClick={generate}>Generate synthetic draft</button>
            <p className="notice notice--gold">The demo never publishes. Production requires approved church facts, a named reviewer, and a recorded decision.</p>
          </div>
        </section>

        <section className="panel">
          <div className="panel__header"><div><h2>Generated document</h2><p>Separated from live public content until approval.</p></div></div>
          <div className="panel__body">
            {draft ? (
              <div className="generated-document">
                <span className="status-pill status-pill--review">AI-ASSISTED DRAFT</span>
                <h3>{intent}</h3>
                {draft.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                <div className="approval-rail">
                  <article className="active"><strong>Draft</strong><small>Generated</small></article>
                  <article><strong>Facts</strong><small>Verify</small></article>
                  <article><strong>Review</strong><small>Communications</small></article>
                  <article><strong>Theology</strong><small>When applicable</small></article>
                  <article><strong>Publish</strong><small>Named approver</small></article>
                </div>
              </div>
            ) : <div className="empty-state"><span aria-hidden="true">✦</span><h3>No draft generated yet.</h3><p>Select a content type and state the public question the church is trying to answer.</p></div>}
          </div>
        </section>
      </div>

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel__header"><div><h2>Human approval queue</h2><p>Publishing and replies remain disabled until the exact version receives approval.</p></div></div>
        <div className="search-table-wrap">
          <table className="data-table">
            <thead><tr><th>Type</th><th>Draft</th><th>Status</th><th>Owner</th><th>Theology</th><th>Updated</th><th>Action</th></tr></thead>
            <tbody>{queue.map((item) => {
              const status = item.localStatus ?? item.status;
              return <tr key={item.id}><td>{item.type}</td><td><strong>{item.title}</strong></td><td><span className={`status-pill status-pill--${status === "Approved" ? "approved" : "review"}`}>{status}</span></td><td>{item.owner}</td><td>{item.theologicalReview ? "Required" : "Not required"}</td><td>{item.updated}</td><td><button className="ghost-button" type="button" onClick={() => advance(item.id)}>{status === "Draft" ? "Send to review" : status === "In review" ? "Approve demo" : "Reviewed"}</button></td></tr>;
            })}</tbody>
          </table>
        </div>
      </section>
    </>
  );
}
