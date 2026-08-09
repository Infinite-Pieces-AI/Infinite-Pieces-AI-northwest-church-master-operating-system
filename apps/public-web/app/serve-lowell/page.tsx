import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Serve Lowell Together",
  description:
    "Explore approved public service opportunities, community partnerships, and ways to put faith into practice beside other people in Lowell.",
  alternates: { canonical: "/serve-lowell" },
};

export default function Page() {
  return (
    <ContentPage
      eyebrow="Faith in action"
      title="Serve Lowell beside other people"
      intro="Service should begin with a genuine community need, an accountable partner, clear expectations, and respect for the people being served—not with a membership sales pitch."
      canonicalPath="/serve-lowell"
    >
      <h2>What responsible service should show</h2>
      <div className="guide-grid">
        <article>
          <h3>The actual need</h3>
          <p>
            Explain what the partner or community has requested instead of assuming what people
            need.
          </p>
        </article>
        <article>
          <h3>The accountable partner</h3>
          <p>Name the approved organization or ministry leader responsible for the opportunity.</p>
        </article>
        <article>
          <h3>The practical commitment</h3>
          <p>
            State the date, duration, location, age limits, accessibility, supplies, and skills
            honestly.
          </p>
        </article>
        <article>
          <h3>The real impact</h3>
          <p>
            Share approved outcomes without exploiting vulnerable people or using service recipients
            as marketing props.
          </p>
        </article>
      </div>
      <h2>Find a current opportunity</h2>
      <p>
        Approved public opportunities appear on the event calendar. Member-only shifts,
        transportation details, team communication, and safeguarding requirements belong inside the
        Church Hub.
      </p>
      <Link className="button button--gold" href="/events">
        See public events
      </Link>
    </ContentPage>
  );
}
