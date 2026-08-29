"use client";

import { useEffect, useMemo, useState } from "react";

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

const previewRequests: RestrictedPrayer[] = [
  {
    id: "prayer-restricted-1",
    title: "Please pray for wisdom in a difficult family season",
    requestText:
      "I would appreciate prayer and a private conversation with a ministry leader. Please do not place the details in the church-wide feed.",
    ownerName: "Member requesting pastoral follow-up",
    displayAnonymous: true,
    sensitivity: "pastoral",
    category: "family",
    workflowStatus: "open",
    createdAt: new Date(Date.now() - 75 * 60_000).toISOString(),
  },
  {
    id: "prayer-restricted-2",
    title: "Private safety-related follow-up requested",
    requestText:
      "This request was intentionally routed outside the member Prayer Well so an authorized safety leader can follow the church's written protocol.",
    ownerName: "Restricted member identity",
    displayAnonymous: true,
    sensitivity: "safeguarding",
    category: "safety",
    workflowStatus: "safeguarding_followup",
    assignedTo: "Safety Leader",
    leaderNote: "Use the church's approved safeguarding process; do not copy details into ordinary channels.",
    createdAt: new Date(Date.now() - 5 * 60 * 60_000).toISOString(),
  },
  {
    id: "prayer-restricted-3",
    title: "Pastoral encouragement after a loss",
    requestText:
      "The member asked for prayer and for someone from the ministry team to check in privately this week.",
    ownerName: "Member requesting pastoral follow-up",
    displayAnonymous: false,
    sensitivity: "pastoral",
    category: "grief",
    workflowStatus: "pastoral_followup",
    assignedTo: "Ministry Leader",
    createdAt: new Date(Date.now() - 26 * 60 * 60_000).toISOString(),
  },
];

const storageKey = "church-hub-prayer-leader-showcase-v1";

export function PrayerLeaderConsole({ mode }: { mode: "showcase" | "live" }) {
  const [requests, setRequests] = useState<RestrictedPrayer[]>(
    mode === "showcase" ? previewRequests : [],
  );
  const [loading, setLoading] = useState(mode === "live");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("open");

  useEffect(() => {
    if (mode === "showcase") {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as RestrictedPrayer[];
          if (Array.isArray(parsed)) setRequests(parsed);
        } catch {
          window.localStorage.removeItem(storageKey);
        }
      }
      setLoading(false);
      return;
    }
    void loadLive();
  }, [mode, filter]);

  useEffect(() => {
    if (mode === "showcase") window.localStorage.setItem(storageKey, JSON.stringify(requests));
  }, [mode, requests]);

  async function loadLive() {
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

  const visibleRequests = useMemo(() => {
    if (mode !== "showcase") return requests;
    if (filter === "pastoral") return requests.filter((request) => request.sensitivity === "pastoral");
    if (filter === "safeguarding")
      return requests.filter((request) => request.sensitivity === "safeguarding");
    if (filter === "closed") return requests.filter((request) => request.workflowStatus === "closed");
    return requests.filter((request) => request.workflowStatus !== "closed");
  }, [filter, mode, requests]);

  async function update(request: RestrictedPrayer, workflowStatus: string) {
    const note = window.prompt(
      "Add or update a restricted operational note. Do not copy this note into general channels or Outreach:",
      request.leaderNote ?? "",
    );
    if (note === null) return;
    if (mode === "showcase") {
      setRequests((current) =>
        current.map((row) =>
          row.id === request.id
            ? {
                ...row,
                workflowStatus,
                leaderNote: note || undefined,
                assignedTo: workflowStatus === "assigned" ? "Local Preview Leader" : row.assignedTo,
              }
            : row,
        ),
      );
      setNotice("Showcase workflow updated in this browser only.");
      return;
    }
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
      await loadLive();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "The restricted prayer workflow could not be updated.",
      );
    }
  }

  function resetShowcase() {
    setRequests(previewRequests);
    window.localStorage.removeItem(storageKey);
    setFilter("open");
    setNotice("Prayer leader showcase restored.");
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
      {mode === "showcase" ? (
        <p className="module-notice">
          Interactive showcase: these restricted examples and workflow changes stay in this browser.
        </p>
      ) : null}
      {notice ? (
        <p className="module-notice" role="status">
          {notice}
        </p>
      ) : null}
      {loading ? <p className="module-empty">Loading restricted requests…</p> : null}
      {!loading ? (
        <div className="prayer-leader-list">
          {visibleRequests.map((request) => (
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
          {!visibleRequests.length ? (
            <p className="module-empty">No restricted prayer requests match this queue.</p>
          ) : null}
        </div>
      ) : null}
      {mode === "showcase" ? (
        <button type="button" className="module-secondary" onClick={resetShowcase}>
          Reset prayer leader showcase
        </button>
      ) : null}
    </section>
  );
}
