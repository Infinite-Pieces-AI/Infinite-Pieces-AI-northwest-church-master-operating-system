import {
  dateTime,
  EmptyLiveData,
  LiveDataNotice,
  statusClass,
  text,
} from "@/components/live-data-ui";
import { PageHeading } from "@/components/page-heading";
import { loadRadarSignals, outreachBackendConfigured } from "@/lib/live-intelligence";

export default async function RadarPage() {
  const signals = await loadRadarSignals();
  return (
    <>
      <PageHeading
        eyebrow="Approved public-source intelligence"
        title="Command Radar"
        description="Review public questions and community discussions imported through approved APIs or public feeds. Private groups, direct messages, login bypass, and individual religious dossiers are prohibited."
      />
      <LiveDataNotice title="Human outreach only">
        <p>
          Radar may recommend a response or content action. It never contacts a person or publishes
          on its own.
        </p>
      </LiveDataNotice>
      {!outreachBackendConfigured() ? (
        <EmptyLiveData
          title="No production data connection"
          description="Configure an approved public-source connector. The Radar remains empty rather than generating fictional public posts."
          href="/source-control"
          action="Open Source Control"
        />
      ) : !signals.length ? (
        <EmptyLiveData
          title="No approved public signal is currently stored"
          description="A source must be genuinely public, terms-approved, allowlisted, and imported by a server-side worker."
          href="/source-control"
          action="Review connectors"
        />
      ) : (
        <section className="panel" style={{ marginTop: 18 }}>
          <div className="panel__header">
            <div>
              <h2>Public opportunity stream</h2>
              <p>{signals.length} time-bounded records</p>
            </div>
          </div>
          <div className="search-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Public question</th>
                  <th>Source</th>
                  <th>Local / church intent</th>
                  <th>Risk</th>
                  <th>Status</th>
                  <th>Published</th>
                </tr>
              </thead>
              <tbody>
                {signals.map((row) => (
                  <tr key={text(row.id)}>
                    <td>
                      <strong>{text(row.priority_score)}</strong>
                    </td>
                    <td>
                      <strong>{text(row.title)}</strong>
                      <small>{text(row.excerpt)}</small>
                      <small>{text(row.recommendation)}</small>
                    </td>
                    <td>
                      {text(row.source_label)}
                      <br />
                      <small>
                        {text(row.source_kind)} · {text(row.locality)}
                      </small>
                    </td>
                    <td>
                      {text(row.local_relevance)} / {text(row.church_intent)}
                    </td>
                    <td>{text(row.risk_sensitivity)}</td>
                    <td>
                      <span className={statusClass(row.status)}>{text(row.status)}</span>
                    </td>
                    <td>{dateTime(row.published_at ?? row.ingested_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
