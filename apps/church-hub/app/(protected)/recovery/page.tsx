import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { RecoveryShowcase } from "@/components/recovery-showcase";
import { requireViewer } from "@/lib/auth/viewer";
import {
  loadRecoveryWorkspace,
  stringValue,
  type UnknownRow,
} from "@/lib/ministry-spaces";
import { postRecoveryDiscussionAction, requestRecoveryGroupAccessAction } from "./actions";

function listValue(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function idOf(row: UnknownRow | undefined): string {
  return row ? stringValue(row.id) : "";
}

export default async function RecoveryPage() {
  const viewer = await requireViewer();
  const canLead = viewer.roles.some((role) =>
    ["minister", "group_leader", "super_admin"].includes(role),
  );
  if (viewer.demo) return <RecoveryShowcase canLead={canLead} />;
  const workspace = await loadRecoveryWorkspace(viewer);
  const program = workspace.programs[0];
  const activeMembership = workspace.memberships.find(
    (item) => stringValue(item.status) === "active",
  );
  const activeGroup = workspace.groups.find(
    (item) => stringValue(item.id) === stringValue(activeMembership?.group_id),
  );
  const nextMeeting = workspace.meetings.find(
    (item) => new Date(stringValue(item.starts_at)).getTime() >= Date.now(),
  );
  const currentUnit = workspace.curriculum[0];

  return (
    <>
      <PageHeading
        eyebrow="Private Christ-centered recovery community"
        title="Recovery Ministry"
        description="Follow the approved weekly curriculum, connect with your recovery group, and reach professional or crisis resources when ministry support is not enough."
        actions={
          canLead ? (
            <Link className="hub-button hub-button--primary" href="/recovery/leader">
              Open leader console
            </Link>
          ) : undefined
        }
      />

      <section className="recovery-safety-note">
        <strong>Peer and spiritual support—not detox, treatment, medical care, or emergency response.</strong>
        <span>
          Call 911 for immediate danger or suspected overdose. In the United States, call or text
          988 for urgent crisis support. Use verified treatment resources for clinical assessment
          and care.
        </span>
      </section>

      {!workspace.configured ? (
        <section className="real-data-state real-data-state--warning">
          <h2>Recovery Ministry data is not connected.</h2>
          <p>
            Apply migration 0027 and configure authenticated Supabase access before collecting
            sensitive recovery membership, meeting, or discussion records.
          </p>
        </section>
      ) : !program ? (
        <section className="real-data-state">
          <h2>No approved recovery program has been published.</h2>
          <p>
            A minister or approved recovery leader must create the program, confirm curriculum
            ownership or licensing, publish the first units, and establish the privacy model.
          </p>
          {canLead ? (
            <Link className="hub-button hub-button--primary" href="/recovery/leader">
              Configure Recovery Ministry
            </Link>
          ) : null}
        </section>
      ) : (
        <div className="space-stack">
          <section className="space-hero space-hero--recovery recovery-production-hero">
            <div>
              <p className="space-eyebrow">{stringValue(program.name)}</p>
              <h2>{activeGroup ? stringValue(activeGroup.name) : "A supported path toward connection and change"}</h2>
              <p>{stringValue(program.description)}</p>
              <div className="space-hero__actions">
                {currentUnit ? (
                  <a className="hub-button hub-button--light" href="#current-week">
                    Open week {currentUnit.weekNumber}
                  </a>
                ) : null}
                <a className="hub-button hub-button--ghost-light" href="#resources">
                  Verified resources
                </a>
              </div>
            </div>
            <div className="recovery-next-meeting">
              <small>Next meeting</small>
              <strong>
                {nextMeeting
                  ? new Date(stringValue(nextMeeting.starts_at)).toLocaleString()
                  : "No meeting scheduled"}
              </strong>
              <span>{activeGroup ? stringValue(activeGroup.schedule_summary) : "Request group access below"}</span>
              <b>{activeMembership ? stringValue(activeMembership.status) : "Not enrolled"}</b>
            </div>
          </section>

          {!activeMembership ? (
            <section className="space-form-card">
              <p className="hub-kicker">Private group access</p>
              <h2>Request to join an approved Recovery Ministry group</h2>
              <p>
                Recovery participation is not shown in the public member directory and is excluded
                from advertising and general product analytics.
              </p>
              {workspace.groups.length ? (
                <form className="space-form" action={requestRecoveryGroupAccessAction}>
                  <label>
                    Group
                    <select name="groupId">
                      {workspace.groups.map((group) => (
                        <option value={idOf(group)} key={idOf(group)}>
                          {stringValue(group.name)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="hub-button hub-button--primary" type="submit">
                    Request private group access
                  </button>
                </form>
              ) : (
                <p>No active group is currently accepting requests.</p>
              )}
            </section>
          ) : null}

          {currentUnit ? (
            <section className="space-form-card curriculum-detail" id="current-week">
              <p className="hub-kicker">Current published curriculum · week {currentUnit.weekNumber}</p>
              <h2>{currentUnit.title}</h2>
              <p className="curriculum-theme">{currentUnit.summary}</p>
              <h3>Scripture references</h3>
              <div className="scripture-pills">
                {currentUnit.scriptureReferences.map((reference) => (
                  <span key={reference}>{reference}</span>
                ))}
              </div>
              {currentUnit.participantReflection ? (
                <div className="space-callout">
                  <strong>Participant reflection</strong>
                  <p>{currentUnit.participantReflection}</p>
                </div>
              ) : null}
              <small>
                Source: {currentUnit.sourceKind.replaceAll("_", " ")}. Licensed material is shown
                only by reference unless the church has confirmed publication rights.
              </small>
            </section>
          ) : (
            <section className="real-data-state">
              <h2>No published weekly curriculum is available.</h2>
              <p>An approved leader must review and publish each unit before members see it.</p>
            </section>
          )}

          {activeMembership && activeGroup ? (
            <div className="space-two-column recovery-group-layout">
              <section className="space-form-card">
                <p className="hub-kicker">Approved participants only</p>
                <h2>{stringValue(activeGroup.name)}</h2>
                <p>
                  Do not share another person’s story, screenshots, medical information, or
                  identifying details outside this approved group.
                </p>
                <form className="space-form" action={postRecoveryDiscussionAction}>
                  <input type="hidden" name="groupId" value={idOf(activeGroup)} />
                  <input type="hidden" name="meetingId" value={idOf(nextMeeting)} />
                  <label>
                    Post type
                    <select name="postType" defaultValue="encouragement">
                      <option value="encouragement">Encouragement</option>
                      <option value="question">Question</option>
                      <option value="reflection">Reflection</option>
                      <option value="resource">Resource</option>
                      {canLead ? <option value="announcement">Leader announcement</option> : null}
                    </select>
                  </label>
                  <label className="space-form__wide">
                    Message
                    <textarea name="body" rows={5} maxLength={5000} required />
                  </label>
                  <button className="hub-button hub-button--primary" type="submit">
                    Post to private group
                  </button>
                </form>
              </section>
              <section className="recovery-post-list">
                {workspace.posts.length ? (
                  workspace.posts.map((post) => (
                    <article key={stringValue(post.id)}>
                      <header>
                        <span>{stringValue(post.post_type).replaceAll("_", " ")}</span>
                        <small>{new Date(stringValue(post.created_at)).toLocaleString()}</small>
                      </header>
                      <p>{stringValue(post.body)}</p>
                    </article>
                  ))
                ) : (
                  <section className="real-data-state">
                    <h3>No group posts yet.</h3>
                    <p>Approved participants can begin with an encouragement or question.</p>
                  </section>
                )}
              </section>
            </div>
          ) : null}

          <section className="resource-grid" id="resources">
            <article className="resource-card resource-card--urgent">
              <span>911</span>
              <h2>Immediate danger or suspected overdose</h2>
              <p>Call 911. Do not wait for an app message or church reply.</p>
            </article>
            <article className="resource-card">
              <span>988</span>
              <h2>Crisis support</h2>
              <p>Call or text 988 in the United States for urgent crisis support.</p>
              <a href="https://988lifeline.org/" target="_blank" rel="noreferrer">
                Open 988 Lifeline ↗
              </a>
            </article>
            <article className="resource-card">
              <span>⌕</span>
              <h2>Find treatment</h2>
              <p>Search the official U.S. treatment locator.</p>
              <a href="https://findtreatment.gov/" target="_blank" rel="noreferrer">
                Open FindTreatment.gov ↗
              </a>
            </article>
            {workspace.resources.map((resource) => (
              <article className="resource-card" key={stringValue(resource.id)}>
                <span>✓</span>
                <h2>{stringValue(resource.name)}</h2>
                <p>{stringValue(resource.summary)}</p>
                <a href={stringValue(resource.website_url)} target="_blank" rel="noreferrer">
                  Open verified resource ↗
                </a>
              </article>
            ))}
          </section>
        </div>
      )}
    </>
  );
}
