import { ConnectionPathway } from "@/components/connection-pathway";
import { PageHeading } from "@/components/page-heading";

export default function ConnectionPathPage() {
  return <>
    <PageHeading eyebrow="New here or reconnecting" title="My Connection Path" description="A voluntary four-week route from a first Sunday to fellowship, Bible conversation, and service. It never becomes a hidden spiritual score." />
    <ConnectionPathway />
  </>;
}
