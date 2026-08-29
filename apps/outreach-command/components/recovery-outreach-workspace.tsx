"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface Partner {
  id: string;
  organizationName: string;
  organizationType: string;
  publicUrl: string;
  publicContact?: string | undefined;
  locality: string;
  partnershipStatus: string;
  notes?: string | undefined;
  verifiedPublicSourceAt?: string | undefined;
}

interface PublicTopic {
  id: string;
  sourceKind: string;
  topic: string;
  locality: string;
  publicUrl?: string | undefined;
  impressions?: number | undefined;
  clicks?: number | undefined;
  opportunityScore: number;
  sensitivityScore: number;
  recommendedAction?: string | undefined;
  status: string;
}

interface Inquiry {
  id: string;
  firstName: string;
  preferredContact: string;
  requestedNextStep: string;
  sourcePath: string;
  status: string;
  assignedTo?: string | undefined;
  createdAt: string;
}

interface RecoveryOutreachPayload {
  partners: Partner[];
  topics: PublicTopic[];
  inquiries: Inquiry[];
  counts?: {
    publicOrganizations: number;
    publicTopics: number;
    newInquiries: number;
    approvedPartners: number;
  };
}

type Tab = "overview" | "topics" | "partners" | "content" | "inquiries" | "policy";

const previewPayload: RecoveryOutreachPayload = {
  partners: [
    {
      id: "partner-1",
      organizationName: "Lowell-area public treatment resource",
      organizationType: "treatment_provider",
      publicUrl: "https://findtreatment.gov",
      locality: "Lowell, Massachusetts",
      partnershipStatus: "research",
      notes: "Public provider research only. No patient or referral data is imported.",
      verifiedPublicSourceAt: new Date().toISOString(),
    },
    {
      id: "partner-2",
      organizationName: "Massachusetts recovery-support resource",
      organizationType: "public_agency",
      publicUrl:
        "https://www.mass.gov/info-details/resources-for-substance-use-disorder-treatment-recovery-services",
      locality: "Massachusetts",
      partnershipStatus: "approved_for_contact",
      notes: "Potential resource link for the public recovery-support page.",
      verifiedPublicSourceAt: new Date().toISOString(),
    },
  ],
  topics: [
    {
      id: "topic-1",
      sourceKind: "aggregate_search",
      topic: "Christian recovery support near Lowell",
      locality: "Lowell, Massachusetts",
      impressions: 140,
      clicks: 6,
      opportunityScore: 91,
      sensitivityScore: 74,
      recommendedAction:
        "Improve the public recovery-support page and provide a voluntary, non-diagnostic conversation request.",
      status: "review",
    },
    {
      id: "topic-2",
      sourceKind: "public_web",
      topic: "Where can families find recovery resources in Massachusetts?",
      locality: "Massachusetts",
      publicUrl: "https://www.mass.gov/",
      opportunityScore: 78,
      sensitivityScore: 68,
      recommendedAction:
        "Publish a sourced resource guide and avoid asking visitors to disclose private health information.",
      status: "content_queued",
    },
    {
      id: "topic-3",
      sourceKind: "public_forum",
      topic: "Looking for a sober community that respects Christian faith",
      locality: "Greater Lowell",
      publicUrl: "https://example.invalid/public-recovery-question",
      opportunityScore: 84,
      sensitivityScore: 82,
      recommendedAction:
        "Human review only. A transparent response may link to public ministry information without diagnosing or contacting the author privately.",
      status: "new",
    },
  ],
  inquiries: [
    {
      id: "inquiry-1",
      firstName: "Public Visitor",
      preferredContact: "email",
      requestedNextStep: "talk_to_leader",
      sourcePath: "/recovery-support-lowell",
      status: "new",
      createdAt: new Date(Date.now() - 45 * 60_000).toISOString(),
    },
  ],
  counts: {
    publicOrganizations: 2,
    publicTopics: 3,
    newInquiries: 1,
    approvedPartners: 0,
  },
};

const storageKey = "outreach-recovery-showcase-v1";
const nextStepLabels: Record<string, string> = {
  attend_group: "Ask about attending the group",
  talk_to_leader: "Private leader conversation",
  online_option: "Online option",
  treatment_resources: "Public treatment resources",
  general_question: "General question",
};

