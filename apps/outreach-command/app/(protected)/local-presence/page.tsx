import { dateTime, EmptyLiveData, LiveDataNotice, text } from "@/components/live-data-ui";
import { PageHeading } from "@/components/page-heading";
import { loadLocalPresenceRows, outreachBackendConfigured } from "@/lib/live-intelligence";

export default async function LocalPresencePage() {
  const { locations, templates, overrides, visibilityChecks } = await loadLocalPresenceRows();
  return (
    <>
      <PageHeading
        eyebrow="One authoritative public identity"
        title="Local Presence"
        description="Protect the approved church name, Sunday time, rented meeting venue, address, directions, accessibility, public events, and AI/search facts from conflicting copies."
      />
      <LiveDataNotice title="Rented venue governance">
        <p>
          Butler Middle School must be described as the current meeting location, not as
          church-owned property or a permanently staffed office.
        </p>
      </LiveDataNotice>
      {!outreachBackendConfigured() ? (
        <EmptyLiveData
          title="Canonical records are not connected"
          description="Connect the production database before publishing local facts or evaluating Business Profile eligibility."
        />
      ) : (
        <div className="section-grid" style={{ marginTop: 18 }}>
          <section className="panel">
            <div className="panel__header">
              <div>
                <h2>Approved locations</h2>
                <p>{locations.length} stored records</p>
              </div>
            </div>
            <div className="panel__body live-list">
              {locations.map((row) => (
                <article key={text(row.id)}>
                  <div>
                    <strong>{text(row.name)}</strong>
                    <span>
                      {text(row.address_line1)} · {text(row.city)}, {text(row.region)}{" "}
                      {text(row.postal_code)}
                    </span>
                  </div>
                  <small>{text(row.venue_relationship ?? row.kind ?? "Meeting location")}</small>
                </article>
              ))}
              {!locations.length ? <p>No approved location is stored.</p> : null}
            </div>
          </section>
          <section className="panel">
            <div className="panel__header">
              <div>
                <h2>Service templates and overrides</h2>
                <p>One source of truth for Sunday information</p>
              </div>
            </div>
            <div className="panel__body live-list">
              {templates.map((row) => (
                <article key={text(row.id)}>
                  <div>
                    <strong>{text(row.title)}</strong>
                    <span>
                      Weekday {text(row.weekday)} · {text(row.local_time)} · {text(row.timezone)}
                    </span>
                  </div>
                  <small>{text(row.status)}</small>
                </article>
              ))}
              {overrides.slice(0, 10).map((row) => (
                <article key={text(row.id)}>
                  <div>
                    <strong>{text(row.title)}</strong>
                    <span>
                      {text(row.date)} · {text(row.kind)} · {text(row.public_message)}
                    </span>
                  </div>
                </article>
              ))}
              {!templates.length && !overrides.length ? <p>No schedule source is stored.</p> : null}
            </div>
          </section>
          <section className="panel" style={{ gridColumn: "1 / -1" }}>
            <div className="panel__header">
              <div>
                <h2>AI visibility factual checks</h2>
                <p>{visibilityChecks.length} approved public prompt results</p>
              </div>
            </div>
            <div className="search-table-wrap">
              {visibilityChecks.length ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Prompt</th>
                      <th>Mentioned</th>
                      <th>Facts accurate</th>
                      <th>Coverage</th>
                      <th>Gap</th>
                      <th>Checked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibilityChecks.map((row, index) => (
                      <tr key={`${text(row.prompt)}-${index}`}>
                        <td>{text(row.prompt)}</td>
                        <td>
                          {row.church_mentioned === true
                            ? "Yes"
                            : row.church_mentioned === false
                              ? "No"
                              : "Unknown"}
                        </td>
                        <td>
                          {row.facts_accurate === true
                            ? "Yes"
                            : row.facts_accurate === false
                              ? "No"
                              : "Not reviewed"}
                        </td>
                        <td>{text(row.coverage_score)}</td>
                        <td>{text(row.content_gap)}</td>
                        <td>{dateTime(row.checked_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="panel__body">No approved AI visibility check has been stored.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
