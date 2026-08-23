import { PageHeading } from "@/components/page-heading";
import { RecoveryOutreachWorkspace } from "@/components/recovery-outreach-workspace";
import { loadRecoveryOutreach } from "@/lib/recovery-intelligence";
import { requireOutreachViewer } from "@/lib/auth/viewer";

export default async function RecoveryOutreachPage() {
  const viewer = await requireOutreachViewer();
  const payload = viewer.demo
    ? {
        interests: [],
        topics: [],
        partners: [],
        overview: {
          newInterests: 0,
          unassignedInterests: 0,
          highPriorityTopics: 0,
          approvedPartnerProspects: 0,
        },
      }
    : await loadRecoveryOutreach();

  return (
    <>
      <PageHeading
        eyebrow="Recovery support intelligence"
        title="Recovery Outreach"
        description="Coordinate voluntary recovery-support requests, aggregate/public questions, and approved community partnerships without identifying private searchers or profiling anyone’s addiction status."
      />
      <RecoveryOutreachWorkspace
        initialData={payload}
        viewerId={viewer.id}
        previewMode={viewer.demo}
      />
    </>
  );
}
