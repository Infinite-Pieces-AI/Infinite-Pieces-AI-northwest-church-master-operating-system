import { PageHeading } from "@/components/page-heading";
import { RecoveryOutreachWorkspace } from "@/components/recovery-outreach-workspace";
import { requireOutreachViewer } from "@/lib/auth/viewer";

export default async function RecoveryOutreachPage() {
  const viewer = await requireOutreachViewer();

  return (
    <>
      <PageHeading
        eyebrow="Recovery support intelligence"
        title="Recovery Outreach"
        description="Coordinate voluntary recovery-support requests, aggregate/public questions, and approved community partnerships without identifying private searchers or profiling anyone’s addiction status."
      />
      <RecoveryOutreachWorkspace mode={viewer.demo ? "showcase" : "live"} />
    </>
  );
}
