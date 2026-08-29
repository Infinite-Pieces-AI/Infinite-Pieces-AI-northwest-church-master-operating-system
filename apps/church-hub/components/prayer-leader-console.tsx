"use client";

import { useEffect, useState } from "react";

interface RestrictedPrayer {
  id: string;
  title: string;
  requestText: string;
  ownerName: string;
  displayAnonymous: boolean;
  sensitivity: "pastoral" | "safeguarding";
  category: string;
  workflowStatus: string;
  assignedTo?: string;
  leaderNote?: string;
  createdAt: string;
}

export function PrayerLeaderConsole() {
  const [requests, setRequests] = useState<RestrictedPrayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("open");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/prayer?filter=${encodeURIComponent(filter)}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        requests?: RestrictedPrayer[];
        message?: string;
      };
      if (!response.ok)
        throw new Error(payload.message ?? "The restricted prayer queue could not be loaded.");
      setRequests(payload.requests ?? []);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "The restricted prayer queue could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [filter]);

  async function update(request: RestrictedPrayer, workflowStatus: string) {
    const note = window.prompt(
      "Add or update a restricted operational note. Do not copy this note into general channels or Outreach:",
      request.leaderNote ?? "",
    );
    if (note === null) return;
    try {
      const response = await fetch("/api/admin/prayer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestId: request.id, workflowStatus, leaderNote: note }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok)
        throw new Error(payload.message ?? "The restricted prayer workflow could not be updated.");
      setNotice("Restricted prayer workflow updated.");
      await load();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "The restricted prayer workflow could not be updated.",
      );
    }
  }

  return (
    <section className="module-workspace">
      <div className="section-heading">
        <div>
          <p>Restricted pastoral and safeguarding routing</p>
          <h3>Prayer leader queue</h3>
        </div>
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="open">Open restricted requests</option>
          <option value="pastoral">Pastoral follow-up</option>
          <option value="safeguarding">Safeguarding follow-up</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      <p className="prayer-safety">
        <strong>This queue does not replace emergency or mandated-reporting procedures.</strong>
        <span>
          Follow the church’s written escalation protocol immediately where required. Do not rely on
          an in-app note as the only report or response.
        </span>
      </p>
      {notice ? (
        <p className="module-notice" role="status">
          {notice}
        </p>
      ) : null}
      {loading ? <p className="module-empty">Loading restricted requests…</p> : null}
      {!loading ? (
        <div className="prayer-leader-list">
          {requests.map((request) => (
            <article key={request.id}>
              <header>
                <div>
                  <span>{request.sensitivity}</span>
                  <span>{request.workflowStatus.replaceAll("_", " ")}</span>
                </div>
                <small>{new Date(request.createdAt).toLocaleString()}</small>
              </header>
              <h4>{request.title}</h4>
              <p>{request.requestText}</p>
              <dl>
                <div>
                  <dt>Owner</dt>
                  <dd>{request.ownerName}</dd>
                </div>
                <div>
                  <dt>Member-feed display</dt>
                  <dd>
                    {request.displayAnonymous
                      ? "Anonymous if later permitted"
                      : "Named if later permitted"}
                  </dd>
                </div>
                <div>
                  <dt>Category</dt>
                  <dd>{request.category}</dd>
                </div>
                <div>
                  <dt>Assigned to</dt>
                  <dd>{request.assignedTo ?? "Unassigned"}</dd>
                </div>
              </dl>
              {request.leaderNote ? <blockquote>{request.leaderNote}</blockquote> : null}
              <div>
                <button type="button" onClick={() => void update(request, "assigned")}>
                  Assign to me
                </button>
                <button type="button" onClick={() => void update(request, "pastoral_followup")}>
                  Pastoral follow-up
                </button>
                <button type="button" onClick={() => void update(request, "safeguarding_followup")}>
                  Safeguarding follow-up
                </button>
                <button type="button" onClick={() => void update(request, "closed")}>
                  Close workflow
                </button>
              </div>
            </article>
          ))}
          {!requests.length ? (
            <p className="module-empty">No restricted prayer requests match this queue.</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
