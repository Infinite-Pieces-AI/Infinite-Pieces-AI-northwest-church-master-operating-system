import Link from "next/link";
import { FamilyShowcase } from "@/components/family-showcase";
import { PageHeading } from "@/components/page-heading";
import { requireViewer } from "@/lib/auth/viewer";
import { loadFamilyWorkspace } from "@/lib/family";

export default async function ParentCommunityPage() {
  const viewer = await requireViewer();
  if (viewer.demo) return <FamilyShowcase initialView="parents" />;

  const workspace = await loadFamilyWorkspace(viewer);

  return (
    <>
      <PageHeading
        eyebrow="Family · parent community"
        title="Connections and playdates"
        description="Adult-to-adult, opt-in connections and family-friendly plans without exposing a child’s home, school, custody information, recurring schedule, or live location."
        actions={
          <Link className="hub-button hub-button--primary" href="/fellowship">
            Create a family-friendly meetup
          </Link>
        }
      />
      <div className="dashboard-grid">
        <section className="hub-panel">
          <p className="hub-kicker">Approved parent connections</p>
          <h2>My connections</h2>
          {workspace.parentConnections.length ? (
            <div className="family-record-list">
              {workspace.parentConnections.map((connection) => (
                <article key={connection.id}>
                  <span className="avatar">{connection.otherDisplayName.slice(0, 1)}</span>
                  <div>
                    <strong>{connection.otherDisplayName}</strong>
                    <small>
                      {connection.status} · Updated{" "}
                      {new Date(connection.updatedAt).toLocaleDateString()}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="real-data-state">
              <h3>No approved parent connections yet.</h3>
              <p>
                Parent contact information is never public. Connections begin through an approved,
                opt-in request and each adult controls what they share.
              </p>
            </div>
          )}
        </section>
        <section className="hub-panel hub-panel--span2">
          <p className="hub-kicker">Playdate proposals</p>
          <h2>Current plans</h2>
          {workspace.playdates.length ? (
            <div className="family-record-list">
              {workspace.playdates.map((playdate) => (
                <article key={playdate.id}>
                  <span className="avatar">∞</span>
                  <div>
                    <strong>{playdate.title ?? "Family activity"}</strong>
                    <small>
                      {playdate.status}
                      {playdate.startsAt
                        ? ` · ${new Date(playdate.startsAt).toLocaleString()}`
                        : ""}
                      {playdate.generalLocation ? ` · ${playdate.generalLocation}` : ""}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="real-data-state">
              <h3>No active playdate proposals.</h3>
              <p>
                Use Fellowship for a public-place, family-friendly invitation. Exact instructions
                remain participant-only after an approved member joins.
              </p>
              <Link className="hub-button hub-button--secondary" href="/fellowship">
                Browse family-friendly Fellowship
              </Link>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
