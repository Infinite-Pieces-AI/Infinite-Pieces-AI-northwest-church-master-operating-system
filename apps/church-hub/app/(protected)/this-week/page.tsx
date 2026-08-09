import Link from "next/link";
import { ConnectionConcierge } from "@/components/connection-concierge";
import { ConnectionPathway } from "@/components/connection-pathway";
import { PageHeading } from "@/components/page-heading";
import { requireViewer } from "@/lib/auth/viewer";
import { fellowshipMeetups } from "@/lib/demo-data";
import { loadConnectionPathway } from "@/lib/connection-pathway";
import { loadThisWeekData } from "@/lib/this-week";

export default async function ThisWeekPage() {
  const viewer = await requireViewer();
  const [d, connectionPathway] = await Promise.all([
    loadThisWeekData(viewer),
    loadConnectionPathway(viewer),
  ]);
  if (!d) {
    return (
      <>
        <PageHeading
          eyebrow="Personalized weekly home"
          title="This Week"
          description="The approved weekly snapshot is temporarily unavailable. No sample content is shown in production."
        />
        <section className="hub-panel">
          <h2>Try again shortly</h2>
          <p>Leaders can verify the current schedule and lesson in the administration console.</p>
          <Link className="hub-button hub-button--secondary" href="/events">
            Open events
          </Link>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeading
        eyebrow="Your week with God and people"
        title="This Week"
        description="See what is happening, take the next step in Scripture, and move toward a real conversation, gathering, or act of service without turning the app into an endless feed."
        actions={
          <div className="heading-actions">
            <Link className="hub-button hub-button--primary" href="/fellowship">
              Find fellowship
            </Link>
            <Link className="hub-button hub-button--secondary" href="/service">
              Find service
            </Link>
            <Link className="hub-button hub-button--secondary" href="/notifications">
              Notifications
            </Link>
          </div>
        }
      />
      <section className="week-hero week-hero--connection">
        <div>
          <p className="hub-kicker">Next gathering</p>
          <h2>{d.service.title}</h2>
          <strong>
            {d.service.dateLabel} · {d.service.time}
          </strong>
          <span>
            {d.service.location}
            <br />
            {d.service.address}
          </span>
          <p className="week-hero__promise">
            Come worship, then stay connected through open lunch tables, prayer walks, groups,
            member-created invitations, and approved service opportunities.
          </p>
          <div className="row-actions">
            <a
              className="hub-button hub-button--light"
              href="https://www.google.com/maps/search/?api=1&query=1140+Gorham+Street+Lowell+MA"
            >
              Directions
            </a>
            <Link className="hub-button hub-button--ghost-light" href="/events">
              Full calendar
            </Link>
          </div>
        </div>
        <div className="week-hero__mark" aria-hidden="true">
          ∞
        </div>
      </section>

      <ConnectionConcierge compact />
      <ConnectionPathway initial={connectionPathway} demo={viewer.demo} />

      <div className="dashboard-grid">
        <section className="hub-panel hub-panel--span2 lesson-feature-panel">
          <div className="panel-heading">
            <div>
              <p className="hub-kicker">Current journey · {d.lesson.series}</p>
              <h2>{d.lesson.title}</h2>
            </div>
            <span className="pill">{d.lesson.scripture}</span>
          </div>
          <p>{d.lesson.summary}</p>
          <div className="lesson-feature-steps">
            <span>Read</span>
            <span>Notice</span>
            <span>Pray</span>
            <span>Practice</span>
            <span>Share</span>
          </div>
          <div className="row-actions">
            <Link className="hub-button hub-button--primary" href="/bible">
              Continue Bible journey
            </Link>
            <Link className="hub-button hub-button--secondary" href="/fellowship">
              Find someone to discuss it with
            </Link>
          </div>
        </section>

        <section className="hub-panel scripture-card">
          <p className="hub-kicker">Scripture of the week</p>
          <h2>{d.scriptureOfWeek.reference}</h2>
          <p>{d.scriptureOfWeek.note}</p>
          <Link href="/bible">Open the story →</Link>
        </section>

        <section className="hub-panel hub-panel--span2 fellowship-preview-panel">
          <div className="panel-heading">
            <div>
              <p className="hub-kicker">Open doors this week</p>
              <h2>Members are already making plans.</h2>
            </div>
            <Link href="/fellowship">See all invitations</Link>
          </div>
          <div className="fellowship-preview-list">
            {fellowshipMeetups.slice(0, 3).map((meetup) => (
              <Link href="/fellowship" key={meetup.id}>
                <span className="fellowship-preview-icon" aria-hidden="true">
                  {meetup.spontaneous ? "⚡" : "∞"}
                </span>
                <div>
                  <strong>{meetup.title}</strong>
                  <small>
                    {meetup.dateLabel} · {meetup.timeLabel}
                  </small>
                  <span>
                    {meetup.locationName} · {meetup.attendeeCount} joining
                  </span>
                </div>
                <b>Join</b>
              </Link>
            ))}
          </div>
        </section>

        <section className="hub-panel service-preview-card">
          <p className="hub-kicker">Serve together</p>
          <h2>See the need before signing up.</h2>
          <p>
            Service Marketplace shows the approved need, partner, time, role, accessibility,
            supplies, transportation, and safeguarding information.
          </p>
          <Link href="/service">Open Service Marketplace →</Link>
        </section>

        <section className="hub-panel minister-card">
          <p className="hub-kicker">Minister announcement</p>
          <h2>{d.announcement.title}</h2>
          <p>{d.announcement.body}</p>
          {viewer.demo ? <span className="privacy-note">Synthetic demo content</span> : null}
        </section>

        <section className="hub-panel hub-panel--span2">
          <div className="panel-heading">
            <div>
              <p className="hub-kicker">Coming up</p>
              <h2>My events</h2>
            </div>
            <Link href="/events">See all</Link>
          </div>
          {d.events.length ? (
            <div className="compact-list">
              {d.events.map((event) => (
                <article key={event.id}>
                  <span className="list-icon" aria-hidden="true">
                    □
                  </span>
                  <div>
                    <strong>{event.title}</strong>
                    <small>
                      {event.when} · {event.audience}
                    </small>
                  </div>
                  <button aria-label={`Respond to ${event.title}`}>Respond</button>
                </article>
              ))}
            </div>
          ) : (
            <p>No approved upcoming events are currently assigned.</p>
          )}
        </section>

        <section className="hub-panel">
          <p className="hub-kicker">My community</p>
          <h2>Assigned groups</h2>
          {d.groups.length ? (
            <div className="compact-list">
              {d.groups.map((group) => (
                <Link href="/community" key={group.id}>
                  <span className="list-icon" aria-hidden="true">
                    ◌
                  </span>
                  <div>
                    <strong>{group.name}</strong>
                    <small>{group.role}</small>
                  </div>
                  {group.unread ? <span className="unread">{group.unread}</span> : null}
                </Link>
              ))}
            </div>
          ) : (
            <p>No active group assignment is available.</p>
          )}
        </section>

        <section className="hub-panel">
          <p className="hub-kicker">Kids Kingdom</p>
          <h2>Household status</h2>
          {d.kids.length ? (
            d.kids.map((child) => (
              <div className="child-summary" key={child.id}>
                <span aria-hidden="true">S</span>
                <div>
                  <strong>{child.displayName}</strong>
                  <small>
                    {child.className} · {child.status}
                  </small>
                </div>
              </div>
            ))
          ) : (
            <p>Open family tools for guardian-managed class and check-in status.</p>
          )}
          <Link href="/family">Open family tools →</Link>
        </section>
      </div>
    </>
  );
}
