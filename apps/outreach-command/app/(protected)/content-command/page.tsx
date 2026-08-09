import { ContentCommand } from "@/components/content-command";
import { PageHeading } from "@/components/page-heading";

export default function ContentCommandPage() {
  return (
    <>
      <PageHeading
        eyebrow="AI-assisted, approval-controlled"
        title="Content Command"
        description="Turn approved church facts and public questions into useful pages, responses, social drafts, videos, event campaigns, image prompts, and online-ministry pathways—with named human reviewers before publication."
      />
      <ContentCommand />
    </>
  );
}
