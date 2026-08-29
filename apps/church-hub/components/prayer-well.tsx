"use client";

import { useEffect, useMemo, useState } from "react";

type PrayerVisibility = "church" | "ministry" | "group" | "leaders_only" | "private";
type PrayerStatus = "open" | "answered" | "archived" | "withdrawn";
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

interface PrayerContextOption {
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
  audienceLabel: string;
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
  requests: PrayerRequest[];
  contexts: {
    ministries: PrayerContextOption[];
    groups: PrayerContextOption[];
  };
}

const previewContexts: PrayerPayload["contexts"] = {
  ministries: [
    { id: "ministry-parents", name: "Parents Ministry" },
    { id: "ministry-young-adults", name: "Young Adults" },
  ],
  groups: [
    { id: "group-northwest-family", name: "Northwest Family Group" },
    { id: "group-sunday-team", name: "Sunday Welcome Team" },
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
    audienceLabel: "Approved church members",
    category: "family",
    sensitivity: "normal",
    allowEncouragement: true,
    allowPrayed: true,
    status: "open",
    createdAt: new Date(Date.now() - 45 * 60_000).toISOString(),
    interactions: [
      {
        id: "prayer-event-1",
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
    audienceLabel: "Approved church members",
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
        id: "prayer-event-2",
        type: "prayed",
        authorName: "You",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString(),
      },
      {
        id: "prayer-event-3",
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
    audienceLabel: "Northwest Family Group",
    category: "faith",
    sensitivity: "normal",
    allowEncouragement: true,
    allowPrayed: true,
    status: "open",
    createdAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
    interactions: [],
  },
];

const storageKey = "church-hub-prayer-well-v2";
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

function audienceLabel(
  visibility: PrayerVisibility,
  contextId: string,
  contexts: PrayerPayload["contexts"],
): string {
  if (visibility === "ministry") {
    return (
      contexts.ministries.find((context) => context.id === contextId)?.name ?? "Selected ministry"
    );
  }
  if (visibility === "group") {
    return contexts.groups.find((context) => context.id === contextId)?.name ?? "Selected group";
  }
  if (visibility === "church") return "Approved church members";
  if (visibility === "leaders_only") return "Authorized ministry leaders";
  return "Private";
}

export function PrayerWell({ mode, canLead }: { mode: "showcase" | "live"; canLead: boolean }) {
  const [activeTab, setActiveTab] = useState<"feed" | "mine" | "answered" | "create">("feed");
  const [requests, setRequests] = useState<PrayerRequest[]>(previewRequests);
  const [contexts, setContexts] = useState<PrayerPayload["contexts"]>(previewContexts);
  const [filter, setFilter] = useState<"all" | PrayerCategory>("all");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(mode === "live");
  const [selectedId, setSelectedId] = useState<string | null>(previewRequests[0]?.id ?? null);
  const [createVisibility, setCreateVisibility] = useState<PrayerVisibility>("church");

  useEffect(() => {
    if (mode === "showcase") {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        try {
          const payload = JSON.parse(stored) as PrayerPayload;
          if (Array.isArray(payload.requests)) setRequests(payload.requests);
          if (payload.contexts) setContexts(payload.contexts);
        } catch {
          window.localStorage.removeItem(storageKey);
        }
      }
      return;
    }
    void refreshLive();
  }, [mode]);

  useEffect(() => {
    if (mode !== "showcase") return;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ requests, contexts } satisfies PrayerPayload),
    );
  }, [contexts, mode, requests]);

  async function refreshLive() {
    setLoading(true);
    try {
      const response = await fetch("/api/prayer-well", { cache: "no-store" });
      const payload = (await response.json()) as PrayerPayload & { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Unable to load the Prayer Well.");
      setRequests(payload.requests ?? []);
      setContexts(payload.contexts ?? { ministries: [], groups: [] });
      setSelectedId((current) =>
        payload.requests?.some((request) => request.id === current)
          ? current
          : (payload.requests?.[0]?.id ?? null),
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load the Prayer Well.");
    } finally {
      setLoading(false);
    }
  }

  async function sendLive(action: string, payload: Record<string, unknown>) {
    const response = await fetch("/api/prayer-well", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    const result = (await response.json()) as { message?: string };
    if (!response.ok)
      throw new Error(result.message ?? "The prayer action could not be completed.");
    await refreshLive();
  }

  const visible = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return requests.filter((request) => {
      if (activeTab === "mine" && !request.isMine) return false;
      if (activeTab === "answered" && request.status !== "answered") return false;
      if (activeTab === "feed" && request.status !== "open") return false;
      if (filter !== "all" && request.category !== filter) return false;
      if (!normalized) return true;
      return `${request.title} ${request.text} ${request.authorName} ${request.audienceLabel}`
        .toLowerCase()
        .includes(normalized);
    });
  }, [activeTab, filter, requests, search]);

  const selected = requests.find((request) => request.id === selectedId) ?? visible[0] ?? null;
  const selectedContexts =
    createVisibility === "ministry"
      ? contexts.ministries
      : createVisibility === "group"
        ? contexts.groups
        : [];

  async function createRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const sensitivity = String(data.get("sensitivity")) as PrayerRequest["sensitivity"];
    const visibility = sensitivity === "normal" ? createVisibility : "leaders_only";
    const anonymous = data.get("anonymous") === "on";
    const contextId = String(data.get("contextId") ?? "");
    if ((visibility === "ministry" || visibility === "group") && !contextId) {
      setNotice(`Choose the ${visibility} that should receive this request.`);
      return;
    }
    const newRequest: PrayerRequest = {
      id: crypto.randomUUID(),
      title: String(data.get("title") ?? "").trim(),
      text: String(data.get("text") ?? "").trim(),
      authorName: anonymous ? "Anonymous member" : "You",
      isMine: true,
      anonymous,
      visibility,
      audienceLabel: audienceLabel(visibility, contextId, contexts),
      category: String(data.get("category")) as PrayerCategory,
      sensitivity,
      allowEncouragement: data.get("allowEncouragement") === "on",
      allowPrayed: data.get("allowPrayed") === "on",
      status: "open",
      createdAt: new Date().toISOString(),
      interactions: [],
    };
    try {
      if (mode === "showcase") {
        setRequests((current) => [newRequest, ...current]);
        setSelectedId(newRequest.id);
      } else {
        await sendLive("create_request", {
          title: newRequest.title,
          requestText: newRequest.text,
          displayAnonymous: newRequest.anonymous,
          visibility: newRequest.visibility,
          ministryId: newRequest.visibility === "ministry" ? contextId : null,
          groupId: newRequest.visibility === "group" ? contextId : null,
          category: newRequest.category,
          sensitivity: newRequest.sensitivity,
          allowEncouragement: newRequest.allowEncouragement,
          allowPrayedEvents: newRequest.allowPrayed,
        });
      }
      form.reset();
      setCreateVisibility("church");
      setActiveTab("mine");
      setNotice(
        sensitivity === "normal"
          ? `Your request was added for ${newRequest.audienceLabel}.`
          : "The request was routed only to the restricted leader workflow.",
      );
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "The prayer request could not be created.",
      );
    }
  }

  async function addInteraction(request: PrayerRequest, type: PrayerInteraction["type"]) {
    let body: string | undefined;
    if (type !== "prayed") {
      body = window
        .prompt(
          type === "scripture"
            ? "Share an approved Scripture reference and a short encouragement:"
            : type === "update"
              ? "Share an update:"
              : "Write a short encouragement:",
        )
        ?.trim();
      if (!body) return;
    }
    try {
      if (mode === "showcase") {
        setRequests((current) =>
          current.map((row) =>
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
        );
      } else {
        await sendLive("add_interaction", { requestId: request.id, type, body });
      }
      setNotice(
        type === "prayed"
          ? "The requester can see that another member prayed."
          : "Your response was added.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The response could not be added.");
    }
  }

  async function markAnswered(request: PrayerRequest) {
    const summary = window
      .prompt(
        "How was this prayer answered? Share only what is appropriate for the selected audience:",
      )
      ?.trim();
    if (!summary) return;
    try {
      if (mode === "showcase") {
        setRequests((current) =>
          current.map((row) =>
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
        );
      } else {
        await sendLive("mark_answered", { requestId: request.id, answeredSummary: summary });
      }
      setActiveTab("answered");
      setNotice("The prayer was marked answered and moved into the testimony archive.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The request could not be updated.");
    }
  }

  function resetShowcase() {
    setRequests(previewRequests);
    setContexts(previewContexts);
    window.localStorage.removeItem(storageKey);
    setSelectedId(previewRequests[0]?.id ?? null);
    setNotice("Prayer Well showcase restored.");
  }

  return (
    <div className="ministry-module prayer-module">
      <section className="module-hero module-hero--prayer">
        <div>
          <p className="module-kicker">Pray together without turning prayer into a social metric</p>
          <h2>Bring requests to the well. Encourage one another. Remember answered prayer.</h2>
          <p>
            Members choose the audience, whether their name is shown, and whether encouragement is
            open. Sensitive requests are kept out of the general feed.
          </p>
        </div>
        <div className="module-hero__metric">
          <strong>{requests.filter((request) => request.status === "open").length}</strong>
          <span>open prayer requests</span>
        </div>
      </section>

      <section className="prayer-safety">
        <strong>Prayer Well is not an emergency or safeguarding report system.</strong>
        <span>
          Immediate danger belongs with emergency services. Abuse, child-safety, and urgent pastoral
          concerns must use the church’s restricted escalation pathway—not a member feed.
        </span>
      </section>

      <nav className="module-tabs" aria-label="Prayer Well sections">
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
            className={activeTab === value ? "active" : ""}
            onClick={() => setActiveTab(value)}
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

      {!loading && activeTab !== "create" ? (
        <section className="prayer-layout">
          <div className="prayer-list-panel">
            <div className="module-toolbar">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search requests you are authorized to see…"
              />
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value as typeof filter)}
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
              {visible.map((request) => {
                const prayedCount = request.interactions.filter(
                  (interaction) => interaction.type === "prayed",
                ).length;
                return (
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
                        {request.authorName} · {categoryLabels[request.category]} · {prayedCount}{" "}
                        prayed
                      </small>
                    </span>
                  </button>
                );
              })}
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
                    <span>{selected.audienceLabel}</span>
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
                    <button type="button" onClick={() => void addInteraction(selected, "prayed")}>
                      I prayed
                    </button>
                  ) : null}
                  {selected.allowEncouragement && selected.status === "open" ? (
                    <button
                      type="button"
                      onClick={() => void addInteraction(selected, "encouragement")}
                    >
                      Encourage
                    </button>
                  ) : null}
                  {selected.allowEncouragement && selected.status === "open" ? (
                    <button
                      type="button"
                      onClick={() => void addInteraction(selected, "scripture")}
                    >
                      Share Scripture
                    </button>
                  ) : null}
                  {selected.isMine && selected.status === "open" ? (
                    <button type="button" onClick={() => void addInteraction(selected, "update")}>
                      Post update
                    </button>
                  ) : null}
                  {(selected.isMine || canLead) && selected.status === "open" ? (
                    <button
                      type="button"
                      className="success"
                      onClick={() => void markAnswered(selected)}
                    >
                      Mark answered
                    </button>
                  ) : null}
                </div>
                <div className="prayer-timeline">
                  {selected.interactions.map((interaction) => (
                    <article key={interaction.id}>
                      <span>
                        {interaction.type === "prayed"
                          ? "🙏"
                          : interaction.type === "scripture"
                            ? "✦"
                            : interaction.type === "update"
                              ? "↗"
                              : "♡"}
                      </span>
                      <div>
                        <strong>
                          {interaction.type === "prayed"
                            ? `${interaction.authorName} prayed`
                            : interaction.authorName}
                        </strong>
                        {interaction.body ? <p>{interaction.body}</p> : null}
                        <small>{new Date(interaction.createdAt).toLocaleString()}</small>
                      </div>
                    </article>
                  ))}
                  {!selected.interactions.length ? (
                    <p>No responses yet. Members may pray quietly without commenting.</p>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="module-empty">Choose a prayer request.</p>
            )}
          </article>
        </section>
      ) : null}

      {!loading && activeTab === "create" ? (
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
                name="visibility"
                value={createVisibility}
                onChange={(event) => setCreateVisibility(event.target.value as PrayerVisibility)}
              >
                <option value="church">Approved church members</option>
                {contexts.groups.length ? <option value="group">One of my groups</option> : null}
                {contexts.ministries.length ? (
                  <option value="ministry">One of my ministries</option>
                ) : null}
                <option value="leaders_only">Authorized ministry leaders only</option>
                <option value="private">Private to me</option>
              </select>
            </label>
            <label>
              Routing
              <select name="sensitivity" defaultValue="normal">
                <option value="normal">Normal prayer request</option>
                <option value="pastoral">Pastoral and restricted</option>
                <option value="safeguarding">Safeguarding concern—restricted workflow</option>
              </select>
            </label>
            {createVisibility === "group" || createVisibility === "ministry" ? (
              <label className="span-2">
                Choose {createVisibility}
                <select name="contextId" required defaultValue="">
                  <option value="" disabled>
                    Select an authorized {createVisibility}
                  </option>
                  {selectedContexts.map((context) => (
                    <option value={context.id} key={context.id}>
                      {context.name}
                    </option>
                  ))}
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
            default AI processing. Anonymous requests separate the owner mapping from the member
            feed.
          </p>
          {mode === "showcase" ? (
            <button type="button" className="module-secondary" onClick={resetShowcase}>
              Reset showcase
            </button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
