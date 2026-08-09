import Link from "next/link";
import { churchIdentity, ministries } from "@church/church-content";
import { JsonLd } from "@/components/json-ld";
import { IconCard } from "@/components/icon-card";
import { PublicActionLink } from "@/components/public-action-link";
import { VisitorPathways } from "@/components/visitor-pathways";
import { WelcomeVideo } from "@/components/welcome-video";
import {
  getPublishedEvents,
  getPublishedSchedule,
  getPublishedSermons,
} from "@/lib/published-content";

export default function HomePage() {
  const service = getPublishedSchedule();
  const events = getPublishedEvents().slice(0, 3);
  const sermons = getPublishedSermons().slice(0, 1);
  const serviceTime = service.localTime === "10:00" ? "10:00 AM" : service.localTime;
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Church",
    name: churchIdentity.publicName,
    parentOrganization: { "@type": "Organization", name: churchIdentity.parentOrganization },
    location: {
      "@type": "Place",
      name: service.location.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: service.location.addressLine1,
        addressLocality: service.location.city,
        addressRegion: service.location.region,
        postalCode: service.location.postalCode,
        addressCountry: service.location.country,
      },
    },
  };

  return (
    <>
      <JsonLd data={organizationData} />
      <section className="hero hero--journey">
        <div className="hero__glow" aria-hidden="true" />
        <div className="page-shell hero__grid">
          <div className="hero__copy">
            <p className="eyebrow">Boston Church Lowell · Sundays at {serviceTime}</p>
            <h1>Meet Jesus. Find your people. Serve Lowell.</h1>
            <p className="hero__lead">
              Come with your questions. Worship with us, build genuine friendships, and find
              meaningful ways to love and serve our neighbors.
            </p>
            <div className="button-row">
              <Link className="button button--gold" href="/plan-a-visit">
                Plan your first Sunday
              </Link>
              <Link className="button button--outline" href="/ask-a-question">
                Ask a question
              </Link>
            </div>
            <div className="hero__utility">
              <span>{service.location.name}</span>
              <span>{service.location.addressLine1}</span>
              <span>{service.location.city}, Massachusetts</span>
            </div>
            <div className="hero__trust">
              <span>Seek Jesus</span>
              <span>Ask honestly</span>
              <span>Build relationships</span>
              <span>Serve together</span>
            </div>
          </div>
          <aside className="service-card service-card--guest" aria-label="Next Sunday gathering">
            <p className="service-card__label">Your next opportunity to visit</p>
            <h2>{service.title}</h2>
            <dl>
              <div><dt>When</dt><dd>{service.date}<br />{serviceTime}</dd></div>
              <div><dt>Where</dt><dd>{service.location.name}</dd></div>
              <div><dt>Address</dt><dd>{service.location.addressLine1}<br />{service.location.city}, {service.location.region} {service.location.postalCode}</dd></div>
            </dl>
            {service.publicMessage ? <p className="status-note">{service.publicMessage}</p> : null}
            <div className="service-card__actions">
              <PublicActionLink href={service.location.directionsUrl} event="directions_clicked" properties={{ path: "/" }}>
                Get directions →
              </PublicActionLink>
              <Link href="/what-to-expect">See what to expect →</Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="welcome-strip welcome-strip--autonomy">
        <div className="page-shell">
          <p><strong>You can explore at your own pace.</strong> No account is required to attend, watch, ask a question, or learn what Sunday is like.</p>
          <Link href="/can-i-come-to-church-alone">Can I come alone?</Link>
        </div>
      </section>

      <section className="page-section pathway-section">
        <div className="page-shell"><VisitorPathways /></div>
      </section>

      <section className="page-section page-section--tint">
        <div className="page-shell">
          <div className="section-intro">
            <p className="eyebrow">Four promises for a first step</p>
            <h2>A church experience should build trust before asking for commitment.</h2>
          </div>
          <div className="promise-grid">
            <article><span>01</span><h3>You can seek Jesus here.</h3><p>Explore Scripture, teaching, and questions about Jesus without pretending you already know the answers.</p></article>
            <article><span>02</span><h3>You can ask honestly here.</h3><p>Ask about beliefs, the service, Bible study, children, accessibility, or online participation.</p></article>
            <article><span>03</span><h3>You can form relationships here.</h3><p>Sunday worship connects to meals, family groups, Bible conversations, prayer walks, and ordinary shared life.</p></article>
            <article><span>04</span><h3>You can serve people here.</h3><p>Faith becomes practical through approved opportunities to care for neighbors and serve beside others.</p></article>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="page-shell">
          <div className="section-intro">
            <p className="eyebrow">A simple first Sunday</p>
            <h2>Know the next step before you arrive.</h2>
            <p>Clear information reduces first-visit uncertainty and lets you decide how much you want to participate.</p>
          </div>
          <div className="sunday-timeline">
            <article><span>Before</span><div><strong>Arrive when you feel ready</strong><p>Many guests prefer arriving 15–20 minutes early for parking, the entrance, seating, and optional Kids Kingdom questions.</p></div></article>
            <article><span>{serviceTime}</span><div><strong>Worship begins</strong><p>Expect prayer, worship, Scripture, teaching, and current announcements. You can participate at your own pace.</p></div></article>
            <article><span>After</span><div><strong>Stay, talk, or head home</strong><p>Conversation after worship is optional. A welcome volunteer can answer practical questions or introduce you to someone.</p></div></article>
          </div>
          <div className="button-row centered-actions">
            <Link className="button button--gold" href="/what-to-expect">Read the full first-Sunday guide</Link>
            <PublicActionLink className="button button--outline-dark" href="/api/public/schedule/calendar" event="calendar_added" properties={{ path: "/" }} download>
              Add Sunday to my calendar
            </PublicActionLink>
          </div>
        </div>
      </section>

      <WelcomeVideo />

      <section className="page-section page-section--dark">
        <div className="page-shell">
          <div className="section-intro">
            <p className="eyebrow">Belonging beyond the auditorium</p>
            <h2>Ordinary life can become an open invitation.</h2>
            <p>Approved members use the private Church Hub to create safe, low-pressure ways to spend time together.</p>
          </div>
          <div className="public-fellowship-grid">
            {[
              ["Prayer walk", "Walk, talk, and pray in a public place."],
              ["Family playdate", "Parents connect while children enjoy a public park."],
              ["Open meal", "Join a table after worship without already knowing the group."],
              ["Bible conversation", "Discuss the current lesson with room for honest questions."],
              ["Active meetup", "Sports, hiking, and other accessible group activities."],
              ["Serve together", "Join an approved project that meets a genuine community need."],
            ].map(([title, description]) => <article key={title}><span aria-hidden="true">∞</span><h3>{title}</h3><p>{description}</p></article>)}
          </div>
          <p className="privacy-note privacy-note--light">Public pages show only general examples and approved public events. Member identities, attendee lists, private locations, and meetup conversations remain inside authorized Hub workflows.</p>
        </div>
      </section>

      <section className="page-section">
        <div className="page-shell">
          <div className="section-intro"><p className="eyebrow">Find your people</p><h2>Community for every season of life.</h2></div>
          <div className="ministry-grid">
            {ministries.map((ministry) => (
              <IconCard key={ministry.slug} icon={ministry.title === "Kids Kingdom" ? "✦" : ministry.title === "Teen Ministry" ? "↗" : "∞"} title={ministry.title} href={`/${ministry.slug}`} linkLabel={ministry.callToAction}>
                <p className="card-kicker">{ministry.audience}</p><p>{ministry.description}</p>
              </IconCard>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section page-section--tint">
        <div className="page-shell split">
          <div>
            <p className="eyebrow">Current teaching</p>
            <h2>{sermons[0]?.seriesTitle ?? "Weekly teaching"}</h2>
            <h3>{sermons[0]?.title ?? "Approved sermon content appears here"}</h3>
            <p>{sermons[0]?.summary}</p>
            <p className="scripture-chip">{sermons[0]?.scriptureReferences.join(" · ")}</p>
            <Link className="text-cta" href="/sermons">Explore sermons and lessons →</Link>
          </div>
          <div className="media-placeholder" role="img" aria-label="Sermon media area"><span>Video, audio, transcript, Scripture references, and discussion resources</span></div>
        </div>
      </section>

      <section className="page-section">
        <div className="page-shell">
          <div className="section-intro"><p className="eyebrow">Upcoming</p><h2>Gather, learn, and serve.</h2></div>
          {events.length ? (
            <div className="event-grid">
              {events.map((event) => (
                <article key={event.id} className="event-card">
                  <p>{new Date(event.startAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                  <h3>{event.title}</h3><span>{event.summary}</span><Link href={`/events/${event.slug}`}>Event details →</Link>
                </article>
              ))}
            </div>
          ) : <div className="empty-public-state"><h3>See the current Sunday gathering</h3><p>Public events appear only after a leader approves the date, location, audience, and registration details.</p></div>}
        </div>
      </section>

      <section className="page-section page-section--dark">
        <div className="page-shell split split--reverse">
          <div className="map-placeholder"><span>Lowell, Massachusetts</span><strong>{service.location.addressLine1}</strong></div>
          <div><p className="eyebrow">Rooted in Lowell</p><h2>Faith that serves our neighbors.</h2><p>Explore current public events, approved community involvement, and ways to begin serving beside other people without treating service as a membership requirement.</p><Link className="text-cta" href="/serve-lowell">Explore service in Lowell →</Link></div>
        </div>
      </section>

      <section className="cta-band choice-cta-band">
        <div className="page-shell">
          <div className="section-intro"><p className="eyebrow">Choose the next step that fits</p><h2>You do not have to submit a form to begin.</h2></div>
          <div className="choice-grid">
            <PublicActionLink className="choice-card" href={service.location.directionsUrl} event="directions_clicked" properties={{ path: "/" }}><strong>Just get directions</strong><span>Open the current meeting location.</span></PublicActionLink>
            <Link className="choice-card" href="/plan-a-visit"><strong>Tell someone I’m coming</strong><span>Request practical first-visit help.</span></Link>
            <Link className="choice-card" href="/ask-a-question"><strong>Ask a question</strong><span>Choose the topic and contact method.</span></Link>
            <Link className="choice-card" href="/online-bible-study"><strong>Explore an online option</strong><span>Request an approved conversation from home.</span></Link>
            <Link className="choice-card" href="/request-prayer"><strong>Request prayer privately</strong><span>Use a separate restricted workflow.</span></Link>
          </div>
        </div>
      </section>
    </>
  );
}
