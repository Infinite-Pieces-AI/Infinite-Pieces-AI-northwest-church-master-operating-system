import { PageHeading } from "@/components/page-heading";
import { requireViewer } from "@/lib/auth/viewer";
import { loadFamilyWorkspace } from "@/lib/family";
import { updateHouseholdNameAction } from "../actions";

export default async function HouseholdPage() {
  const viewer = await requireViewer();
  const workspace = await loadFamilyWorkspace(viewer);

  return (
    <>
      <PageHeading
        eyebrow="Family · household"
        title="Household"
        description="Review the adults connected to this household and maintain the household display name."
      />
      {!workspace.household ? (
        <section className="real-data-state">
          <h2>No active household is available.</h2>
          <p>A verified administrator must link this account to a household first.</p>
        </section>
      ) : (
        <div className="dashboard-grid">
          <section className="hub-panel">
            <p className="hub-kicker">Household identity</p>
            <h2>{workspace.household.name}</h2>
            <form className="family-form" action={updateHouseholdNameAction}>
              <input type="hidden" name="householdId" value={workspace.household.id} />
              <label>
                Household display name
                <input
                  name="name"
                  defaultValue={workspace.household.name}
                  maxLength={120}
                  required
                />
              </label>
              <button className="hub-button hub-button--primary" type="submit">
                Save household name
              </button>
            </form>
          </section>
          <section className="hub-panel hub-panel--span2">
            <p className="hub-kicker">Linked adults</p>
            <h2>Active household members</h2>
            <div className="family-record-list">
              {workspace.members.map((member) => (
                <article key={member.id}>
                  <span className="avatar">{member.displayName.slice(0, 1)}</span>
                  <div>
                    <strong>{member.displayName}</strong>
                    <small>
                      {member.relationship}
                      {member.primaryContact ? " · Primary contact" : ""}
                      {member.email ? ` · ${member.email}` : ""}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
