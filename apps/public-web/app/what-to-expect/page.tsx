import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content-page";
import { getPublishedSchedule } from "@/lib/published-content";

export const metadata: Metadata = {
  title: "What to Expect on Sunday",
  description:
    "A low-pressure first-visit guide covering arrival, parking, clothing, worship, children, accessibility, coming alone, and what happens after service.",
  alternates: { canonical: "/what-to-expect" },
};

export default function Page() {
  const service = getPublishedSchedule();
  const time = service.localTime === "10:00" ? "10:00 AM" : service.localTime;

  return (
    <ContentPage
      eyebrow="Your first Sunday"
      title="What to expect before, during, and after worship"
      intro="Clear information gives you room to decide how you want to participate. You do not need a member account, special clothing, or prior church experience to attend."
      canonicalPath="/what-to-expect"
    >
      <section className="expect-summary">
        <strong>
          {service.date} · {time}
        </strong>
        <span>
          {service.location.name} · {service.location.addressLine1}, Lowell, Massachusetts
        </span>
      </section>

      <div className="expect-grid">
        <article>
          <span>01</span>
          <h2>Where should I park?</h2>
          <p>
            {service.location.parkingInstructions ||
              "Open the current directions link before traveling and follow church signs and welcome volunteers at the school."}
          </p>
        </article>
        <article>
          <span>02</span>
          <h2>Which entrance should I use?</h2>
          <p>
            {service.location.entranceInstructions ||
              "Current directional signs identify the Sunday entrance. A welcome volunteer can help once you arrive."}
          </p>
        </article>
        <article>
          <span>03</span>
          <h2>What should I wear?</h2>
          <p>
            Wear what lets you participate comfortably. The website does not require a dress code or
            special clothing for guests.
          </p>
        </article>
        <article>
          <span>04</span>
          <h2>Can I come alone?</h2>
          <p>
            Yes. You may sit where you are comfortable, participate at your own pace, and leave when
            the gathering concludes. Conversation afterward is optional.
          </p>
        </article>
        <article>
          <span>05</span>
          <h2>What happens during worship?</h2>
          <p>
            A typical gathering includes worship, prayer, Scripture, teaching, and current
            announcements. Special formats and schedule changes appear in the official service
            notice.
          </p>
        </article>
        <article>
          <span>06</span>
          <h2>Will I be singled out?</h2>
          <p>
            You do not need to create an account or make a public commitment to attend. A welcome
            volunteer may offer help, but you can choose how much conversation feels comfortable.
          </p>
        </article>
        <article>
          <span>07</span>
          <h2>What happens with children?</h2>
          <p>
            Guardians remain in control. Review current Kids Kingdom information, ask questions
            before Sunday, and choose the option that works for your household.
          </p>
        </article>
        <article>
          <span>08</span>
          <h2>What about teens?</h2>
          <p>
            Public teen ministry information explains the approved gathering format and how
            guardians can ask questions. Teen online communication remains group-based and
            leader-visible.
          </p>
        </article>
        <article>
          <span>09</span>
          <h2>Is the building accessible?</h2>
          <p>
            {service.location.accessibilityNotes ||
              "Contact the welcome team before Sunday for help planning an accessible entrance, seating, or other practical support."}
          </p>
        </article>
        <article>
          <span>10</span>
          <h2>How long should I plan?</h2>
          <p>
            Worship begins at {time}. Check the current service notice for special formats, and
            allow extra time only if you would like optional conversation afterward.
          </p>
        </article>
        <article>
          <span>11</span>
          <h2>What happens after the service?</h2>
          <p>
            You may head home, ask a practical question, meet someone, or learn about a meal, family
            group, Bible conversation, or service opportunity.
          </p>
        </article>
        <article>
          <span>12</span>
          <h2>What if I still feel uncertain?</h2>
          <p>
            Ask a question using your preferred contact method. You can also visit without filling
            out a form or requesting member access.
          </p>
        </article>
      </div>

      <div className="page-actions">
        <Link className="button button--gold" href="/plan-a-visit">
          Plan my first Sunday
        </Link>
        <Link className="button button--outline-dark" href="/ask-a-question">
          Ask a question first
        </Link>
      </div>
    </ContentPage>
  );
}
