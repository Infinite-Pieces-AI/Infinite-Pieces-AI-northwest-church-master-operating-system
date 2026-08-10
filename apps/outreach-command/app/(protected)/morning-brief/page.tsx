import Link from "next/link";
import { dateTime, EmptyLiveData, LiveMetric, statusClass, text } from "@/components/live-data-ui";
import { PageHeading } from "@/components/page-heading";
import { loadMorningBrief, outreachBackendConfigured } from "@/lib/live-intelligence";

export default async function MorningBriefPage() {
  const brief = await loadMorningBrief();
  return (
    <>
      <PageHeading
        eyebrow="Daily human priorities"
        title="Morning Brief"
        description="A live, sourced queue of access requests, visitor follow-up, public signals, and search opportunities. Nothing here is generated as fake activity."
      />
      <div className="metric-grid">
        <LiveMetric
          label="Member access"
          value={brief.overview.pendingAccessRequests}
          detail="Requests awaiting review"
          tone="gold"
        />
        <LiveMetric
          label="Visitors"
          value={brief.overview.newVisitorRequests}
          detail="New voluntary follow-up records"
          tone="blue"
        />
        <LiveMetric
          label="Radar"
          value={brief.overview.radarSignals}
          detail="Current public-source signals"
          tone="green"
        />
        <LiveMetric
          label="Content"
          value={brief.overview.contentReviewItems}
          detail="Drafts awaiting human review"
          tone="rose"
        />
      </div>
      {!outreachBackendConfigured() ? (
        <EmptyLiveData
          title="No live backend connection"
          description="Connect Supabase and approved provider integrations. The Morning Brief intentionally remains empty rather than inventing activity."
          href="/production-readiness"
          action="Review production readiness"
        />
      ) : (
        <div className="section-grid">
          <section className="panel">
            <div className="panel__header">
              <div>
                <h2>Newest member access requests</h2>
                <p>Invitation review remains a human decision.</p>
              </div>
              <Link href="/member-access">Open queue →</Link>
            </div>
            <div className="panel__body">
              {brief.newestAccessRequests.length ? (
                <div className="live-list">
                  {brief.newestAccessRequests.map((row) => (
                    <article key={text(row.id)}>
                      <div>
                        <strong>
                          {text(row.first_name)} {text(row.last_name, "")}
                        </strong>
                        <span>
                          {text(row.email)} · {dateTime(row.created_at)}
                        </span>
                      </div>
                      <span className={statusClass(row.status)}>{text(row.status)}</span>
                    </article>
                  ))}
                </div>
              ) : (
                <p>No access request currently needs review.</p>
              )}
            </div>
          </section>
          <section className="panel">
            <div className="panel__header">
              <div>
                <h2>Highest-priority public signals</h2>
                <p>Public sources and approved connectors only.</p>
              </div>
              <Link href="/radar">Open Radar →</Link>
            </div>
            <div className="panel__body">
              {brief.topRadar.length ? (
                <div className="live-list">
                  {brief.topRadar.map((row) => (
                    <article key={text(row.id)}>
                      <div>
                        <strong>{text(row.title)}</strong>
                        <span>
                          {text(row.source_label)} · Priority {text(row.priority_score)}
                        </span>
                      </div>
                      <span className={statusClass(row.status)}>{text(row.status)}</span>
                    </article>
                  ))}
                </div>
              ) : (
                <p>No approved public-source signal currently needs review.</p>
              )}
            </div>
          </section>
          <section className="panel">
            <div className="panel__header">
              <div>
                <h2>Search opportunities</h2>
                <p>Aggregate queries; never individual searcher identities.</p>
              </div>
              <Link href="/search-intelligence">Open search intelligence →</Link>
            </div>
            <div className="panel__body">
              {brief.topSearch.length ? (
                <div className="live-list">
                  {brief.topSearch.map((row, index) => (
                    <article key={`${text(row.query)}-${index}`}>
                      <div>
                        <strong>{text(row.query)}</strong>
                        <span>
                          {text(row.recommended_action)} · Score {text(row.opportunity_score)}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p>No keyword opportunity has been imported yet.</p>
              )}
            </div>
          </section>
          <section className="panel">
            <div className="panel__header">
              <div>
                <h2>Newest visitors</h2>
                <p>Records begin only after voluntary form submission.</p>
              </div>
              <Link href="/visitor-crm">Open visitor CRM →</Link>
            </div>
            <div className="panel__body">
              {brief.newestVisitors.length ? (
                <div className="live-list">
                  {brief.newestVisitors.map((row) => (
                    <article key={text(row.id)}>
                      <div>
                        <strong>
                          {text(row.first_name)} {text(row.last_name, "")}
                        </strong>
                        <span>
                          {text(row.requested_next_step)} · {dateTime(row.created_at)}
                        </span>
                      </div>
                      <span className={statusClass(row.status)}>{text(row.status)}</span>
                    </article>
                  ))}
                </div>
              ) : (
                <p>No new voluntary visitor request is waiting.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
