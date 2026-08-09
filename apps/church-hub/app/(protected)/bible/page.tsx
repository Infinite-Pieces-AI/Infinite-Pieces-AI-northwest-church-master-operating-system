import Link from "next/link";
import { BibleJourneyExperience } from "@/components/bible-journey";
import { PageHeading } from "@/components/page-heading";

export default function BiblePage() {
  return (
    <>
      <PageHeading
        eyebrow="Creation to new creation"
        title="Bible Journey"
        description="A sequenced 52-week path through the whole story of Scripture, with personal, couple, family, teen, and group tracks plus an approved-source AI companion."
        actions={
          <Link className="hub-button hub-button--secondary" href="/fellowship">
            Discuss it with someone
          </Link>
        }
      />
      <BibleJourneyExperience />
    </>
  );
}
