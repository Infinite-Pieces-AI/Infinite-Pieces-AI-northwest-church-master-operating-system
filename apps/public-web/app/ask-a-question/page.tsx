import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { QuestionForm } from "@/components/question-form";

export const metadata: Metadata = {
  title: "Ask Boston Church Lowell a Question",
  description:
    "Ask about a first visit, beliefs, Bible study, children or teens, accessibility, online participation, or another practical topic.",
  alternates: { canonical: "/ask-a-question" },
};

export default function Page() {
  return (
    <ContentPage
      eyebrow="Questions are welcome"
      title="Ask before you decide"
      intro="Choose the topic and the contact method. This form is for general public questions; prayer uses a separate restricted workflow."
      canonicalPath="/ask-a-question"
    >
      <div className="privacy-callout">
        <strong>Your question stays out of advertising audiences.</strong>
        <p>
          Submitted contact details are used only for the response you requested. Prayer, child,
          counseling, and private ministry information should not be entered here.
        </p>
      </div>
      <QuestionForm />
    </ContentPage>
  );
}
