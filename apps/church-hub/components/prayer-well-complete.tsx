"use client";

import { useEffect, useMemo, useState } from "react";

type PrayerVisibility = "church" | "ministry" | "group" | "leaders_only" | "private";
type PrayerCategory =
  | "general"
  | "health"
  | "family"
  | "work"
  | "grief"
  | "faith"
  | "recovery"
  | "thanksgiving"
  | "other";
type PrayerStatus = "open" | "answered" | "archived" | "withdrawn";

interface AudienceOption {
  id: string;
  name: string;
}
interface PrayerInteraction {
  id: string;
  type: "prayed" | "encouragement" | "scripture" | "update";
  authorName: string;
  body?: string;
  createdAt: string;
}
interface PrayerRequest {
  id: string;
  title: string;
  text: string;
  authorName: string;
  isMine: boolean;
  anonymous: boolean;
  visibility: PrayerVisibility;
  audienceId?: string;
  category: PrayerCategory;
  sensitivity: "normal" | "pastoral" | "safeguarding";
  allowEncouragement: boolean;
  allowPrayed: boolean;
  status: PrayerStatus;
  answeredSummary?: string;
  answeredAt?: string;
  createdAt: string;
  interactions: PrayerInteraction[];
}
interface PrayerPayload {
  audiences: { groups: AudienceOption[]; ministries: AudienceOption[] };
  requests: PrayerRequest[];
}

const previewAudiences = {
  groups: [
    { id: "group-family-lowell", name: "Lowell Family Group" },
    { id: "group-young-adults", name: "Young Adults Group" },
  ],
  ministries: [
    { id: "ministry-parents", name: "Parents Ministry" },
    { id: "ministry-recovery", name: "Recovery Ministry leaders" },
  ],
};
const previewRequests: PrayerRequest[] = [
  {
    id: "prayer-1",
    title: "Peace for an important family conversation",
    text: "Please pray that our family listens carefully, speaks gently, and chooses unity during a difficult conversation this week.",
    authorName: "Anonymous member",
    isMine: false,
    anonymous: true,
    visibility: "church",
    category: "family",
    sensitivity: "normal",
    allowEncouragement: true,
    allowPrayed: true,
    status: "open",
    createdAt: new Date(Date.now() - 45 * 60_000).toISOString(),
    interactions: [
      {
        id: "event-1",
        type: "encouragement",
        authorName: "Jordan",
        body: "Praying for patience, wisdom, and a peaceful path forward.",
        createdAt: new Date(Date.now() - 20 * 60_000).toISOString(),
      },
    ],
  },
  {
    id: "prayer-2",
    title: "Gratitude for a new job",
    text: "Thank God for opening a door after a long season of waiting. Please pray that I begin with humility and serve my new coworkers well.",
    authorName: "Maya",
    isMine: false,
    anonymous: false,
    visibility: "church",
    category: "thanksgiving",
    sensitivity: "normal",
    allowEncouragement: true,
    allowPrayed: true,
    status: "answered",
    answeredSummary: "The job offer was accepted and the first week went well.",
    answeredAt: new Date(Date.now() - 24 * 60 * 60_000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60_000).toISOString(),
    interactions: [
      {
        id: "event-2",
        type: "prayed",
        authorName: "You",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString(),
      },
      {
        id: "event-3",
        type: "update",
        authorName: "Maya",
        body: "Thank you for praying—the position is official.",
        createdAt: new Date(Date.now() - 24 * 60 * 60_000).toISOString(),
      },
    ],
  },
  {
    id: "prayer-3",
    title: "Courage to invite a friend to study the Bible",
    text: "Please pray for courage, sensitivity, and a genuine heart as I ask a longtime friend if they would like to read Scripture together.",
    authorName: "You",
    isMine: true,
    anonymous: false,
    visibility: "group",
    audienceId: "group-family-lowell",
    category: "faith",
    sensitivity: "normal",
    allowEncouragement: true,
    allowPrayed: true,
    status: "open",
    createdAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
    interactions: [],
  },
];
const storageKey = "church-hub-prayer-well-complete-v1";
const categoryLabels: Record<PrayerCategory, string> = {
  general: "General",
  health: "Health",
  family: "Family",
  work: "Work",
  grief: "Grief",
  faith: "Faith",
  recovery: "Recovery",
  thanksgiving: "Thanksgiving",
  other: "Other",
};

