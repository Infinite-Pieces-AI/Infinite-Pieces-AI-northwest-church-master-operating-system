import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content-page";

export const metadata: Metadata = {
  title: "How to Start Reading the Bible",
  description:
    "A simple, non-pressuring way to begin reading Scripture: read, notice, ask, pray, practice, and share questions with a trusted community.",
  alternates: { canonical: "/how-to-start-reading-the-bible" },
};

export default function Page() {
  return (
    <ContentPage
      eyebrow="Begin simply"
      title="How to start reading the Bible"
      intro="You do not need to understand everything at once. Begin with a short passage, pay attention to what it says, and bring honest questions into a trustworthy conversation."
      canonicalPath="/how-to-start-reading-the-bible"
    >
      <div className="sunday-timeline reading-rhythm">
        <article>
          <span>Read</span>
          <div>
            <strong>Choose a manageable passage</strong>
            <p>Start with one Gospel section or the Scripture connected to the current teaching.</p>
          </div>
        </article>
        <article>
          <span>Notice</span>
          <div>
            <strong>Ask what is actually present</strong>
            <p>What does the passage say about God, people, conflict, hope, or response?</p>
          </div>
        </article>
        <article>
          <span>Ask</span>
          <div>
            <strong>Write the questions you still have</strong>
            <p>Questions are part of learning; they do not have to be hidden.</p>
          </div>
        </article>
        <article>
          <span>Pray</span>
          <div>
            <strong>Respond honestly</strong>
            <p>A short prayer can name gratitude, confusion, need, or a desire to understand.</p>
          </div>
        </article>
        <article>
          <span>Practice</span>
          <div>
            <strong>Choose one concrete response</strong>
            <p>Look for one action of faith, honesty, reconciliation, generosity, or care.</p>
          </div>
        </article>
        <article>
          <span>Share</span>
          <div>
            <strong>Discuss it with another person</strong>
            <p>
              A Bible conversation or group can help you learn without pretending you have mastered
              the text.
            </p>
          </div>
        </article>
      </div>
      <div className="page-actions">
        <Link className="button button--gold" href="/sermons">
          See current teaching
        </Link>
        <Link className="button button--outline-dark" href="/bible-studies">
          Explore Bible studies
        </Link>
      </div>
    </ContentPage>
  );
}
