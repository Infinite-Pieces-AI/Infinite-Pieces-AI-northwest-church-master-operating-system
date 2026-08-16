import {
  dateTime,
  EmptyLiveData,
  LiveDataNotice,
  statusClass,
  text,
} from "@/components/live-data-ui";
import { PageHeading } from "@/components/page-heading";
import { loadVisitorRows, outreachBackendConfigured } from "@/lib/live-intelligence";

export default async function VisitorCrmPage() {
  const visitors = await loadVisitorRows();
  return (
    <>
      <PageHeading
        eyebrow="Voluntary follow-up only"
        title="Visitor CRM"
        description="Coordinate the next step a person explicitly requested after submitting a public form. Private search behavior and inferred belief never create a record."
      />
      <LiveDataNotice title="Keep sensitive ministry data out of outreach">
        <p>
          Prayer, counseling, child, medical, custody, safeguarding, and private Hub information
          belong in separate restricted workflows.
        </p>
      </LiveDataNotice>
      {!outreachBackendConfigured() ? (
        <EmptyLiveData
          title="Visitor follow-up is not connected"
          description="Connect the public forms and Outreach OS to the approved production database. No visitor names or activity are fabricated."
        />
      ) : !visitors.length ? (
        <EmptyLiveData
          title="No voluntary visitor request is stored"
          description="A record appears only after a person submits a public form and consents to the selected contact method."
        />
      ) : (
        <section className="panel" style={{ marginTop: 18 }}>
          <div className="search-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Requested next step</th>
                  <th>Consent</th>
                  <th>Source</th>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((row) => (
                  <tr key={text(row.id)}>
                    <td>
                      <strong>
                        {text(row.first_name)} {text(row.last_name, "")}
                      </strong>
                      <small>
                        {text(row.email)} · {text(row.phone)}
                      </small>
                    </td>
                    <td>{text(row.requested_next_step)}</td>
                    <td>
                      {row.consent_to_contact === true
                        ? "Contact permitted"
                        : "No contact permission"}
                    </td>
                    <td>
                      {text(row.source_path)}
                      <br />
                      <small>
                        {text(row.utm_source)} / {text(row.utm_medium)}
                      </small>
                    </td>
                    <td>{text(row.source_campaign ?? row.utm_campaign)}</td>
                    <td>
                      <span className={statusClass(row.status)}>{text(row.status)}</span>
                    </td>
                    <td>{dateTime(row.created_at)}</td>
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
