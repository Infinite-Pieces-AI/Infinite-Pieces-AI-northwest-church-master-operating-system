import Link from "next/link";
import { churchIdentity, ministries } from "@church/church-content";
import { JsonLd } from "@/components/json-ld";
import { IconCard } from "@/components/icon-card";
import {
  getPublishedEvents,
  getPublishedSchedule,
  getPublishedSermons,
} from "@/lib/published-content";

export default function HomePage() {
  const service = getPublishedSchedule();
  const events = getPublishedEvents().slice(0, 3);
  const sermons = getPublishedSermons().slice(0, 1);
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Church",
    name: churchIdentity.publicName,
    address: {
      "@type": "PostalAddress",
      streetAddress: service.location.addressLine1,
      addressLocality: service.location.city,
      addressRegion: service.location.region,
      postalCode: service.location.postalCode,
      addressCountry: service.location.country,
    },
    parentOrganization: { "@type": "Organization", name: churchIdentity.parentOrganization },
  };

  return (
    <>
      <JsonLd data={organizationData} />
      <section className="hero">
        <div className="hero__glow" aria-hidden="true" />
        <div className="page-shell hero__grid">
          <div className="hero__copy">
            <p className="eyebrow">Boston Church · Lowell / Northwest</p>
            <h1>A place to seek God, build friendships, and serve together.</h1>
            <p className="hero__lead">
              Join us Sunday at{" "}
              <strong>{service.localTime === "10:00" ? "10:00 AM" : service.localTime}</strong> at{" "}
              <strong>{service.location.name}</strong> in Lowell. Come as you are and take your next
              step at your own pace.
            </p>
            <div className="button-row">
              <Link className="button button--gold" href="/plan-a-visit">
                Plan a Visit
              </Link>
              <a className="button button--outline" href={service.location.directionsUrl}>
                Get Directions
              </a>
            </div>
            <div className="hero__trust">
              <span>Sunday worship</span>
              <span>Kids Kingdom</span>
              <span>Teen ministry</span>
              <span>Family groups</span>
            </div>
          </div>
          <aside className="service-card" aria-label="Next service">
            <p className="service-card__label">This Sunday</p>
            <h2>{service.title}</h2>
            <dl>
              <div>
                <dt>Time</dt>
                <dd>{service.localTime === "10:00" ? "10:00 AM" : service.localTime}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{service.location.name}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>
                  {service.location.addressLine1}
                  <br />
                  {service.location.city}, {service.location.region} {service.location.postalCode}
                </dd>
              </div>
            </dl>
            {service.publicMessage ? <p className="status-note">{service.publicMessage}</p> : null}
            <Link href="/what-to-expect">
              What to expect <span aria-hidden="true">→</span>
            </Link>
          </aside>
        </div>
      </section>

      <section className="welcome-strip">
        <div className="page-shell">
          <p>
            <strong>New here?</strong> You do not need to know anyone, dress a certain way, or have
            everything figured out before visiting.
          </p>
          <Link href="/plan-a-visit">Tell us you’re coming</Link>
        </div>
      </section>

      <section className="page-section">
        <div className="page-shell">
          <div className="section-intro">
            <p className="eyebrow">A simple first Sunday</p>
            <h2>Know what will happen before you arrive.</h2>
            <p>
              Clear directions, warm welcome, age-appropriate children’s classes, and people ready
              to answer questions without pressure.
            </p>
          </div>
          <div className="feature-grid">
            <IconCard icon="01" title="Arrive">
              <p>Use the approved parking and entrance instructions on the Plan a Visit page.</p>
            </IconCard>
            <IconCard icon="02" title="Meet us">
              <p>
                A welcome volunteer can help your household find seating and Kids Kingdom check-in.
              </p>
            </IconCard>
            <IconCard icon="03" title="Participate">
              <p>
                Expect worship, prayer, Scripture, teaching, and time to connect after the service.
              </p>
            </IconCard>
          </div>
        </div>
      </section>

      <section className="page-section page-section--tint">
        <div className="page-shell">
          <div className="section-intro">
            <p className="eyebrow">Find your people</p>
            <h2>Community for every season of life.</h2>
          </div>
          <div className="ministry-grid">
            {ministries.map((ministry) => (
              <IconCard
                key={ministry.slug}
                icon={
                  ministry.title === "Kids Kingdom"
                    ? "✦"
                    : ministry.title === "Teen Ministry"
                      ? "↗"
                      : "∞"
                }
                title={ministry.title}
                href={`/${ministry.slug}`}
                linkLabel={ministry.callToAction}
              >
                <p className="card-kicker">{ministry.audience}</p>
                <p>{ministry.description}</p>
              </IconCard>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="page-shell split">
          <div>
            <p className="eyebrow">Current teaching</p>
            <h2>{sermons[0]?.seriesTitle ?? "Weekly teaching"}</h2>
            <h3>{sermons[0]?.title ?? "Approved sermon content appears here"}</h3>
            <p>{sermons[0]?.summary}</p>
            <p className="scripture-chip">{sermons[0]?.scriptureReferences.join(" · ")}</p>
            <Link className="text-cta" href="/sermons">
              Explore sermons and lessons →
            </Link>
          </div>
          <div className="media-placeholder" role="img" aria-label="Sermon media placeholder">
            <span>Weekly sermon video, audio, transcript, and lesson outline</span>
          </div>
        </div>
      </section>

      <section className="page-section page-section--dark">
        <div className="page-shell">
          <div className="section-intro">
            <p className="eyebrow">Upcoming</p>
            <h2>Gather, learn, and serve.</h2>
          </div>
          {events.length ? (
            <div className="event-grid">
              {events.map((event) => (
                <article key={event.id} className="event-card">
                  <p>
                    {new Date(event.startAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <h3>{event.title}</h3>
                  <span>{event.summary}</span>
                  <Link href={`/events/${event.slug}`}>Event details →</Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-public-state">
              <h3>Public event calendar coming online</h3>
              <p>
                Only leader-approved events will appear here. The starter intentionally does not
                publish draft events.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="page-section">
        <div className="page-shell split split--reverse">
          <div className="map-placeholder">
            <span>Lowell, Massachusetts</span>
            <strong>1140 Gorham Street</strong>
          </div>
          <div>
            <p className="eyebrow">Rooted in Lowell</p>
            <h2>Faith that serves our neighbors.</h2>
            <p>
              We want the public website to make it easy to find accurate service information,
              discover community partnerships, and choose a respectful next step.
            </p>
            <Link className="text-cta" href="/lowell-community">
              See community involvement →
            </Link>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="page-shell cta-band__inner">
          <div>
            <p className="eyebrow">Your first step can be simple</p>
            <h2>Let us help you feel prepared for Sunday.</h2>
            <p>
              Share only the details you choose. A welcome volunteer can answer practical questions
              before you arrive.
            </p>
          </div>
          <Link className="button button--gold" href="/plan-a-visit">
            Plan a Visit
          </Link>
        </div>
      </section>
    </>
  );
}
