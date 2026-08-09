import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content-page";
import { QuestionForm } from "@/components/question-form";

export const metadata: Metadata = {
  title: "Questions About Jesus",
  description:
    "Explore who Jesus is, why Christians follow him, what the Gospel means, and how to ask honest questions or begin reading Scripture.",
  alternates: { canonical: "/questions-about-jesus" },
};

export default function Page() {
  return (
    <ContentPage
      eyebrow="Questions are part of seeking"
      title="Start with your questions about Jesus"
      intro="You do not have to settle every question before visiting a church or opening the Bible. Begin with what you genuinely want to understand."
      canonicalPath="/questions-about-jesus"
    >
      <div className="guide-grid">
        <article>
          <h2>Who is Jesus?</h2>
          <p>
            Explore the Gospel accounts, what Jesus taught, how he treated people, and the Christian
            claim about his death and resurrection.
          </p>
        </article>
        <article>
          <h2>What is the Gospel?</h2>
          <p>
            Ask how grace, repentance, forgiveness, reconciliation, and new life fit together in
            Christian teaching.
          </p>
        </article>
        <article>
          <h2>Can I bring doubt?</h2>
          <p>
            Honest doubt and difficult questions should be discussed carefully rather than hidden or
            answered with pressure.
          </p>
        </article>
        <article>
          <h2>Where should I read?</h2>
          <p>
            Begin with a Gospel, a short passage connected to current teaching, or the whole-Bible
            journey used by the Church Hub.
          </p>
        </article>
      </div>
      <div className="page-actions">
        <Link className="button button--gold" href="/how-to-start-reading-the-bible">
          Start reading the Bible
        </Link>
        <Link className="button button--outline-dark" href="/sermons">
          Explore current teaching
        </Link>
      </div>
      <h2>Ask a specific question</h2>
      <p>
        An authorized volunteer can respond using the contact method you choose. The form does not
        place you into a religious-interest advertising audience.
      </p>
      <QuestionForm defaultTopic="beliefs" />
    </ContentPage>
  );
}
