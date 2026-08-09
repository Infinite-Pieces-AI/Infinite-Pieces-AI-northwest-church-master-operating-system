import { PageHeading } from "@/components/page-heading";
import { ProtectedMediaFrame } from "@/components/protected-media-frame";
import { thisWeekData } from "@/lib/demo-data";
import { requireViewer } from "@/lib/auth/viewer";

export default async function FamilyPage() {
  const viewer = await requireViewer();
  return (
    <>
      <PageHeading
        eyebrow="Guardian-managed household"
        title="Family"
        description="Children, guardian relationships, authorized pickup, media scope, Kids Kingdom status, and opt-in parent connections."
      />
      <div className="dashboard-grid">
        <section className="hub-panel hub-panel--span2">
          <div className="panel-heading">
            <div>
              <p className="hub-kicker">Household</p>
              <h2>Sample Household</h2>
            </div>
            <button className="hub-button hub-button--secondary">Edit household</button>
          </div>
          <div className="household-members">
            <article>
              <span className="avatar">J</span>
              <div>
                <strong>Jordan Member</strong>
                <small>Verified guardian · Synthetic</small>
              </div>
            </article>
            {thisWeekData.kids.map((child) => (
              <article key={child.id}>
                <span className="avatar">S</span>
                <div>
                  <strong>{child.displayName}</strong>
                  <small>{child.className} · Guardian managed</small>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="hub-panel">
          <p className="hub-kicker">Kids Kingdom</p>
          <h2>Sunday check-in</h2>
          <p>
            Planning Center or the approved ChMS remains the early safety-critical system of record.
          </p>
          <button className="hub-button hub-button--primary" disabled>
            Pre-check integration pending
          </button>
        </section>
        <section className="hub-panel">
          <p className="hub-kicker">Authorized pickup</p>
          <h2>Trusted adults</h2>
          <p>
            Pickup permissions are separate from household visibility and must be verified by the
            operational system.
          </p>
          <button className="hub-button hub-button--secondary">Review sample settings</button>
        </section>
        <section className="hub-panel">
          <p className="hub-kicker">Media permission</p>
          <h2>Scope-specific consent</h2>
          <ul className="permission-list">
            <li>
              <span>Private household</span>
              <strong>Allowed</strong>
            </li>
            <li>
              <span>Private class album</span>
              <strong>Review</strong>
            </li>
            <li>
              <span>Public website</span>
              <strong>Not allowed</strong>
            </li>
            <li>
              <span>Advertising</span>
              <strong>Not allowed</strong>
            </li>
          </ul>
        </section>
        <section className="hub-panel">
          <p className="hub-kicker">Parent community</p>
          <h2>Connections and playdates</h2>
          <p>
            Adult-to-adult opt-in requests. Home address, school, recurring schedule, custody
            details, and precise location are never public.
          </p>
          <button className="hub-button hub-button--secondary">Open parent community</button>
        </section>
        <section className="hub-panel hub-panel--span2">
          <div className="panel-heading">
            <div>
              <p className="hub-kicker">Private media preview</p>
              <h2>Consent-scoped class album</h2>
            </div>
            <span className="pill">Synthetic example</span>
          </div>
          <ProtectedMediaFrame
            src="/sample-classroom-placeholder.svg"
            alt="Synthetic classroom activity placeholder with no people"
            viewerMark={`${viewer.displayName} · private preview`}
            expiresLabel="Signed access link expires after the configured window"
          />
        </section>
      </div>
    </>
  );
}
