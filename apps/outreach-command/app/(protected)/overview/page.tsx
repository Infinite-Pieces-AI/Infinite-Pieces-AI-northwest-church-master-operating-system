import { MorningBrief } from "@/components/morning-brief";
import { PageHeading } from "@/components/page-heading";

export default function OverviewPage() {
  return (
    <>
      <PageHeading
        eyebrow="Today’s respectful ministry intelligence"
        title="Morning Brief"
        description="Answer four questions every day: what people are publicly asking, where the church is missing, which public facts are weak, and what human-approved action should happen next."
      />
      <MorningBrief />
    </>
  );
}
