import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Contact and Next Steps",
  description:
    "Choose a Sunday visit request, general question, or private prayer request without mixing these different purposes.",
  alternates: { canonical: "/contact" },
};

export default function Page() {
  return (
    <ContentPage
      eyebrow="Choose the right pathway"
      title="How can the church help?"
      intro="Visits, general questions, and prayer are intentionally separated so each request receives the right privacy and follow-up workflow."
      canonicalPath="/contact"
    >
      <div className="guide-grid contact-path-grid">
        <article>
          <span className="path-icon">01</span>
          <h2>Plan a Sunday visit</h2>
          <p>
            See directions and practical details without a form, or ask a welcome volunteer to help
            you prepare.
          </p>
          <Link href="/plan-a-visit">Plan a visit →</Link>
        </article>
        <article>
          <span className="path-icon">02</span>
          <h2>Ask a general question</h2>
          <p>
            Ask about beliefs, Bible study, families, accessibility, online participation, or a
            first visit.
          </p>
          <Link href="/ask-a-question">Ask a question →</Link>
        </article>
        <article>
          <span className="path-icon">03</span>
          <h2>Request prayer privately</h2>
          <p>
            Use a restricted prayer workflow that is separate from public marketing analytics and
            visitor CRM data.
          </p>
          <Link href="/request-prayer">Request prayer →</Link>
        </article>
      </div>
    </ContentPage>
  );
}
