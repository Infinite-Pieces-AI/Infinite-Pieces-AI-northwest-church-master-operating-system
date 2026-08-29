import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { RecoveryShowcase } from "@/components/recovery-showcase";
import { requireViewer } from "@/lib/auth/viewer";
import { loadRecoveryWorkspace, stringValue } from "@/lib/ministry-spaces";
import { createRecoveryCurriculumUnitAction, createRecoveryMeetingAction } from "../actions";

export default async function RecoveryLeaderPage() {
  const viewer = await requireViewer();
  const canLead = viewer.roles.some((role) =>
    ["minister", "group_leader", "super_admin"].includes(role),
  );
  if (!canLead) {
    return (
      <section className="real-data-state real-data-state--warning">
        <h1>Recovery leader access required</h1>
        <p>This area is limited to approved Recovery Ministry leaders and ministers.</p>
        <Link className="hub-button hub-button--secondary" href="/recovery">
          Return to Recovery Ministry
        </Link>
      </section>
    );
  }
  if (viewer.demo) return <RecoveryShowcase canLead />;
  const workspace = await loadRecoveryWorkspace(viewer);

  return (
    <>
      <PageHeading
        eyebrow="Restricted Recovery Ministry operations"
        title="Recovery Leader Console"
        description="Prepare reviewed curriculum, schedule meetings, protect participant privacy, and keep professional and crisis resources visible."
        actions={
          <Link className="hub-button hub-button--secondary" href="/recovery">
            Member view
          </Link>
        }
      />

      <section className="recovery-safety-note">
        <strong>Leader responsibility has limits.</strong>
        <span>
          This console does not authorize diagnosis, detox direction, medication advice, forced
          disclosure, unsafe amends, or replacing emergency and licensed treatment services.
        </span>
      </section>

      {!workspace.configured ? (
        <section className="real-data-state real-data-state--warning">
          <h2>Recovery data is not connected.</h2>
          <p>Apply migration 0027 and configure the production Supabase project.</p>
        </section>
      ) : !workspace.programs.length ? (
        <section className="real-data-state">
          <h2>Create the recovery program record first.</h2>
          <p>
            Program creation is intentionally handled through ministry administration so church
            leadership can confirm the name, scope, curriculum ownership, safeguarding process, and
            accountable leaders before participant enrollment begins.
          </p>
        </section>
      ) : (
        <div className="leader-console">
          <section className="space-form-card">
            <p className="hub-kicker">Curriculum publishing</p>
            <h2>Create or update a weekly unit</h2>
            <form className="space-form" action={createRecoveryCurriculumUnitAction}>
              <label>
                Program
                <select name="programId">
                  {workspace.programs.map((program) => (
                    <option value={stringValue(program.id)} key={stringValue(program.id)}>
                      {stringValue(program.name)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Week number
                <input name="weekNumber" type="number" min={1} max={104} required />
              </label>
              <label className="space-form__wide">
                Title
                <input name="title" maxLength={180} required />
              </label>
              <label className="space-form__wide">
                Summary
                <textarea name="summary" rows={4} maxLength={3000} required />
              </label>
              <label className="space-form__wide">
                Scripture references, comma separated
                <input name="scriptureReferences" maxLength={1000} />
              </label>
              <label className="space-form__wide">
                Leader outline
                <textarea name="leaderOutline" rows={7} maxLength={12000} />
              </label>
              <label className="space-form__wide">
                Participant reflection
                <textarea name="participantReflection" rows={6} maxLength={6000} />
              </label>
              <label>
                Source type
                <select name="sourceKind" defaultValue="church_created">
                  <option value="church_created">Church-created material</option>
                  <option value="licensed_reference">Licensed material reference</option>
                </select>
              </label>
              <label>
                Source or license reference
                <input name="sourceReference" maxLength={500} />
              </label>
              <label className="space-check space-form__wide">
                <input name="published" type="checkbox" /> Publish to approved participants
              </label>
              <button className="hub-button hub-button--primary" type="submit">
                Save curriculum unit
              </button>
            </form>
          </section>

          <section className="space-form-card">
            <p className="hub-kicker">Meeting operations</p>
            <h2>Schedule a Recovery Ministry meeting</h2>
            <form className="space-form" action={createRecoveryMeetingAction}>
              <label>
                Group
                <select name="groupId">
                  {workspace.groups.map((group) => (
                    <option value={stringValue(group.id)} key={stringValue(group.id)}>
                      {stringValue(group.name)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Curriculum unit
                <select name="curriculumUnitId" defaultValue="">
                  <option value="">No linked unit</option>
                  {workspace.curriculum.map((unit) => (
                    <option value={unit.id} key={unit.id}>
                      Week {unit.weekNumber}: {unit.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Starts
                <input name="startsAt" type="datetime-local" required />
              </label>
              <label>
                Ends
                <input name="endsAt" type="datetime-local" />
              </label>
              <label className="space-form__wide">
                Restricted leader notes
                <textarea name="leaderNotes" rows={5} maxLength={8000} />
              </label>
              <button className="hub-button hub-button--primary" type="submit">
                Schedule meeting
              </button>
            </form>
          </section>

          <section className="space-form-card">
            <p className="hub-kicker">Published curriculum</p>
            <h2>{workspace.curriculum.length} units visible to members</h2>
            <div className="curriculum-admin-list">
              {workspace.curriculum.map((unit) => (
                <article key={unit.id}>
                  <span>{unit.weekNumber}</span>
                  <div>
                    <strong>{unit.title}</strong>
                    <small>
                      {unit.sourceKind.replaceAll("_", " ")} · {unit.scriptureReferences.join(", ")}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="space-form-card leader-boundaries">
            <p className="hub-kicker">Required program gate</p>
            <h2>Celebrate Recovery content and branding</h2>
            <p>
              Do not copy or publish proprietary program lessons merely because the interface can
              store them. Church leadership must confirm authorized materials, program naming,
              leader requirements, and publication rights. Until then, use original church-created
              outlines and Scripture references or store licensed material as a private reference.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
