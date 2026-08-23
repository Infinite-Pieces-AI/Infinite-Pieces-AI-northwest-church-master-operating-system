import { FamilyShowcase } from "@/components/family-showcase";
import { PageHeading } from "@/components/page-heading";
import { requireViewer } from "@/lib/auth/viewer";
import { loadFamilyWorkspace } from "@/lib/family";
import { addAuthorizedPickupAction, setAuthorizedPickupStatusAction } from "../actions";

export default async function PickupPage() {
  const viewer = await requireViewer();
  if (viewer.demo) return <FamilyShowcase initialView="pickup" />;

  const workspace = await loadFamilyWorkspace(viewer);

  return (
    <>
      <PageHeading
        eyebrow="Family · authorized pickup"
        title="Trusted adults"
        description="Maintain the adult records that the approved child-release system may use during pickup verification."
      />
      {!workspace.household || !workspace.children.length ? (
        <section className="real-data-state">
          <h2>No guardian-managed child record is available.</h2>
          <p>Child and guardian links must be verified before pickup permissions can be managed.</p>
        </section>
      ) : (
        <div className="dashboard-grid">
          <section className="hub-panel">
            <p className="hub-kicker">Add a trusted adult</p>
            <h2>New pickup authorization</h2>
            <form className="family-form" action={addAuthorizedPickupAction}>
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
                Adult’s full name
                <input name="displayName" maxLength={120} required />
              </label>
              <label>
                Relationship
                <input
                  name="relationshipLabel"
                  maxLength={120}
                  placeholder="Grandparent, aunt, family friend…"
                />
              </label>
              <label>
                Last four phone digits
                <input name="phoneLastFour" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} />
              </label>
              <button className="hub-button hub-button--primary" type="submit">
                Add trusted adult
              </button>
            </form>
          </section>
          <section className="hub-panel hub-panel--span2">
            <p className="hub-kicker">Current permissions</p>
            <h2>Authorized pickup records</h2>
            {workspace.pickups.length ? (
              <div className="family-record-list">
                {workspace.pickups.map((pickup) => {
                  const child = workspace.children.find((row) => row.id === pickup.childId);
                  return (
                    <article key={pickup.id}>
                      <span className="avatar">{pickup.displayName.slice(0, 1)}</span>
                      <div>
                        <strong>{pickup.displayName}</strong>
                        <small>
                          {pickup.relationship ?? "Relationship not supplied"} · For{" "}
                          {child?.preferredName ?? "linked child"}
                          {pickup.phoneLastFour ? ` · Phone •••• ${pickup.phoneLastFour}` : ""}
                          {pickup.active ? " · Active" : " · Inactive"}
                        </small>
                      </div>
                      <form action={setAuthorizedPickupStatusAction}>
                        <input type="hidden" name="pickupId" value={pickup.id} />
                        <input
                          type="hidden"
                          name="active"
                          value={pickup.active ? "false" : "true"}
                        />
                        <button className="hub-button hub-button--secondary" type="submit">
                          {pickup.active ? "Deactivate" : "Reactivate"}
                        </button>
                      </form>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="real-data-state">
                <h3>No additional pickup adults are currently authorized.</h3>
                <p>Add an adult only after the guardian has confirmed the permission.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
