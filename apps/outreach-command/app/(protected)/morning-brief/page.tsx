import { MorningBrief } from "@/components/morning-brief";
import { PageHeading } from "@/components/page-heading";

export default function MorningBriefPage() {
  return (
    <>
      <PageHeading
        eyebrow="One connected ministry journey"
        title="Morning Brief"
        description="Answer four questions from public and aggregate evidence: what people are asking, where the church is missing, which facts or pages are weak, and what respectful action a human should approve today."
      />
      <MorningBrief />
    </>
  );
}