export function PrayerWellComplete({
  mode,
  canLead,
}: {
  mode: "showcase" | "live";
  canLead: boolean;
}) {
  const [payload, setPayload] = useState<PrayerPayload>({
    audiences: previewAudiences,
    requests: previewRequests,
  });
  const [tab, setTab] = useState<"feed" | "mine" | "answered" | "create">("feed");
  const [selectedId, setSelectedId] = useState<string | null>(previewRequests[0]?.id ?? null);
  const [category, setCategory] = useState<"all" | PrayerCategory>("all");
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState<PrayerVisibility>("church");
  const [audienceId, setAudienceId] = useState("");
  const [loading, setLoading] = useState(mode === "live");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (mode === "showcase") {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as PrayerPayload;
          if (Array.isArray(parsed.requests)) setPayload(parsed);
        } catch {
          window.localStorage.removeItem(storageKey);
        }
      }
      return;
    }
    void refreshLive();
  }, [mode]);

  useEffect(() => {
    if (mode === "showcase") window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [mode, payload]);

  async function refreshLive() {
    setLoading(true);
    try {
      const response = await fetch("/api/prayer-well-complete", { cache: "no-store" });
      const result = (await response.json()) as PrayerPayload & { message?: string };
      if (!response.ok) throw new Error(result.message ?? "The Prayer Well could not be loaded.");
      setPayload(result);
      setSelectedId(result.requests[0]?.id ?? null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The Prayer Well could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  async function sendLive(action: string, values: Record<string, unknown>) {
    const response = await fetch("/api/prayer-well-complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, ...values }),
    });
    const result = (await response.json()) as { message?: string };
    if (!response.ok)
      throw new Error(result.message ?? "The prayer action could not be completed.");
    await refreshLive();
  }

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return payload.requests.filter((request) => {
      if (tab === "feed" && request.status !== "open") return false;
      if (tab === "mine" && !request.isMine) return false;
      if (tab === "answered" && request.status !== "answered") return false;
      if (category !== "all" && request.category !== category) return false;
      return (
        !normalized ||
        `${request.title} ${request.text} ${request.authorName}`.toLowerCase().includes(normalized)
      );
    });
  }, [category, payload.requests, query, tab]);
  const selected =
    payload.requests.find((request) => request.id === selectedId) ?? visible[0] ?? null;
  const selectedAudienceOptions =
    visibility === "group"
      ? payload.audiences.groups
      : visibility === "ministry"
        ? payload.audiences.ministries
        : [];

  async function createRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const sensitivity = String(data.get("sensitivity")) as PrayerRequest["sensitivity"];
    const anonymous = data.get("anonymous") === "on";
    if ((visibility === "group" || visibility === "ministry") && !audienceId) {
      setNotice(`Choose the ${visibility} that may see this request.`);
      return;
    }
    const request: PrayerRequest = {
      id: crypto.randomUUID(),
      title: String(data.get("title") ?? "").trim(),
      text: String(data.get("text") ?? "").trim(),
      authorName: anonymous ? "Anonymous member" : "You",
      isMine: true,
      anonymous,
      visibility: sensitivity === "normal" ? visibility : "leaders_only",
      audienceId: visibility === "group" || visibility === "ministry" ? audienceId : undefined,
      category: String(data.get("category")) as PrayerCategory,
      sensitivity,
      allowEncouragement: data.get("allowEncouragement") === "on",
      allowPrayed: data.get("allowPrayed") === "on",
      status: "open",
      createdAt: new Date().toISOString(),
      interactions: [],
    };
    try {
      if (mode === "showcase")
        setPayload((current) => ({ ...current, requests: [request, ...current.requests] }));
      else
        await sendLive("create_request", {
          title: request.title,
          requestText: request.text,
          displayAnonymous: request.anonymous,
          visibility: request.visibility,
          audienceId: request.audienceId,
          category: request.category,
          sensitivity: request.sensitivity,
          allowEncouragement: request.allowEncouragement,
          allowPrayedEvents: request.allowPrayed,
        });
      event.currentTarget.reset();
      setVisibility("church");
      setAudienceId("");
      setTab("mine");
      setSelectedId(request.id);
      setNotice(
        sensitivity === "normal"
          ? "Your prayer request was added with the audience you selected."
          : "The request was routed only to the restricted leader workflow.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The request could not be added.");
    }
  }

  async function interact(request: PrayerRequest, type: PrayerInteraction["type"]) {
    let body: string | undefined;
    if (type !== "prayed") {
      body = window
        .prompt(
          type === "scripture"
            ? "Share an approved Scripture reference and short encouragement:"
            : type === "update"
              ? "Share an update:"
              : "Write a short encouragement:",
        )
        ?.trim();
      if (!body) return;
    }
    try {
      if (mode === "showcase")
        setPayload((current) => ({
          ...current,
          requests: current.requests.map((row) =>
            row.id === request.id
              ? {
                  ...row,
                  interactions: [
                    ...row.interactions,
                    {
                      id: crypto.randomUUID(),
                      type,
                      authorName: "You",
                      body,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                }
              : row,
          ),
        }));
      else await sendLive("add_interaction", { requestId: request.id, type, body });
      setNotice(
        type === "prayed"
          ? "The requester can see that another member prayed."
          : "Your response was added.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The response could not be added.");
    }
  }

  async function answer(request: PrayerRequest) {
    const summary = window
      .prompt(
        "How was this prayer answered? Share only what is appropriate for the selected audience:",
      )
      ?.trim();
    if (!summary) return;
    try {
      if (mode === "showcase")
        setPayload((current) => ({
          ...current,
          requests: current.requests.map((row) =>
            row.id === request.id
              ? {
                  ...row,
                  status: "answered",
                  answeredSummary: summary,
                  answeredAt: new Date().toISOString(),
                  interactions: [
                    ...row.interactions,
                    {
                      id: crypto.randomUUID(),
                      type: "update",
                      authorName: "You",
                      body: summary,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                }
              : row,
          ),
        }));
      else await sendLive("mark_answered", { requestId: request.id, answeredSummary: summary });
      setTab("answered");
      setNotice("The request moved to answered prayer.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The request could not be updated.");
    }
  }

  return (
    <div className="ministry-module prayer-module">
      <section className="module-hero module-hero--prayer">
        <div>
          <p className="module-kicker">Member-controlled prayer and privacy</p>
          <h2>Bring requests to the well. Encourage one another. Remember answered prayer.</h2>
          <p>
            Choose the audience, whether your name is shown, and whether encouragement is open.
            Pastoral and safeguarding requests never enter the general feed.
          </p>
        </div>
        <div className="module-hero__metric">
          <strong>{payload.requests.filter((request) => request.status === "open").length}</strong>
          <span>open requests</span>
        </div>
      </section>
      <section className="prayer-safety">
        <strong>Prayer Well is not an emergency or safeguarding report system.</strong>
        <span>
          Immediate danger belongs with emergency services. Abuse, child-safety, and urgent pastoral
          concerns must use the written restricted escalation pathway.
        </span>
      </section>
      <nav className="module-tabs">
        {(
          [
            ["feed", "Prayer list"],
            ["mine", "My requests"],
            ["answered", "Answered"],
            ["create", "Add request"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={tab === value ? "active" : ""}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </nav>
      {notice ? (
        <p className="module-notice" role="status">
          {notice}
        </p>
      ) : null}
      {loading ? <p className="module-empty">Loading the Prayer Well…</p> : null}

      {!loading && tab !== "create" ? (
        <section className="prayer-layout">
          <div className="prayer-list-panel">
            <div className="module-toolbar">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search requests you are authorized to see…"
              />
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as typeof category)}
              >
                <option value="all">All categories</option>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="prayer-request-list">
              {visible.map((request) => (
                <button
                  type="button"
                  key={request.id}
                  className={selected?.id === request.id ? "active" : ""}
                  onClick={() => setSelectedId(request.id)}
                >
                  <span className={`prayer-icon prayer-icon--${request.status}`}>
                    {request.status === "answered" ? "✓" : "◌"}
                  </span>
                  <span>
                    <strong>{request.title}</strong>
                    <small>
                      {request.authorName} · {categoryLabels[request.category]} ·{" "}
                      {request.interactions.filter((event) => event.type === "prayed").length}{" "}
                      prayed
                    </small>
                  </span>
                </button>
              ))}
              {!visible.length ? (
                <p className="module-empty">No prayer requests match this view.</p>
              ) : null}
            </div>
          </div>
          <article className="prayer-detail">
            {selected ? (
              <>
                <header>
                  <div>
                    <span>{categoryLabels[selected.category]}</span>
                    <span>{selected.visibility.replaceAll("_", " ")}</span>
                  </div>
                  <h3>{selected.title}</h3>
                  <p>
                    {selected.authorName} · {new Date(selected.createdAt).toLocaleString()}
                  </p>
                </header>
                <blockquote>{selected.text}</blockquote>
                {selected.status === "answered" && selected.answeredSummary ? (
                  <div className="answered-card">
                    <strong>Answered prayer</strong>
                    <p>{selected.answeredSummary}</p>
                  </div>
                ) : null}
                <div className="prayer-actions">
                  {selected.allowPrayed && selected.status === "open" ? (
                    <button type="button" onClick={() => void interact(selected, "prayed")}>
                      I prayed
                    </button>
                  ) : null}
                  {selected.allowEncouragement && selected.status === "open" ? (
                    <button type="button" onClick={() => void interact(selected, "encouragement")}>
                      Encourage
                    </button>
                  ) : null}
                  {selected.allowEncouragement && selected.status === "open" ? (
                    <button type="button" onClick={() => void interact(selected, "scripture")}>
                      Share Scripture
                    </button>
                  ) : null}
                  {selected.isMine && selected.status === "open" ? (
                    <button type="button" onClick={() => void interact(selected, "update")}>
                      Post update
                    </button>
                  ) : null}
                  {(selected.isMine || canLead) && selected.status === "open" ? (
                    <button type="button" className="success" onClick={() => void answer(selected)}>
                      Mark answered
                    </button>
                  ) : null}
                </div>
                <div className="prayer-timeline">
                  {selected.interactions.map((event) => (
                    <article key={event.id}>
                      <span>
                        {event.type === "prayed"
                          ? "🙏"
                          : event.type === "scripture"
                            ? "✦"
                            : event.type === "update"
                              ? "↗"
                              : "♡"}
                      </span>
                      <div>
                        <strong>
                          {event.type === "prayed"
                            ? `${event.authorName} prayed`
                            : event.authorName}
                        </strong>
                        {event.body ? <p>{event.body}</p> : null}
                        <small>{new Date(event.createdAt).toLocaleString()}</small>
                      </div>
                    </article>
                  ))}
                  {!selected.interactions.length ? (
                    <p>No responses yet. Members may pray quietly without commenting.</p>
                  ) : null}
                </div>
              </>
            ) : (
              <p>Choose a request.</p>
            )}
          </article>
        </section>
      ) : null}

      {!loading && tab === "create" ? (
        <section className="module-workspace">
          <div className="section-heading">
            <div>
              <p>Member-controlled privacy</p>
              <h3>Add a prayer request</h3>
            </div>
          </div>
          <form className="module-form" onSubmit={(event) => void createRequest(event)}>
            <label>
              Short title
              <input name="title" required minLength={2} maxLength={180} />
            </label>
            <label>
              Category
              <select name="category" defaultValue="general">
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="span-2">
              Prayer request
              <textarea name="text" rows={6} required minLength={3} maxLength={5000} />
            </label>
            <label>
              Who may see it?
              <select
                value={visibility}
                onChange={(event) => {
                  setVisibility(event.target.value as PrayerVisibility);
                  setAudienceId("");
                }}
              >
                <option value="church">Approved church members</option>
                <option value="group">One of my groups</option>
                <option value="ministry">One of my ministries</option>
                <option value="leaders_only">Authorized leaders only</option>
                <option value="private">Private to me</option>
              </select>
            </label>
            {visibility === "group" || visibility === "ministry" ? (
              <label>
                Choose {visibility}
                <select
                  value={audienceId}
                  onChange={(event) => setAudienceId(event.target.value)}
                  required
                >
                  <option value="">Select an authorized {visibility}</option>
                  {selectedAudienceOptions.map((option) => (
                    <option value={option.id} key={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label>
                Routing
                <select name="sensitivity" defaultValue="normal">
                  <option value="normal">Normal prayer request</option>
                  <option value="pastoral">Pastoral and restricted</option>
                  <option value="safeguarding">Safeguarding concern—restricted workflow</option>
                </select>
              </label>
            )}
            {visibility === "group" || visibility === "ministry" ? (
              <label>
                Routing
                <select name="sensitivity" defaultValue="normal">
                  <option value="normal">Normal prayer request</option>
                  <option value="pastoral">Pastoral and restricted</option>
                  <option value="safeguarding">Safeguarding concern—restricted workflow</option>
                </select>
              </label>
            ) : null}
            <label className="check-label">
              <input type="checkbox" name="anonymous" /> Hide my name from the selected audience
            </label>
            <label className="check-label">
              <input type="checkbox" name="allowPrayed" defaultChecked /> Let members mark that they
              prayed
            </label>
            <label className="check-label">
              <input type="checkbox" name="allowEncouragement" defaultChecked /> Allow encouragement
              and Scripture comments
            </label>
            <button type="submit">Add to Prayer Well</button>
          </form>
          <p className="module-boundary">
            Prayer content is excluded from advertising, search targeting, visitor profiling, and
            default AI processing. Anonymous requests separate ownership from the member-visible
            feed.
          </p>
          {mode === "showcase" ? (
            <button
              type="button"
              className="module-secondary"
              onClick={() => {
                setPayload({ audiences: previewAudiences, requests: previewRequests });
                window.localStorage.removeItem(storageKey);
              }}
            >
              Reset showcase
            </button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
