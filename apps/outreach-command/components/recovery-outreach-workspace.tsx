"use client";

import { useMemo, useState, type FormEvent } from "react";

type WorkspaceTab = "resources" | "public-listening" | "search" | "inquiries" | "guardrails";

type Row = Record<string, unknown>;

interface Props {
  configured: boolean;
  resources: Row[];
  opportunities: Row[];
  inquiries: Row[];
}

interface ApprovedSource {
  id: string;
  label: string;
  url: string;
  purpose: string;
  status: "review" | "approved";
}

const officialResources = [
  {
    name: "FindTreatment.gov",
    type: "Official U.S. treatment locator",
    url: "https://findtreatment.gov/",
    description:
      "Search verified treatment resources by location and service need. The church does not copy a person’s search into Outreach OS.",
  },
  {
    name: "SAMHSA National Helpline",
    type: "Treatment information and referral",
    url: "https://www.samhsa.gov/find-help/helplines/national-helpline",
    description:
      "Official treatment information and referral resource. Use the public contact information supplied by the service.",
  },
  {
    name: "988 Suicide & Crisis Lifeline",
    type: "Urgent crisis support",
    url: "https://988lifeline.org/",
    description:
      "Call or text 988 in the United States. Immediate danger and suspected overdose should be directed to 911.",
  },
];

const searchTopics = [
  {
    query: "recovery support group near Lowell MA",
    intent: "Local peer and spiritual support",
    page: "/recovery-support",
    action: "Publish an accurate page explaining schedule, privacy, leadership, and treatment boundaries.",
  },
  {
    query: "Christian addiction recovery group Lowell",
    intent: "Faith-based recovery support",
    page: "/recovery-support",
    action: "Clarify that the group complements treatment and provide verified resource links.",
  },
  {
    query: "how to stay sober and find community",
    intent: "Connection and continuing support",
    page: "/recovery-support/community",
    action: "Create a people-first guide with crisis, treatment, peer, church, and online options.",
  },
  {
    query: "Sunday recovery meeting before church",
    intent: "Meeting schedule",
    page: "/recovery-support#meeting",
    action: "Keep the canonical Sunday schedule accurate and clearly state access and confidentiality expectations.",
  },
];

function text(row: Row, key: string, fallback = ""): string {
  return typeof row[key] === "string" ? (row[key] as string) : fallback;
}

function score(row: Row, key: string): number {
  return typeof row[key] === "number" && Number.isFinite(row[key]) ? (row[key] as number) : 0;
}

