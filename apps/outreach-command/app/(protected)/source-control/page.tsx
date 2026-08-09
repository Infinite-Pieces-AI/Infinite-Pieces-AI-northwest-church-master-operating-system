import { PageHeading } from "@/components/page-heading";
import { SourceControl } from "@/components/source-control";

export default function SourceControlPage() {
  return (
    <>
      <PageHeading
        eyebrow="Connectors, allowlists, and auditability"
        title="Source Control"
        description="Control exactly which public sources, official APIs, RSS feeds, analytics systems, and publishing accounts may enter the Outreach OS. Private or bypassed sources are rejected by design."
      />
      <SourceControl />
    </>
  );
}
