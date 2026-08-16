import { dateTime, EmptyLiveData, LiveDataNotice, text } from "@/components/live-data-ui";
import { PageHeading } from "@/components/page-heading";
import { loadGrowthRows, outreachBackendConfigured } from "@/lib/live-intelligence";

export default async function GrowthPage() {
  const { funnels, channels, conversions } = await loadGrowthRows();
  return (
    <>
      <PageHeading
        eyebrow="Meaningful voluntary actions"
        title="Growth Intelligence"
        description="Measure public discovery through directions, visit requests, events, Bible conversations, online conversations, and consented follow-up—not private Hub behavior or inferred religious intensity."
      />
      <LiveDataNotice title="Privacy incidents outweigh traffic gains">
        <p>
          Prayer content, child data, counseling, safeguarding, and private member activity are
          excluded from marketing analytics.
        </p>
      </LiveDataNotice>
      {!outreachBackendConfigured() ? (
        <EmptyLiveData
          title="Analytics are not connected"
          description="Configure aggregate public-site analytics and conversion-event ingestion. The dashboard remains empty rather than inventing growth."
        />
      ) : (
        <div className="section-grid" style={{ marginTop: 18 }}>
          <section className="panel">
            <div className="panel__header">
              <div>
                <h2>Funnel snapshots</h2>
                <p>{funnels.length} aggregate stages</p>
              </div>
            </div>
            <div className="panel__body live-list">
              {funnels.map((row, index) => (
                <article key={`${text(row.snapshot_date)}-${text(row.stage_key)}-${index}`}>
                  <div>
                    <strong>{text(row.stage_label)}</strong>
                    <span>
                      {text(row.funnel_key)} · {text(row.source_system)}
                    </span>
                  </div>
                  <b>{text(row.aggregate_value)}</b>
                </article>
              ))}
              {!funnels.length ? <p>No funnel snapshot has been imported.</p> : null}
            </div>
          </section>
          <section className="panel">
            <div className="panel__header">
              <div>
                <h2>Channel attribution</h2>
                <p>{channels.length} aggregate channel rows</p>
              </div>
            </div>
            <div className="panel__body live-list">
              {channels.map((row, index) => (
                <article key={`${text(row.snapshot_date)}-${text(row.channel_key)}-${index}`}>
                  <div>
                    <strong>{text(row.channel_label)}</strong>
                    <span>
                      {text(row.aggregate_visits)} visits · {text(row.aggregate_conversions)}{" "}
                      conversions
                    </span>
                  </div>
                  <small>{text(row.source_system)}</small>
                </article>
              ))}
              {!channels.length ? <p>No channel-attribution snapshot has been imported.</p> : null}
            </div>
          </section>
          <section className="panel" style={{ gridColumn: "1 / -1" }}>
            <div className="panel__header">
              <div>
                <h2>Recent public conversion events</h2>
                <p>{conversions.length} stored events</p>
              </div>
            </div>
            <div className="panel__body live-list">
              {conversions.slice(0, 50).map((row, index) => (
                <article key={`${text(row.event_name)}-${index}`}>
                  <div>
                    <strong>{text(row.event_name)}</strong>
                    <span>{text(row.source_path)}</span>
                  </div>
                  <small>{dateTime(row.occurred_at)}</small>
                </article>
              ))}
              {!conversions.length ? <p>No public conversion event has been recorded.</p> : null}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
