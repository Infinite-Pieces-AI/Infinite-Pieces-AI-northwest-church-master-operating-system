import { PageHeading } from "@/components/page-heading";
import { PrayerWellShowcase } from "@/components/prayer-well-showcase";
import { requireViewer } from "@/lib/auth/viewer";
import { loadPrayerWorkspace } from "@/lib/ministry-spaces";
import {
  archivePrayerRequestAction,
  createPrayerRequestAction,
  markPrayerAnsweredAction,
  recordPrayerSupportAction,
} from "./actions";

export default async function PrayerWellPage() {
  const viewer = await requireViewer();
  if (viewer.demo) return <PrayerWellShowcase />;
  const workspace = await loadPrayerWorkspace(viewer);

  return (
    <>
      <PageHeading
        eyebrow="Prayer, encouragement, and answered-prayer testimony"
        title="The Prayer Well"
        description="Share at the privacy level you choose, pray through current requests, encourage one another, and celebrate answers without moving sensitive content into advertising or public analytics."
      />

      <section className="prayer-safety-note">
        <strong>This space is not monitored continuously and is not emergency response.</strong>
        <span>
          Call 911 for immediate danger. In the United States, call or text 988 for urgent crisis
          support. Use the church’s safeguarding and mandated-reporting procedures when applicable.
        </span>
      </section>

      {!workspace.configured ? (
        <section className="real-data-state real-data-state--warning">
          <h2>Prayer Well data is not connected.</h2>
          <p>Apply migration 0027 and configure authenticated Supabase access before collecting prayer requests.</p>
        </section>
      ) : (
        <div className="space-stack">
          <section className="space-form-card">
            <p className="hub-kicker">Share only what you choose</p>
            <h2>New prayer request</h2>
            <form className="space-form" action={createPrayerRequestAction}>
              <label className="space-form__wide">
                Short title
                <input name="title" maxLength={180} required />
              </label>
              <label className="space-form__wide">
                Prayer request
                <textarea
                  name="requestText"
                  rows={6}
                  maxLength={4000}
                  required
                  placeholder="Share enough for people to pray without including details you want to keep private."
                />
              </label>
              <label>
                Name display
                <select name="displayMode" defaultValue="first_name">
                  <option value="first_name">First name only</option>
                  <option value="named">Full member name</option>
                  <option value="anonymous_to_members">Anonymous to members</option>
                </select>
              </label>
              <label>
                Visibility
                <select name="privacyScope" defaultValue="church">
                  <option value="church">Church members</option>
                  <option value="leaders_only">Approved prayer leaders</option>
                  <option value="requester_and_leaders">Only me and approved leaders</option>
                </select>
              </label>
              <label className="space-check">
                <input name="allowEncouragement" type="checkbox" defaultChecked /> Allow member encouragement
              </label>
              <label className="space-check">
                <input name="needsPastoralFollowup" type="checkbox" /> Request pastoral follow-up
              </label>
              <div className="space-form__wide space-form__actions">
                <button className="hub-button hub-button--primary" type="submit">
                  Post prayer request
                </button>
                <small>
                  Prayer records remain private to the selected audience and are excluded from
                  marketing profiles and AI processing by default.
                </small>
              </div>
            </form>
          </section>

          <section className="prayer-list">
            {workspace.requests.length ? (
              workspace.requests.map((request) => (
                <article className={`prayer-card prayer-card--${request.status}`} key={request.id}>
                  <div className="prayer-card__body prayer-card__body--always">
                    <header className="prayer-production-heading">
                      <span className="prayer-card__icon" aria-hidden="true">
                        {request.status === "answered" ? "✓" : "◉"}
                      </span>
                      <div>
                        <small>
                          {request.displayMode.replaceAll("_", " ")} · {request.privacyScope.replaceAll("_", " ")} ·{" "}
                          {new Date(request.createdAt).toLocaleDateString()}
                        </small>
                        <h2>{request.title}</h2>
                      </div>
                      <span className={`space-status space-status--${request.status}`}>{request.status}</span>
                    </header>
                    <p>{request.requestText}</p>
                    {request.answerTestimony ? (
                      <div className="answered-testimony">
                        <strong>Answer update</strong>
                        <span>{request.answerTestimony}</span>
                      </div>
                    ) : null}
                    <div className="prayer-actions">
                      <form action={recordPrayerSupportAction}>
                        <input type="hidden" name="prayerRequestId" value={request.id} />
                        <input type="hidden" name="supportType" value="prayed" />
                        <button className="prayed-button" type="submit">
                          I prayed · {request.prayedCount}
                        </button>
                      </form>
                    </div>
                    {request.supports.filter((item) => item.type !== "prayed").length ? (
                      <div className="space-thread">
                        {request.supports
                          .filter((item) => item.type !== "prayed")
                          .map((support) => (
                            <div key={support.id}>
                              <strong>{support.type}</strong>
                              <span>{support.message}</span>
                              <small>{new Date(support.createdAt).toLocaleString()}</small>
                            </div>
                          ))}
                      </div>
                    ) : null}
                    {request.allowEncouragement ? (
                      <form className="inline-reply" action={recordPrayerSupportAction}>
                        <input type="hidden" name="prayerRequestId" value={request.id} />
                        <input type="hidden" name="supportType" value="encouragement" />
                        <textarea name="message" rows={3} maxLength={2000} required placeholder="Offer kind, non-directive encouragement…" />
                        <label className="space-check">
                          <input name="requesterOnly" type="checkbox" /> Show only to the requester
                        </label>
                        <button className="hub-button hub-button--secondary" type="submit">
                          Post encouragement
                        </button>
                      </form>
                    ) : null}
                    {request.mine && request.status === "open" ? (
                      <div className="space-two-column prayer-owner-actions">
                        <form className="inline-reply" action={markPrayerAnsweredAction}>
                          <input type="hidden" name="prayerRequestId" value={request.id} />
                          <label>
                            Optional answer update
                            <textarea name="answerTestimony" rows={3} maxLength={4000} />
                          </label>
                          <button className="hub-button hub-button--primary" type="submit">
                            Mark answered
                          </button>
                        </form>
                        <form action={archivePrayerRequestAction}>
                          <input type="hidden" name="prayerRequestId" value={request.id} />
                          <button className="hub-button hub-button--secondary" type="submit">
                            Archive request
                          </button>
                        </form>
                      </div>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <section className="real-data-state">
                <h2>No prayer requests are visible in your approved audience.</h2>
                <p>Use the form above to share a request, or return later to pray through the list.</p>
              </section>
            )}
          </section>
        </div>
      )}
    </>
  );
}
