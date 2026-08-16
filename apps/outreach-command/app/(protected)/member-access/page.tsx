import {
  dateTime,
  EmptyLiveData,
  LiveDataNotice,
  statusClass,
  text,
} from "@/components/live-data-ui";
import { PageHeading } from "@/components/page-heading";
import { loadMemberAccessRequests, outreachBackendConfigured } from "@/lib/live-intelligence";

export default async function MemberAccessPage() {
  const { accessRequests, relatedVisitorRequests } = await loadMemberAccessRequests();
  const hubUrl = process.env.NEXT_PUBLIC_CHURCH_HUB_URL ?? "http://localhost:3001";

  return (
    <>
      <PageHeading
        eyebrow="Church Hub invitation queue"
        title="Member Access"
        description="Review people who voluntarily requested access to the private fellowship and connection app. Approval, household linking, roles, and invitations remain controlled human actions."
        actions={
          <a className="secondary-button" href={`${hubUrl}/admin/access`}>
            Open Hub access administration ↗
          </a>
        }
      />
      <LiveDataNotice title="Access requests are not SEO leads">
        <p>
          Search source and voluntary campaign attribution may explain how someone arrived, but
          membership, prayer, Bible questions, and private Hub activity must never become ad
          audiences.
        </p>
      </LiveDataNotice>
      {!outreachBackendConfigured() ? (
        <EmptyLiveData
          title="Connect the production backend"
          description="The member-access queue remains empty until the public request form and Church Hub share the approved Supabase project."
          href="/production-readiness"
          action="Review configuration"
        />
      ) : (
        <>
          <section className="panel" style={{ marginTop: 18 }}>
            <div className="panel__header">
              <div>
                <h2>Direct Church Hub requests</h2>
                <p>{accessRequests.length} current records</p>
              </div>
            </div>
            <div className="search-table-wrap">
              {accessRequests.length ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Person</th>
                      <th>Contact</th>
                      <th>Church relationship</th>
                      <th>Known leader</th>
                      <th>Status</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessRequests.map((row) => (
                      <tr key={text(row.id)}>
                        <td>
                          <strong>
                            {text(row.first_name)} {text(row.last_name, "")}
                          </strong>
                          <small>{text(row.reason)}</small>
                        </td>
                        <td>
                          {text(row.email)}
                          <br />
                          <small>{text(row.phone)}</small>
                        </td>
                        <td>{text(row.relationship_to_church ?? row.relationship)}</td>
                        <td>{text(row.known_leader_name ?? row.known_leader)}</td>
                        <td>
                          <span className={statusClass(row.status)}>{text(row.status)}</span>
                        </td>
                        <td>{dateTime(row.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyLiveData
                  title="No pending access requests"
                  description="New records will appear after someone submits the real Church Hub access-request form."
                />
              )}
            </div>
          </section>
          <section className="panel" style={{ marginTop: 18 }}>
            <div className="panel__header">
              <div>
                <h2>Related public inquiries</h2>
                <p>Voluntary public forms that may require an invitation conversation</p>
              </div>
            </div>
            <div className="search-table-wrap">
              {relatedVisitorRequests.length ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Person</th>
                      <th>Pathway</th>
                      <th>Source</th>
                      <th>Status</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedVisitorRequests.map((row) => (
                      <tr key={text(row.id)}>
                        <td>
                          <strong>
                            {text(row.first_name)} {text(row.last_name, "")}
                          </strong>
                          <small>{text(row.email)}</small>
                        </td>
                        <td>{text(row.requested_next_step)}</td>
                        <td>
                          {text(row.source_path)}
                          <br />
                          <small>{text(row.source_campaign)}</small>
                        </td>
                        <td>
                          <span className={statusClass(row.status)}>{text(row.status)}</span>
                        </td>
                        <td>{dateTime(row.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="panel__body">No related public inquiry is waiting.</p>
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
