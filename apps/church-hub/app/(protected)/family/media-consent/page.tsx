import { FamilyShowcase } from "@/components/family-showcase";
import { PageHeading } from "@/components/page-heading";
import { requireViewer } from "@/lib/auth/viewer";
import { loadFamilyWorkspace } from "@/lib/family";
import { setMediaPermissionAction } from "../actions";

const scopes = [
  ["private_household", "Private household"],
  ["private_class_album", "Private class album"],
  ["private_parent_community", "Private parent community"],
  ["internal_church_presentation", "Internal church presentation"],
  ["public_website", "Public website"],
  ["official_social_media", "Official social media"],
  ["promotional_advertising", "Promotional advertising"],
] as const;

function labelForScope(scope: string) {
  return scopes.find(([value]) => value === scope)?.[1] ?? scope.replaceAll("_", " ");
}

export default async function MediaConsentPage() {
  const viewer = await requireViewer();
  if (viewer.demo) return <FamilyShowcase initialView="media" />;

  const workspace = await loadFamilyWorkspace(viewer);

  return (
    <>
      <PageHeading
        eyebrow="Family · media consent"
        title="Scope-specific media permission"
        description="Grant or deny each use separately. A private class album does not authorize a public website, social-media post, or advertisement."
      />
      {!workspace.children.length ? (
        <section className="real-data-state">
          <h2>No guardian-managed child record is available.</h2>
          <p>Consent settings appear only for children linked to this verified guardian.</p>
        </section>
      ) : (
        <div className="dashboard-grid">
          <section className="hub-panel">
            <p className="hub-kicker">Record a decision</p>
            <h2>Update permission</h2>
            <form className="family-form" action={setMediaPermissionAction}>
              <label>
                Child
                <select name="childId" required>
                  {workspace.children.map((child) => (
                    <option value={child.id} key={child.id}>
                      {child.preferredName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Use
                <select name="scope" required>
                  {scopes.map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Decision
                <select name="granted" defaultValue="false">
                  <option value="true">Allow</option>
                  <option value="false">Do not allow</option>
                </select>
              </label>
              <label>
                Optional note
                <textarea name="notes" rows={3} maxLength={500} />
              </label>
              <button className="hub-button hub-button--primary" type="submit">
                Record consent decision
              </button>
            </form>
          </section>
          <section className="hub-panel hub-panel--span2">
            <p className="hub-kicker">Current active decisions</p>
            <h2>Consent register</h2>
            {workspace.mediaPermissions.length ? (
              <div className="family-record-list">
                {workspace.mediaPermissions.map((permission) => {
                  const child = workspace.children.find((row) => row.id === permission.childId);
                  return (
                    <article key={permission.id}>
                      <span className="avatar">{permission.granted ? "✓" : "×"}</span>
                      <div>
                        <strong>{labelForScope(permission.scope)}</strong>
                        <small>
                          {child?.preferredName ?? "Linked child"} ·{" "}
                          {permission.granted ? "Allowed" : "Not allowed"} · Effective{" "}
                          {new Date(permission.effectiveFrom).toLocaleDateString()}
                        </small>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="real-data-state real-data-state--warning">
                <h3>No active media decisions are recorded.</h3>
                <p>
                  The safest default is no publication until a verified guardian records the exact
                  scope.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