export function RecoveryOutreachWorkspace({ mode }: { mode: "showcase" | "live" }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [payload, setPayload] = useState<RecoveryOutreachPayload>(previewPayload);
  const [loading, setLoading] = useState(mode === "live");
  const [notice, setNotice] = useState("");
  const [topicQuery, setTopicQuery] = useState("");
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(
    previewPayload.inquiries[0]?.id ?? null,
  );

  const refreshLive = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/recovery-outreach", { cache: "no-store" });
      const result = (await response.json()) as RecoveryOutreachPayload & { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Recovery Outreach could not be loaded.");
      setPayload(result);
      setSelectedInquiryId(result.inquiries[0]?.id ?? null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Recovery Outreach could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (mode === "showcase") {
        const stored = window.localStorage.getItem(storageKey);
        if (!stored) return;

        try {
          const parsed = JSON.parse(stored) as RecoveryOutreachPayload;
          if (
            Array.isArray(parsed.partners) &&
            Array.isArray(parsed.topics) &&
            Array.isArray(parsed.inquiries)
          ) {
            setPayload(parsed);
            setSelectedInquiryId(parsed.inquiries[0]?.id ?? null);
          }
        } catch {
          window.localStorage.removeItem(storageKey);
        }
        return;
      }

      void refreshLive();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [mode, refreshLive]);

  useEffect(() => {
    if (mode !== "showcase") return;
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [mode, payload]);

  async function sendLive(action: string, values: Record<string, unknown>) {
    const response = await fetch("/api/recovery-outreach", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, ...values }),
    });
    const result = (await response.json()) as { message?: string };
    if (!response.ok) throw new Error(result.message ?? "The action could not be completed.");
    await refreshLive();
  }

  const visibleTopics = useMemo(() => {
    const normalized = topicQuery.trim().toLowerCase();
    if (!normalized) return payload.topics;
    return payload.topics.filter((topic) =>
      `${topic.topic} ${topic.locality} ${topic.sourceKind} ${topic.recommendedAction ?? ""}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [payload.topics, topicQuery]);

  const selectedInquiry =
    payload.inquiries.find((inquiry) => inquiry.id === selectedInquiryId) ??
    payload.inquiries[0] ??
    null;

  async function addPartner(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const partner: Partner = {
      id: crypto.randomUUID(),
      organizationName: String(data.get("organizationName") ?? "").trim(),
      organizationType: String(data.get("organizationType") ?? "other"),
      publicUrl: String(data.get("publicUrl") ?? "").trim(),
      publicContact: String(data.get("publicContact") ?? "").trim() || undefined,
      locality: String(data.get("locality") ?? "Lowell, Massachusetts").trim(),
      partnershipStatus: "research",
      notes: String(data.get("notes") ?? "").trim() || undefined,
      verifiedPublicSourceAt: new Date().toISOString(),
    };
    try {
      if (mode === "showcase") {
        setPayload((current) => ({ ...current, partners: [partner, ...current.partners] }));
      } else {
        await sendLive("add_partner", partner as unknown as Record<string, unknown>);
      }
      event.currentTarget.reset();
      setNotice(
        "The public organization was added to the research queue. No patient or member data was imported.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The organization could not be added.");
    }
  }

  async function updatePartner(partner: Partner, status: string) {
    try {
      if (mode === "showcase") {
        setPayload((current) => ({
          ...current,
          partners: current.partners.map((row) =>
            row.id === partner.id ? { ...row, partnershipStatus: status } : row,
          ),
        }));
      } else {
        await sendLive("update_partner", { partnerId: partner.id, partnershipStatus: status });
      }
      setNotice("Partnership status updated. Contact remains a human-led church decision.");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "The partner status could not be updated.",
      );
    }
  }

  async function addTopic(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const topic: PublicTopic = {
      id: crypto.randomUUID(),
      sourceKind: String(data.get("sourceKind") ?? "aggregate_search"),
      topic: String(data.get("topic") ?? "").trim(),
      locality: String(data.get("locality") ?? "Lowell, Massachusetts").trim(),
      publicUrl: String(data.get("publicUrl") ?? "").trim() || undefined,
      impressions: Number(data.get("impressions") || 0) || undefined,
      clicks: Number(data.get("clicks") || 0) || undefined,
      opportunityScore: Math.max(0, Math.min(100, Number(data.get("opportunityScore") || 0))),
      sensitivityScore: Math.max(0, Math.min(100, Number(data.get("sensitivityScore") || 0))),
      recommendedAction: String(data.get("recommendedAction") ?? "").trim() || undefined,
      status: "new",
    };
    try {
      if (mode === "showcase") {
        setPayload((current) => ({ ...current, topics: [topic, ...current.topics] }));
      } else {
        await sendLive("add_topic", topic as unknown as Record<string, unknown>);
      }
      event.currentTarget.reset();
      setNotice("The public or aggregate topic was added for human review.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The topic could not be added.");
    }
  }

  async function updateInquiry(inquiry: Inquiry, status: string) {
    try {
      if (mode === "showcase") {
        setPayload((current) => ({
          ...current,
          inquiries: current.inquiries.map((row) =>
            row.id === inquiry.id ? { ...row, status } : row,
          ),
        }));
      } else {
        await sendLive("update_inquiry", { inquiryId: inquiry.id, status });
      }
      setNotice("The voluntary inquiry status was updated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The inquiry could not be updated.");
    }
  }

  function resetShowcase() {
    setPayload(previewPayload);
    window.localStorage.removeItem(storageKey);
    setSelectedInquiryId(previewPayload.inquiries[0]?.id ?? null);
    setNotice("Recovery Outreach showcase restored.");
  }

  const counts = payload.counts ?? {
    publicOrganizations: payload.partners.length,
    publicTopics: payload.topics.length,
    newInquiries: payload.inquiries.filter((inquiry) => inquiry.status === "new").length,
    approvedPartners: payload.partners.filter((partner) => partner.partnershipStatus === "partner")
      .length,
  };

  return (
    <div className="recovery-outreach-workspace">
      <section className="recovery-outreach-hero">
        <div>
          <p>Public and aggregate recovery-support intelligence</p>
          <h2>Help people find responsible support without profiling private lives.</h2>
          <span>
            Research public organizations, aggregate search questions, public content gaps, approved
            partnerships, and voluntary website inquiries. Never infer that a named person has an
            addiction or expose Church Hub recovery participation.
          </span>
        </div>
        <strong>↺</strong>
      </section>

      <div className="recovery-outreach-metrics">
        <article>
          <span>Public organizations</span>
          <strong>{counts.publicOrganizations}</strong>
          <small>Research and approved partners only</small>
        </article>
        <article>
          <span>Public topics</span>
          <strong>{counts.publicTopics}</strong>
          <small>Aggregate or genuinely public sources</small>
        </article>
        <article>
          <span>New inquiries</span>
          <strong>{counts.newInquiries}</strong>
          <small>Voluntary forms, not identified searchers</small>
        </article>
        <article>
          <span>Active partnerships</span>
          <strong>{counts.approvedPartners}</strong>
          <small>Church-approved relationships</small>
        </article>
      </div>

      <nav className="recovery-outreach-tabs" aria-label="Recovery Outreach sections">
        {(
          [
            ["overview", "Overview"],
            ["topics", "Public needs"],
            ["partners", "Partners"],
            ["content", "Content plan"],
            ["inquiries", "Inquiries"],
            ["policy", "Policy gate"],
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
        <p className="recovery-outreach-notice" role="status">
          {notice}
        </p>
      ) : null}
      {loading ? (
        <p className="recovery-outreach-empty">Loading connected recovery intelligence…</p>
      ) : null}

      {!loading && tab === "overview" ? (
        <section className="recovery-overview-grid">
          <article>
            <h3>What the workstation can find</h3>
            <ul>
              <li>Aggregate Search Console queries and landing-page gaps</li>
              <li>Public treatment and recovery-support organizations</li>
              <li>Publicly accessible recovery questions where platform terms permit review</li>
              <li>Voluntary conversation and resource requests from the public website</li>
              <li>Content opportunities for accurate, sourced recovery-support information</li>
            </ul>
          </article>
          <article>
            <h3>What it must never create</h3>
            <ul>
              <li>An individual addiction or vulnerability score</li>
              <li>A list of private Google searchers</li>
              <li>A scraped private recovery-group directory</li>
              <li>An advertising audience based on treatment or recovery interest</li>
              <li>A connection between Church Hub recovery membership and Outreach data</li>
            </ul>
          </article>
          <article className="recovery-daily-actions">
            <h3>Today’s human-review queue</h3>
            {payload.topics.slice(0, 3).map((topic) => (
              <p key={topic.id}>
                <strong>{topic.opportunityScore}</strong>
                <span>{topic.topic}</span>
              </p>
            ))}
          </article>
        </section>
      ) : null}

      {!loading && tab === "topics" ? (
        <section className="recovery-outreach-panel">
          <div className="recovery-topic-toolbar">
            <input
              value={topicQuery}
              onChange={(event) => setTopicQuery(event.target.value)}
              placeholder="Search aggregate or public topics…"
            />
          </div>
          <div className="recovery-topic-layout">
            <div className="recovery-topic-list">
              {visibleTopics.map((topic) => (
                <article key={topic.id}>
                  <div>
                    <span>{topic.sourceKind.replaceAll("_", " ")}</span>
                    <b>Priority {topic.opportunityScore}</b>
                  </div>
                  <h3>{topic.topic}</h3>
                  <p>{topic.locality}</p>
                  {typeof topic.impressions === "number" ? (
                    <small>
                      {topic.impressions} aggregate impressions · {topic.clicks ?? 0} clicks
                    </small>
                  ) : null}
                  <blockquote>{topic.recommendedAction ?? "Awaiting human review."}</blockquote>
                  {topic.publicUrl ? (
                    <a href={topic.publicUrl} target="_blank" rel="noreferrer">
                      Open public source ↗
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
            <form className="recovery-outreach-form" onSubmit={(event) => void addTopic(event)}>
              <h3>Add public or aggregate evidence</h3>
              <label>
                Source
                <select name="sourceKind" defaultValue="aggregate_search">
                  <option value="aggregate_search">Aggregate search</option>
                  <option value="public_forum">Public forum</option>
                  <option value="public_web">Public web</option>
                  <option value="public_rss">Public RSS</option>
                  <option value="community_partner">Community partner</option>
                </select>
              </label>
              <label>
                Topic
                <input name="topic" required maxLength={300} />
              </label>
              <label>
                Locality
                <input name="locality" defaultValue="Lowell, Massachusetts" required />
              </label>
              <label>
                Public URL
                <input name="publicUrl" type="url" />
              </label>
              <label>
                Aggregate impressions
                <input name="impressions" type="number" min={0} />
              </label>
              <label>
                Aggregate clicks
                <input name="clicks" type="number" min={0} />
              </label>
              <label>
                Opportunity 0–100
                <input name="opportunityScore" type="number" min={0} max={100} defaultValue={50} />
              </label>
              <label>
                Sensitivity 0–100
                <input name="sensitivityScore" type="number" min={0} max={100} defaultValue={70} />
              </label>
              <label>
                Recommended action
                <textarea name="recommendedAction" rows={4} maxLength={2000} />
              </label>
              <button type="submit">Queue for review</button>
            </form>
          </div>
        </section>
      ) : null}

      {!loading && tab === "partners" ? (
        <section className="recovery-outreach-panel recovery-partner-layout">
          <div className="recovery-partner-list">
            {payload.partners.map((partner) => (
              <article key={partner.id}>
                <header>
                  <span>{partner.organizationType.replaceAll("_", " ")}</span>
                  <b>{partner.partnershipStatus.replaceAll("_", " ")}</b>
                </header>
                <h3>{partner.organizationName}</h3>
                <p>{partner.locality}</p>
                {partner.notes ? <blockquote>{partner.notes}</blockquote> : null}
                <a href={partner.publicUrl} target="_blank" rel="noreferrer">
                  Verify public organization ↗
                </a>
                <select
                  value={partner.partnershipStatus}
                  onChange={(event) => void updatePartner(partner, event.target.value)}
                >
                  <option value="research">Research</option>
                  <option value="approved_for_contact">Approved for contact</option>
                  <option value="contacted">Contacted</option>
                  <option value="conversation">Conversation</option>
                  <option value="partner">Partner</option>
                  <option value="declined">Declined</option>
                  <option value="do_not_contact">Do not contact</option>
                </select>
              </article>
            ))}
          </div>
          <form className="recovery-outreach-form" onSubmit={(event) => void addPartner(event)}>
            <h3>Add a public organization</h3>
            <label>
              Name
              <input name="organizationName" required maxLength={180} />
            </label>
            <label>
              Type
              <select name="organizationType" defaultValue="recovery_support">
                <option value="treatment_provider">Treatment provider</option>
                <option value="recovery_support">Recovery support</option>
                <option value="community_health">Community health</option>
                <option value="sober_living">Sober living</option>
                <option value="public_agency">Public agency</option>
                <option value="church">Church</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>
              Public website
              <input name="publicUrl" type="url" required />
            </label>
            <label>
              Public contact
              <input name="publicContact" maxLength={300} />
            </label>
            <label>
              Locality
              <input name="locality" defaultValue="Lowell, Massachusetts" required />
            </label>
            <label>
              Research note
              <textarea name="notes" rows={4} maxLength={2000} />
            </label>
            <button type="submit">Add research record</button>
          </form>
        </section>
      ) : null}

      {!loading && tab === "content" ? (
        <section className="recovery-outreach-panel recovery-content-plan">
          <article>
            <span>01</span>
            <div>
              <strong>Public recovery-support page</strong>
              <p>
                Answer location, privacy, meeting, church-ministry, and treatment-boundary questions
                using approved facts.
              </p>
            </div>
          </article>
          <article>
            <span>02</span>
            <div>
              <strong>Professional resource guide</strong>
              <p>
                Link to current public government and licensed-treatment resources without ranking
                providers as clinical recommendations.
              </p>
            </div>
          </article>
          <article>
            <span>03</span>
            <div>
              <strong>Questions people ask before reaching out</strong>
              <p>
                Explain confidentiality, voluntary participation, cost, church attendance, online
                options, and what information is not required.
              </p>
            </div>
          </article>
          <article>
            <span>04</span>
            <div>
              <strong>Partnership communication</strong>
              <p>
                Prepare transparent church outreach to public organizations only after a leader
                approves the organization and message.
              </p>
            </div>
          </article>
          <article>
            <span>05</span>
            <div>
              <strong>AI visibility checks</strong>
              <p>
                Check whether public answer systems find accurate church and treatment-boundary
                information. Never guarantee placement.
              </p>
            </div>
          </article>
        </section>
      ) : null}

      {!loading && tab === "inquiries" ? (
        <section className="recovery-inquiry-layout">
          <div className="recovery-inquiry-list">
            {payload.inquiries.map((inquiry) => (
              <button
                type="button"
                key={inquiry.id}
                className={selectedInquiry?.id === inquiry.id ? "active" : ""}
                onClick={() => setSelectedInquiryId(inquiry.id)}
              >
                <span>{inquiry.firstName.slice(0, 1)}</span>
                <div>
                  <strong>{inquiry.firstName}</strong>
                  <small>
                    {nextStepLabels[inquiry.requestedNextStep] ?? inquiry.requestedNextStep} ·{" "}
                    {inquiry.status}
                  </small>
                </div>
              </button>
            ))}
            {!payload.inquiries.length ? (
              <p className="recovery-outreach-empty">
                No voluntary recovery inquiries have been submitted.
              </p>
            ) : null}
          </div>
          <article className="recovery-inquiry-detail">
            {selectedInquiry ? (
              <>
                <span>VOLUNTARY PUBLIC REQUEST</span>
                <h3>{selectedInquiry.firstName}</h3>
                <dl>
                  <div>
                    <dt>Requested next step</dt>
                    <dd>
                      {nextStepLabels[selectedInquiry.requestedNextStep] ??
                        selectedInquiry.requestedNextStep}
                    </dd>
                  </div>
                  <div>
                    <dt>Contact preference</dt>
                    <dd>{selectedInquiry.preferredContact}</dd>
                  </div>
                  <div>
                    <dt>Source</dt>
                    <dd>{selectedInquiry.sourcePath}</dd>
                  </div>
                  <div>
                    <dt>Submitted</dt>
                    <dd>{new Date(selectedInquiry.createdAt).toLocaleString()}</dd>
                  </div>
                </dl>
                <div>
                  <button
                    type="button"
                    onClick={() => void updateInquiry(selectedInquiry, "assigned")}
                  >
                    Assign
                  </button>
                  <button
                    type="button"
                    onClick={() => void updateInquiry(selectedInquiry, "contacted")}
                  >
                    Record contact
                  </button>
                  <button
                    type="button"
                    onClick={() => void updateInquiry(selectedInquiry, "closed")}
                  >
                    Close
                  </button>
                </div>
                <p>
                  The Outreach OS deliberately does not show a diagnosis, substance, sobriety date,
                  medication, treatment history, or inferred risk score.
                </p>
              </>
            ) : (
              <p>Choose an inquiry.</p>
            )}
          </article>
        </section>
      ) : null}

      {!loading && tab === "policy" ? (
        <section className="recovery-policy-grid">
          <article>
            <strong>Allowed intelligence</strong>
            <ul>
              <li>Aggregate Search Console queries</li>
              <li>Publicly accessible pages and discussions</li>
              <li>Public organization websites and contact information</li>
              <li>Voluntary website requests</li>
              <li>Page quality, indexing, and factual-accuracy checks</li>
            </ul>
          </article>
          <article>
            <strong>Prohibited intelligence</strong>
            <ul>
              <li>Private searcher identity</li>
              <li>Scraped treatment patients or private groups</li>
              <li>Inferred addiction, relapse, or vulnerability</li>
              <li>Recovery-member advertising audiences</li>
              <li>Hub recovery posts, progress, attendance, or membership</li>
            </ul>
          </article>
          <article>
            <strong>Human approvals</strong>
            <ul>
              <li>Partner outreach</li>
              <li>Public replies</li>
              <li>Recovery ministry claims</li>
              <li>Curriculum naming and licensing</li>
              <li>Campaign targeting and conversion definitions</li>
            </ul>
          </article>
          {mode === "showcase" ? (
            <button type="button" onClick={resetShowcase}>
              Reset Recovery Outreach showcase
            </button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
