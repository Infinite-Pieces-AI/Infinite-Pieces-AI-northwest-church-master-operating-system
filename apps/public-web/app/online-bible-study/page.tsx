import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { QuestionForm } from "@/components/question-form";

export const metadata: Metadata = {
  title: "Online Bible Study and Conversation",
  description:
    "Request an approved online Bible conversation or ask when a leader-reviewed Zoom discussion is available.",
  alternates: { canonical: "/online-bible-study" },
};

export default function Page() {
  return (
    <ContentPage
      eyebrow="An online first step"
      title="Explore the Bible from home"
      intro="Online participation should remain personal, voluntary, and leader-reviewed. Request a conversation, ask about current availability, or begin with a public Bible resource."
      canonicalPath="/online-bible-study"
      ctaLabel="Plan an in-person visit"
    >
      <h2>What an online pathway can include</h2>
      <p>
        An approved online pathway may include a scheduled conversation, a small leader-facilitated
        Bible discussion, a sermon resource, or a referral to a local congregation when that better
        serves the person.
      </p>
      <h2>What it does not include</h2>
      <p>
        The church does not silently place people into meetings, contact them without consent, or
        treat a public search as proof of religious belief. A Zoom invitation is created only after
        someone requests one.
      </p>
      <h2>Ask about current availability</h2>
      <QuestionForm defaultTopic="online" />
    </ContentPage>
  );
}
