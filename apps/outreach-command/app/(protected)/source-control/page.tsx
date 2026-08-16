import {
  dateTime,
  EmptyLiveData,
  LiveDataNotice,
  statusClass,
  text,
} from "@/components/live-data-ui";
import { PageHeading } from "@/components/page-heading";
import { loadConnectorRows, outreachBackendConfigured } from "@/lib/live-intelligence";

export default async function SourceControlPage() {
  const connectors = await loadConnectorRows();
  return (
    <>
      <PageHeading
        eyebrow="Connectors, terms, allowlists, and shutoff"
        title="Source Control"
        description="Review the approved public-source, aggregate search, analytics, AI visibility, meeting, and publishing connectors that may enter Outreach Intelligence OS."
      />
      <LiveDataNotice title="Private-source prohibition">
        <p>
          Private groups, direct messages, login bypass, paywall bypass, anti-bot bypass, scraped
          contact lists, and private search histories are not allowed.
        </p>
      </LiveDataNotice>
      {!outreachBackendConfigured() ? (
        <EmptyLiveData
          title="Connector registry is not connected"
          description="Connect the production database and create church-owned connector records before enabling any worker."
        />
      ) : !connectors.length ? (
        <EmptyLiveData
          title="No connector has been registered"
          description="A connector requires an accountable owner, purpose, terms review, allowlist, retention rule, credential reference, and emergency shutoff."
        />
      ) : (
        <section className="panel" style={{ marginTop: 18 }}>
          <div className="search-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Connector</th>
                  <th>Kind</th>
                  <th>Purpose</th>
                  <th>Hosts</th>
                  <th>Retention</th>
                  <th>Terms</th>
                  <th>Last run</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {connectors.map((row) => (
                  <tr key={text(row.id)}>
                    <td>
                      <strong>{text(row.display_name)}</strong>
                      <small>{text(row.key)}</small>
                    </td>
                    <td>{text(row.source_kind)}</td>
                    <td>{text(row.purpose)}</td>
                    <td>{text(row.allowed_hosts)}</td>
                    <td>{text(row.retention_days)} days</td>
                    <td>
                      {row.terms_reviewed_at ? dateTime(row.terms_reviewed_at) : "Not reviewed"}
                    </td>
                    <td>
                      {dateTime(row.last_run_at)}
                      <br />
                      <small>{text(row.last_run_status)}</small>
                    </td>
                    <td>
                      <span className={statusClass(row.status)}>{text(row.status)}</span>
                    </td>
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
