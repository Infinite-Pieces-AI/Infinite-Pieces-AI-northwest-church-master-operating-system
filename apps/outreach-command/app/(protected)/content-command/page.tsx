import {
  dateTime,
  EmptyLiveData,
  LiveDataNotice,
  statusClass,
  text,
} from "@/components/live-data-ui";
import { PageHeading } from "@/components/page-heading";
import { loadContentRows, outreachBackendConfigured } from "@/lib/live-intelligence";

export default async function ContentCommandPage() {
  const { briefs, actions, socialDrafts } = await loadContentRows();
  return (
    <>
      <PageHeading
        eyebrow="AI-assisted, human-approved"
        title="Content Command"
        description="Manage real content briefs, public-response drafts, and social drafts created from approved facts and public needs. Generated content cannot publish itself."
      />
      <LiveDataNotice title="Approval is version-specific">
        <p>
          A named reviewer must verify facts, theology when applicable, audience, consent, and the
          exact final text before publication.
        </p>
      </LiveDataNotice>
      {!outreachBackendConfigured() ? (
        <EmptyLiveData
          title="Content workflow is not connected"
          description="Connect Supabase and the approved AI/content provider. The queue remains empty rather than showing fictional drafts."
        />
      ) : (
        <div className="section-grid" style={{ marginTop: 18 }}>
          <section className="panel">
            <div className="panel__header">
              <div>
                <h2>Content briefs</h2>
                <p>{briefs.length} current records</p>
              </div>
            </div>
            <div className="panel__body live-list">
              {briefs.map((row) => (
                <article key={text(row.id)}>
                  <div>
                    <strong>{text(row.title)}</strong>
                    <span>
                      {text(row.content_type)} · {text(row.intended_audience)}
                    </span>
                  </div>
                  <span className={statusClass(row.status)}>{text(row.status)}</span>
                </article>
              ))}
              {!briefs.length ? <p>No content brief is waiting.</p> : null}
            </div>
          </section>
          <section className="panel">
            <div className="panel__header">
              <div>
                <h2>Public-conversation actions</h2>
                <p>{actions.length} review-controlled actions</p>
              </div>
            </div>
            <div className="panel__body live-list">
              {actions.map((row) => (
                <article key={text(row.id)}>
                  <div>
                    <strong>{text(row.action_type)}</strong>
                    <span>
                      {text(row.rationale)} · Updated {dateTime(row.updated_at)}
                    </span>
                  </div>
                  <span className={statusClass(row.status)}>{text(row.status)}</span>
                </article>
              ))}
              {!actions.length ? <p>No public response or content action is waiting.</p> : null}
            </div>
          </section>
          <section className="panel" style={{ gridColumn: "1 / -1" }}>
            <div className="panel__header">
              <div>
                <h2>Social publication queue</h2>
                <p>{socialDrafts.length} real drafts</p>
              </div>
            </div>
            <div className="search-table-wrap">
              {socialDrafts.length ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Platform</th>
                      <th>Status</th>
                      <th>Approved</th>
                      <th>Scheduled</th>
                      <th>Published</th>
                    </tr>
                  </thead>
                  <tbody>
                    {socialDrafts.map((row) => (
                      <tr key={text(row.id)}>
                        <td>{text(row.platform)}</td>
                        <td>
                          <span className={statusClass(row.status)}>{text(row.status)}</span>
                        </td>
                        <td>{dateTime(row.approved_at)}</td>
                        <td>{dateTime(row.scheduled_for)}</td>
                        <td>{dateTime(row.published_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="panel__body">No social draft is waiting.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
