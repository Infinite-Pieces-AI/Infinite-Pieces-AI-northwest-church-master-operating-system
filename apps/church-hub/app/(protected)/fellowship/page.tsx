import { ConnectionConcierge } from "@/components/connection-concierge";
import { FellowshipBoard } from "@/components/fellowship-board";
import { PageHeading } from "@/components/page-heading";

export default function FellowshipPage() {
  return (
    <>
      <PageHeading
        eyebrow="Never do ordinary life alone"
        title="Fellowship"
        description="Member-created prayer walks, playdates, meals, service, sports, outings, and open invitations—without needing someone’s phone number first."
      />

      <section className="fellowship-hero">
        <div className="fellowship-hero__copy">
          <p className="hub-kicker">Belonging made visible</p>
          <h2>See where life is happening. Join gently. Invite freely.</h2>
          <p>
            Fellowship turns ordinary plans into open doors: a family at the park, a prayer walk,
            coffee after work, a service project, an open lunch table, or a whole-church outing.
          </p>
          <div className="fellowship-stat-row">
            <div>
              <strong>6</strong>
              <span>open invitations</span>
            </div>
            <div>
              <strong>91</strong>
              <span>synthetic joins this week</span>
            </div>
            <div>
              <strong>5</strong>
              <span>ways to connect today</span>
            </div>
          </div>
        </div>
        <div className="fellowship-constellation" aria-hidden="true">
          <span>Prayer</span>
          <span>Families</span>
          <span>Meals</span>
          <span>Service</span>
          <span>Sports</span>
          <strong>∞</strong>
        </div>
      </section>

      <ConnectionConcierge />

      <section className="fellowship-principles">
        <article>
          <span aria-hidden="true">01</span>
          <div>
            <strong>Low pressure</strong>
            <p>Come late, leave early, bring children, or simply observe before joining.</p>
          </div>
        </article>
        <article>
          <span aria-hidden="true">02</span>
          <div>
            <strong>Member safe</strong>
            <p>
              General public locations are visible; sensitive meeting details unlock only to
              approved participants.
            </p>
          </div>
        </article>
        <article>
          <span aria-hidden="true">03</span>
          <div>
            <strong>No phone-number barrier</strong>
            <p>Members can discover and join through the Hub, then use a meetup-specific thread.</p>
          </div>
        </article>
        <article>
          <span aria-hidden="true">04</span>
          <div>
            <strong>Ordinary life counts</strong>
            <p>Connection does not require a formal event, a large group, or weeks of planning.</p>
          </div>
        </article>
      </section>

      <FellowshipBoard />

      <section className="hub-panel fellowship-safety-panel">
        <div>
          <p className="hub-kicker">Connection with boundaries</p>
          <h2>Designed to reduce isolation without turning people into location data.</h2>
        </div>
        <ul>
          <li>Public invitations use public or general meeting places, not home addresses.</li>
          <li>Exact meeting instructions can be limited to approved attendees.</li>
          <li>Children do not create meetups or appear in searchable attendance lists.</li>
          <li>Teen gatherings remain group-based and leader-visible.</li>
          <li>Moderators can pause, report, or remove unsafe invitations.</li>
        </ul>
      </section>
    </>
  );
}
