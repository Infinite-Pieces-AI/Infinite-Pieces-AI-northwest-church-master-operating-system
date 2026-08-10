import {
  dateTime,
  EmptyLiveData,
  LiveDataNotice,
  statusClass,
  text,
} from "@/components/live-data-ui";
import { PageHeading } from "@/components/page-heading";
import { loadCampaignRows, outreachBackendConfigured } from "@/lib/live-intelligence";

export default async function CampaignsPage() {
  const campaigns = await loadCampaignRows();
  return (
    <>
      <PageHeading
        eyebrow="Contextual and consent-aware"
        title="Campaign Command"
        description="Review real contextual keyword, geographic, event, and content campaigns. Member lists, prayer activity, private Bible questions, and inferred religious beliefs are prohibited audience inputs."
      />
      <LiveDataNotice title="No automatic targeting or budget changes">
        <p>
          Every campaign requires an approved landing page, geography, budget, creative, measurement
          plan, and named human approver.
        </p>
      </LiveDataNotice>
      {!outreachBackendConfigured() ? (
        <EmptyLiveData
          title="Campaign data is not connected"
          description="Configure the production database and approved advertising account. No spend or results are simulated."
        />
      ) : !campaigns.length ? (
        <EmptyLiveData
          title="No campaign exists"
          description="Create a campaign only after the public page, approved facts, policy review, conversion boundaries, and account ownership are ready."
        />
      ) : (
        <section className="panel" style={{ marginTop: 18 }}>
          <div className="search-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Objective</th>
                  <th>Geography</th>
                  <th>Landing page</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Approval</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((row) => (
                  <tr key={text(row.id)}>
                    <td>
                      <strong>{text(row.name)}</strong>
                      <small>{dateTime(row.updated_at)}</small>
                    </td>
                    <td>{text(row.objective)}</td>
                    <td>{text(row.geography)}</td>
                    <td>{text(row.landing_page_path)}</td>
                    <td>
                      {row.budget_usd === null || row.budget_usd === undefined
                        ? "Not set"
                        : `$${text(row.budget_usd)}`}
                    </td>
                    <td>
                      <span className={statusClass(row.status)}>{text(row.status)}</span>
                    </td>
                    <td>
                      {row.approved_by ? `Approved ${dateTime(row.approved_at)}` : "Not approved"}
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
