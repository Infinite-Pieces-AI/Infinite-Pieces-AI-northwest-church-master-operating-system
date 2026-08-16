import { dateTime, EmptyLiveData, LiveDataNotice, text } from "@/components/live-data-ui";
import { PageHeading } from "@/components/page-heading";
import { loadSearchRows, outreachBackendConfigured } from "@/lib/live-intelligence";

export default async function SearchIntelligencePage() {
  const { opportunities, snapshots, visibilityChecks } = await loadSearchRows();
  return (
    <>
      <PageHeading
        eyebrow="Aggregate SEO and AI visibility"
        title="Search Intelligence"
        description="Use aggregate query, page, click, impression, position, and public answer-engine evidence to improve useful church pages. This system cannot identify an individual searcher."
      />
      <LiveDataNotice title="Search Console is aggregate">
        <p>
          Every recommendation must show its source, date range, inputs, and human-approved next
          action.
        </p>
      </LiveDataNotice>
      {!outreachBackendConfigured() ? (
        <EmptyLiveData
          title="Search data is not connected"
          description="Connect the church-owned Search Console property and analytics system. No rankings or traffic are fabricated."
          href="/production-readiness"
          action="Review configuration"
        />
      ) : (
        <>
          <section className="panel" style={{ marginTop: 18 }}>
            <div className="panel__header">
              <div>
                <h2>Keyword and page opportunities</h2>
                <p>{opportunities.length} scored aggregate opportunities</p>
              </div>
            </div>
            <div className="search-table-wrap">
              {opportunities.length ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Query</th>
                      <th>Page</th>
                      <th>Impressions</th>
                      <th>Clicks</th>
                      <th>Position</th>
                      <th>Score</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opportunities.map((row, index) => (
                      <tr key={`${text(row.query)}-${index}`}>
                        <td>
                          <strong>{text(row.query)}</strong>
                          <small>{text(row.locality)}</small>
                        </td>
                        <td>{text(row.existing_page_path ?? row.page_path)}</td>
                        <td>{text(row.impressions)}</td>
                        <td>{text(row.clicks)}</td>
                        <td>{text(row.average_position)}</td>
                        <td>{text(row.opportunity_score)}</td>
                        <td>{text(row.recommended_action)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyLiveData
                  title="No keyword opportunities have been calculated"
                  description="The Search Console sync and SEO intelligence workers must import and score real aggregate rows."
                />
              )}
            </div>
          </section>
          <div className="section-grid" style={{ marginTop: 18 }}>
            <section className="panel">
              <div className="panel__header">
                <div>
                  <h2>Latest Search Console rows</h2>
                  <p>{snapshots.length} imported rows</p>
                </div>
              </div>
              <div className="panel__body live-list">
                {snapshots.slice(0, 15).map((row, index) => (
                  <article key={`${text(row.query)}-${index}`}>
                    <div>
                      <strong>{text(row.query, "(query withheld by provider)")}</strong>
                      <span>
                        {text(row.page_path)} · {text(row.impressions)} impressions ·{" "}
                        {text(row.clicks)} clicks
                      </span>
                    </div>
                    <small>
                      {text(row.snapshot_date)} · Position {text(row.average_position)}
                    </small>
                  </article>
                ))}
                {!snapshots.length ? <p>No Search Console row has been imported.</p> : null}
              </div>
            </section>
            <section className="panel">
              <div className="panel__header">
                <div>
                  <h2>AI answer visibility evidence</h2>
                  <p>{visibilityChecks.length} public prompt checks</p>
                </div>
              </div>
              <div className="panel__body live-list">
                {visibilityChecks.slice(0, 15).map((row) => (
                  <article key={text(row.id)}>
                    <div>
                      <strong>{text(row.prompt)}</strong>
                      <span>
                        {text(row.content_gap)} · Coverage {text(row.coverage_score)}
                      </span>
                    </div>
                    <small>
                      {row.church_mentioned === true ? "Church mentioned" : "Church not confirmed"}{" "}
                      · {dateTime(row.checked_at)}
                    </small>
                  </article>
                ))}
                {!visibilityChecks.length ? <p>No approved AI visibility check has run.</p> : null}
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
