import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Young Adult Christian Community in Lowell",
  description:
    "Explore worship, honest Bible conversation, friendship, service, and low-pressure ways for young adults to connect in Lowell.",
  alternates: { canonical: "/young-adults-lowell" },
};

export default function Page() {
  return (
    <ContentPage
      eyebrow="Young adults in Lowell"
      title="Faith, friendship, and purpose beyond a weekly event"
      intro="Young adults should be able to ask honest questions, form real friendships, serve beside others, and find a healthy place in the wider church community."
      canonicalPath="/young-adults-lowell"
    >
      <h2>More than a social calendar</h2>
      <p>
        Healthy young-adult ministry connects worship and Scripture with meals, conversations,
        service, mentoring, and relationships across generations.
      </p>
      <h2>Low-pressure ways to begin</h2>
      <div className="guide-grid">
        <article>
          <h3>Attend Sunday</h3>
          <p>See the current time, location, and first-visit guide.</p>
          <Link href="/plan-a-visit">Plan a visit →</Link>
        </article>
        <article>
          <h3>Ask about community</h3>
          <p>Request current information without being added to a marketing list.</p>
          <Link href="/ask-a-question">Ask a question →</Link>
        </article>
        <article>
          <h3>Serve beside others</h3>
          <p>Explore approved public service opportunities and community involvement.</p>
          <Link href="/serve-lowell">Explore service →</Link>
        </article>
      </div>
      <h2>What to look for</h2>
      <p>
        Look for truthful leadership, room for questions, responsible boundaries, friendships that
        extend beyond events, and a community that practices what it teaches.
      </p>
    </ContentPage>
  );
}
