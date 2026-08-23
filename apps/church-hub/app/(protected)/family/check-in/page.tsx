import { FamilyShowcase } from "@/components/family-showcase";
import { PageHeading } from "@/components/page-heading";
import { requireViewer } from "@/lib/auth/viewer";
import { loadFamilyWorkspace } from "@/lib/family";

export default async function CheckInPage() {
  const viewer = await requireViewer();
  if (viewer.demo) return <FamilyShowcase initialView="checkin" />;

  const workspace = await loadFamilyWorkspace(viewer);

  return (
    <>
      <PageHeading
        eyebrow="Family · Kids Kingdom"
        title="Sunday check-in"
        description="Open the church-approved check-in provider and review the most recent status mirrored into Church Hub."
      />
      <div className="dashboard-grid">
        <section className="hub-panel">
          <p className="hub-kicker">Safety-critical system of record</p>
          <h2>Approved provider</h2>
          {workspace.checkinProviderUrl ? (
            <div className="integration-status">
              <span aria-hidden="true">✓</span>
              <div>
                <strong>Parent pre-check link is configured.</strong>
                <p>
                  The provider—not Church Hub—is authoritative for labels, classroom assignment,
                  arrival, security code, and pickup verification.
                </p>
                <a
                  className="hub-button hub-button--primary"
                  href={workspace.checkinProviderUrl}
                  rel="noreferrer"
                >
                  Open parent pre-check ↗
                </a>
              </div>
            </div>
          ) : (
            <div className="real-data-state real-data-state--warning">
              <h3>No check-in provider URL is configured.</h3>
              <p>
                Add the approved Planning Center or ChMS parent pre-check URL to the server
                environment before presenting this as an operational check-in tool.
              </p>
            </div>
          )}
        </section>
        <section className="hub-panel hub-panel--span2">
          <p className="hub-kicker">Latest mirrored status</p>
          <h2>Guardian-visible child status</h2>
          {workspace.children.length ? (
            <div className="family-record-list">
              {workspace.children.map((child) => (
                <article key={child.id}>
                  <span className="avatar">{child.preferredName.slice(0, 1)}</span>
                  <div>
                    <strong>{child.preferredName}</strong>
                    <small>
                      {child.className ?? "No active class assignment"} ·{" "}
                      {child.latestCheckinState
                        ? `${child.latestCheckinState}${child.latestCheckinAt ? ` at ${new Date(child.latestCheckinAt).toLocaleString()}` : ""}`
                        : "No check-in event has been mirrored"}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p>No guardian-managed child record is available.</p>
          )}
        </section>
      </div>
    </>
  );
}