export function RecoveryOutreachWorkspace({ configured, resources, opportunities, inquiries }: Props) {
  const [tab, setTab] = useState<WorkspaceTab>("resources");
  const [zip, setZip] = useState("01852");
  const [sources, setSources] = useState<ApprovedSource[]>([]);
  const [sourceMessage, setSourceMessage] = useState<string | null>(null);
  const [topicFilter, setTopicFilter] = useState("");

  const visibleTopics = useMemo(() => {
    const needle = topicFilter.trim().toLowerCase();
    return searchTopics.filter((topic) => !needle || `${topic.query} ${topic.intent}`.toLowerCase().includes(needle));
  }, [topicFilter]);

  function addSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const label = String(form.get("label") ?? "").trim();
    const url = String(form.get("url") ?? "").trim();
    const purpose = String(form.get("purpose") ?? "").trim();
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      setSourceMessage("Enter a valid public HTTPS URL.");
      return;
    }
    if (parsed.protocol !== "https:") {
      setSourceMessage("Approved sources must use HTTPS.");
      return;
    }
    if (!label || !purpose) {
      setSourceMessage("Add a source name and a specific ministry purpose.");
      return;
    }
    setSources((current) => [
      {
        id: `${Date.now()}`,
        label,
        url,
        purpose,
        status: "review",
      },
      ...current,
    ]);
    setSourceMessage(
      "Source added to this browser review queue. Production approval still requires platform-terms, privacy, leadership, retention, and accountable-owner review.",
    );
    event.currentTarget.reset();
  }

  return (
    <div className="recovery-intelligence-workspace">
      <section className="command-hero recovery-intelligence-hero">
        <div>
          <p className="eyebrow">Sensitive outreach with strict boundaries</p>
          <h1>Recovery Outreach Intelligence</h1>
          <p>
            Find verified treatment and community resources, understand aggregate search needs,
            review genuinely public conversations, improve helpful pages, and follow up only after a
            person voluntarily asks to be contacted.
          </p>
        </div>
        <div className="hero-rail">
          <article>
            <span>{resources.length + officialResources.length}</span>
            <div><strong>Resource records</strong><small>Official plus approved directory entries</small></div>
          </article>
          <article>
            <span>{opportunities.length}</span>
            <div><strong>Public opportunities</strong><small>No private-group or searcher identity data</small></div>
          </article>
          <article>
            <span>{inquiries.length}</span>
            <div><strong>Voluntary inquiries</strong><small>Separate from advertising audiences</small></div>
          </article>
        </div>
      </section>

      <section className="notice notice--gold">
        <strong>Do not identify or score people as addicted, vulnerable, relapsing, or spiritually receptive.</strong>{" "}
        This workspace scores public topics, pages, organizations, and approved outreach opportunities—not individuals.
      </section>

      <nav className="search-toolbar recovery-outreach-tabs" aria-label="Recovery Outreach sections">
        {([
          ["resources", "Resource Finder"],
          ["public-listening", "Public Listening"],
          ["search", "Search & Content"],
          ["inquiries", "Confidential Inquiries"],
          ["guardrails", "Guardrails"],
        ] as const).map(([value, label]) => (
          <button key={value} type="button" className={`filter-chip${tab === value ? " active" : ""}`} onClick={() => setTab(value)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === "resources" ? (
        <div className="section-grid recovery-resource-layout">
          <section className="panel">
            <div className="panel__header">
              <div><h2>Official treatment-resource finder</h2><p>Open the official locator without storing a person’s search terms or health information.</p></div>
            </div>
            <div className="panel__body">
              <label className="field">
                ZIP code or location to search on the official site
                <input value={zip} onChange={(event) => setZip(event.target.value)} maxLength={20} />
              </label>
              <a className="primary-button" href="https://findtreatment.gov/locator" target="_blank" rel="noreferrer">
                Open official treatment locator ↗
              </a>
              <p className="notice">
                Current location entered: <strong>{zip || "not supplied"}</strong>. This value stays in this browser and is not added to a visitor profile.
              </p>
            </div>
          </section>
          <section className="panel">
            <div className="panel__header"><div><h2>Church-reviewed directory</h2><p>Verification status, public contact details, and last review should be visible.</p></div></div>
            <div className="panel__body connector-grid">
              {officialResources.map((resource) => (
                <article className="connector-card" key={resource.name}>
                  <div className="connector-card__header"><strong>{resource.name}</strong><span className="status-pill status-pill--ready">OFFICIAL</span></div>
                  <span>{resource.type}</span>
                  <p>{resource.description}</p>
                  <a className="ghost-button" href={resource.url} target="_blank" rel="noreferrer">Open resource ↗</a>
                </article>
              ))}
              {resources.map((resource) => (
                <article className="connector-card" key={text(resource, "id", text(resource, "name"))}>
                  <div className="connector-card__header"><strong>{text(resource, "name", "Unnamed resource")}</strong><span className={`status-pill status-pill--${text(resource, "verification_status") === "approved" ? "ready" : "review"}`}>{text(resource, "verification_status", "review")}</span></div>
                  <span>{text(resource, "resource_type").replaceAll("_", " ")} · {text(resource, "locality", "No locality supplied")}</span>
                  <p>{text(resource, "summary", "No summary supplied.")}</p>
                  {text(resource, "website_url") ? <a className="ghost-button" href={text(resource, "website_url")} target="_blank" rel="noreferrer">Open public site ↗</a> : null}
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {tab === "public-listening" ? (
        <div className="source-layout">
          <section className="panel">
            <div className="panel__header"><div><h2>Add a public source for review</h2><p>No source runs until a human confirms public access, platform terms, purpose, retention, and ownership.</p></div></div>
            <div className="panel__body">
              <form className="field-grid" onSubmit={addSource}>
                <label className="field field--span2">Public source name<input name="label" required placeholder="Example: Massachusetts public recovery events feed" /></label>
                <label className="field field--span2">Public HTTPS URL<input name="url" type="url" required placeholder="https://…" /></label>
                <label className="field field--span2">Specific purpose<textarea name="purpose" rows={4} required placeholder="Explain what public information is needed and how it will help the church create a useful public resource." /></label>
                <button className="primary-button" type="submit">Add to human review queue</button>
              </form>
              {sourceMessage ? <p className="notice notice--gold" role="status">{sourceMessage}</p> : null}
              <div className="allowlist">
                {sources.map((source) => (
                  <article key={source.id}><div><strong>{source.label}</strong><small>{source.url}</small><span>{source.purpose}</span></div><span className="status-pill status-pill--review">{source.status}</span></article>
                ))}
              </div>
            </div>
          </section>
          <section className="panel">
            <div className="panel__header"><div><h2>Approved public opportunities</h2><p>Only topic-level and organization-level records appear here.</p></div></div>
            <div className="panel__body">
              {opportunities.length ? (
                <div className="opportunity-list recovery-signal-list">
                  {opportunities.map((item) => (
                    <article className="opportunity-row" key={text(item, "id", text(item, "source_title"))}>
                      <span className="priority-dial">{score(item, "recovery_intent_score")}</span>
                      <span><h3>{text(item, "source_title", "Public recovery topic")}</h3><p>{text(item, "summary")}</p><span className="opportunity-meta"><span className="tag">{text(item, "source_kind").replaceAll("_", " ")}</span><span className="tag">risk {score(item, "sensitivity_risk_score")}</span></span></span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state"><span aria-hidden="true">⌕</span><h3>No approved public recovery signals.</h3><p>This is the correct state until an official API, approved public feed, or terms-compliant source is connected. The OS will not fabricate people or posts.</p></div>
              )}
            </div>
          </section>
        </div>
      ) : null}

      {tab === "search" ? (
        <section className="panel">
          <div className="panel__header"><div><h2>People-first recovery content opportunities</h2><p>Helpful public answers, clear schedules, verified resources, and voluntary next steps—not health-condition targeting.</p></div></div>
          <div className="panel__body">
            <input className="recovery-topic-filter" value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)} placeholder="Filter topics…" />
            <div className="search-table-wrap">
              <table className="data-table">
                <thead><tr><th>Public query/topic</th><th>Intent</th><th>Recommended page</th><th>Human-approved action</th></tr></thead>
                <tbody>{visibleTopics.map((topic) => <tr key={topic.query}><td><strong>{topic.query}</strong></td><td>{topic.intent}</td><td>{topic.page}</td><td>{topic.action}</td></tr>)}</tbody>
              </table>
            </div>
            <p className="notice notice--green">
              Connect Google Search Console to replace the topic list with aggregate impressions, clicks, CTR, position, page coverage, and date ranges. Search Console never supplies the identity of ordinary searchers.
            </p>
          </div>
        </section>
      ) : null}

      {tab === "inquiries" ? (
        <section className="panel">
          <div className="panel__header"><div><h2>Voluntary confidential inquiry queue</h2><p>A record begins only after a person deliberately requests contact and consents to the selected method.</p></div></div>
          <div className="panel__body">
            {!configured ? <div className="empty-state"><span aria-hidden="true">◇</span><h3>Connect Supabase before collecting recovery inquiries.</h3><p>Keep recovery inquiries separate from advertising audiences, enhanced conversions, prayer records, and ordinary visitor analytics.</p></div> : inquiries.length ? <div className="search-table-wrap"><table className="data-table"><thead><tr><th>Name supplied</th><th>Requested next step</th><th>Contact method</th><th>Status</th><th>Received</th></tr></thead><tbody>{inquiries.map((item) => <tr key={text(item, "id")}><td>{text(item, "display_name")}</td><td>{text(item, "requested_next_step").replaceAll("_", " ")}</td><td>{text(item, "contact_method")}</td><td><span className="status-pill status-pill--review">{text(item, "status")}</span></td><td>{text(item, "created_at") ? new Date(text(item, "created_at")).toLocaleString() : ""}</td></tr>)}</tbody></table></div> : <div className="empty-state"><span aria-hidden="true">◇</span><h3>No recovery-support inquiries are waiting.</h3><p>The OS does not create records from public browsing, search queries, or forum activity. Only voluntary form submissions appear here.</p></div>}
          </div>
        </section>
      ) : null}

      {tab === "guardrails" ? (
        <div className="section-grid">
          <section className="panel"><div className="panel__header"><div><h2>Allowed intelligence</h2><p>Public, aggregate, transparent, and purpose-limited.</p></div></div><div className="panel__body action-list"><li><span>✓</span>Aggregate Search Console queries and public-site performance</li><li><span>✓</span>Official treatment locators and public-health resources</li><li><span>✓</span>Genuinely public forum discussions when platform terms permit review</li><li><span>✓</span>Public recovery events and approved treatment/community partners</li><li><span>✓</span>Voluntary contact requests with explicit consent</li></div></section>
          <section className="panel"><div className="panel__header"><div><h2>Prohibited intelligence</h2><p>Never build or purchase these capabilities.</p></div></div><div className="panel__body action-list"><li><span>×</span>Private groups, direct messages, treatment records, or search histories</li><li><span>×</span>“Likely addicted,” “relapsing,” “vulnerable,” or “spiritually receptive” person scores</li><li><span>×</span>Member or recovery-participant lists uploaded to ad platforms</li><li><span>×</span>Automatic replies, deceptive identities, or unsolicited personal contact</li><li><span>×</span>Prayer, counseling, recovery, or child information in marketing analytics</li></div></section>
        </div>
      ) : null}
    </div>
  );
}
