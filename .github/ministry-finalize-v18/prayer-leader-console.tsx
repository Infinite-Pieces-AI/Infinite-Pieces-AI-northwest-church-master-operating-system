"use client";

import { useEffect, useMemo, useState } from "react";

type WorkflowStatus = "new" | "in_review" | "resolved" | "archived";

interface RestrictedPrayerRequest {
  id: string;
  title: string;
  requestText: string;
  displayName: string;
  ownerName: string;
  ownerEmail?: string;
  category: string;
  sensitivity: "pastoral" | "safeguarding" | string;
  visibility: string;
  status: string;
  workflowStatus: WorkflowStatus;
  assignedTo: string;
  leaderNote?: string;
  leaderReviewedAt?: string;
  createdAt: string;
}

const previewRequests: RestrictedPrayerRequest[] = [
  {
    id: "restricted-prayer-1",
    title: "Private pastoral conversation requested",
    requestText:
      "I would appreciate a confidential conversation with a minister about a family situation. This is not an emergency.",
    displayName: "Anonymous in member-facing views",
    ownerName: "Preview Member",
    ownerEmail: "preview.member@example.invalid",
    category: "family",
    sensitivity: "pastoral",
    visibility: "leaders_only",
    status: "open",
    workflowStatus: "new",
    assignedTo: "Unassigned",
    createdAt: new Date(Date.now() - 35 * 60_000).toISOString(),
  },
  {
    id: "restricted-prayer-2",
    title: "Safeguarding review required",
    requestText:
      "A fictional safeguarding concern used only to demonstrate restricted routing and escalation controls.",
    displayName: "Anonymous in member-facing views",
    ownerName: "Preview Guardian",
    ownerEmail: "preview.guardian@example.invalid",
    category: "family",
    sensitivity: "safeguarding",
    visibility: "leaders_only",
    status: "open",
    workflowStatus: "in_review",
    assignedTo: "Local Preview Safety Administrator",
    leaderNote: "Follow the written safeguarding protocol; do not handle this through ordinary Prayer Well comments.",
    leaderReviewedAt: new Date(Date.now() - 12 * 60_000).toISOString(),
    createdAt: new Date(Date.now() - 90 * 60_000).toISOString(),
  },
];

export function PrayerLeaderConsole({ mode }: { mode: "showcase" | "live" }) {
  const [requests, setRequests] = useState<RestrictedPrayerRequest[]>(
    mode === "showcase" ? previewRequests : [],
  );
  const [view, setView] = useState<"active" | "closed">("active");
  const [loading, setLoading] = useState(mode === "live");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (mode === "live") void refresh();
  }, [mode]);

  async function refresh() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/prayer", { cache: "no-store" });
      const payload = (await response.json()) as {
        requests?: RestrictedPrayerRequest[];
        message?: string;
      };
      if (!response.ok) throw new Error(payload.message ?? "Prayer routing could not be loaded.");
      setRequests(payload.requests ?? []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Prayer routing could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  async function update(
    request: RestrictedPrayerRequest,
    workflowStatus: WorkflowStatus,
    assignToMe = false,
  ) {
    const note = window.prompt("Restricted leader note:", request.leaderNote ?? "");
    if (note === null) return;
    try {
      if (mode === "showcase") {
        setRequests((current) =>
          current.map((entry) =>
            entry.id === request.id
              ? {
                  ...entry,
                  workflowStatus,
                  assignedTo: assignToMe ? "Local Preview Leader" : entry.assignedTo,
                  leaderNote: note.trim() || undefined,
                  leaderReviewedAt: new Date().toISOString(),
                }
              : entry,
          ),
        );
      } else {
        const response = await fetch("/api/admin/prayer", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            requestId: request.id,
            workflowStatus,
            assignToMe,
            note,
          }),
        });
        const payload = (await response.json()) as { message?: string };
        if (!response.ok) throw new Error(payload.message ?? "Prayer routing failed.");
        await refresh();
      }
      setNotice(`Restricted prayer workflow marked ${workflowStatus.replaceAll("_", " ")}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Prayer routing failed.");
    }
  }

  const visible = useMemo(
    () =>
      requests.filter((request) =>
        view === "active"
          ? request.workflowStatus === "new" || request.workflowStatus === "in_review"
          : request.workflowStatus === "resolved" || request.workflowStatus === "archived",
      ),
    [requests, view],
  );

  return (
    <section className="module-workspace">
      <div className="module-tabs" aria-label="Restricted prayer workflow views">
        <button
          type="button"
          className={view === "active" ? "active" : ""}
          onClick={() => setView("active")}
        >
          Active routing
        </button>
        <button
          type="button"
          className={view === "closed" ? "active" : ""}
          onClick={() => setView("closed")}
        >
          Resolved and archived
        </button>
      </div>
      <section className="prayer-safety">
        <strong>Restricted workflow—not an ordinary Prayer Well feed.</strong>
        <span>
          Follow emergency, mandated-reporting, safeguarding, pastoral, documentation, and access
          procedures outside this screen whenever required. An in-app note never replaces a required
          report or emergency response.
        </span>
      </section>
      {notice ? (
        <p className="module-notice" role="status">
          {notice}
        </p>
      ) : null}
      {loading ? <p className="module-empty">Loading restricted prayer queue…</p> : null}
      {!loading ? (
        <div className="prayer-leader-list">
          {visible.map((request) => (
            <article key={request.id}>
              <header>
                <div>
                  <span>{request.sensitivity}</span>
                  <span>{request.workflowStatus.replaceAll("_", " ")}</span>
                  <span>{request.category}</span>
                </div>
                <small>{new Date(request.createdAt).toLocaleString()}</small>
              </header>
              <h3>{request.title}</h3>
              <blockquote>{request.requestText}</blockquote>
              <dl>
                <div>
                  <dt>Member-facing display</dt>
                  <dd>{request.displayName}</dd>
                </div>
                <div>
                  <dt>Restricted owner</dt>
                  <dd>{request.ownerName}</dd>
                </div>
                <div>
                  <dt>Approved contact</dt>
                  <dd>{request.ownerEmail ?? "No email available"}</dd>
                </div>
                <div>
                  <dt>Assigned to</dt>
                  <dd>{request.assignedTo}</dd>
                </div>
              </dl>
              {request.leaderNote ? (
                <p>
                  <strong>Restricted note:</strong> {request.leaderNote}
                </p>
              ) : null}
              <div>
                <button type="button" onClick={() => void update(request, "in_review", true)}>
                  Assign to me
                </button>
                <button type="button" onClick={() => void update(request, "resolved")}>
                  Mark resolved
                </button>
                <button type="button" onClick={() => void update(request, "archived")}>
                  Archive
                </button>
              </div>
            </article>
          ))}
          {!visible.length ? (
            <p className="module-empty">No restricted prayer requests are in this view.</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
