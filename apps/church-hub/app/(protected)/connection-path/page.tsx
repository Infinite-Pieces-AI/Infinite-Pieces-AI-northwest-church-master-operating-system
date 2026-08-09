import { ConnectionPathway } from "@/components/connection-pathway";
import { PageHeading } from "@/components/page-heading";
import { requireViewer } from "@/lib/auth/viewer";
import { loadConnectionPathway } from "@/lib/connection-pathway";

export default async function ConnectionPathPage() {
  const viewer = await requireViewer();
  const pathway = await loadConnectionPathway(viewer).catch(() => ({
    status: "active" as const,
    steps: {
      visit: "not_started" as const,
      fellowship: "not_started" as const,
      bible: "not_started" as const,
      service: "not_started" as const,
    },
  }));
  return (
    <>
      <PageHeading
        eyebrow="New here or reconnecting"
        title="My Connection Path"
        description="A voluntary four-week route from a first Sunday to fellowship, Bible conversation, and service. It never becomes a hidden spiritual score."
      />
      <ConnectionPathway initial={pathway} demo={viewer.demo} />
    </>
  );
}
