import { redirect } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { RecoveryOutreachWorkspace } from "@/components/recovery-outreach-workspace";
import { canManageRecoveryOutreach } from "@/lib/auth/recovery-outreach";
import { requireOutreachViewer } from "@/lib/auth/viewer";

export default async function RecoveryOutreachPage() {
  const viewer = await requireOutreachViewer();
  if (!canManageRecoveryOutreach(viewer.roles)) {
    redirect("/radar?error=recovery-outreach-forbidden");
  }

  return (
    <>
      <PageHeading
        eyebrow="Recovery support · public and aggregate intelligence"
        title="Recovery Outreach"
        description="Research public organizations, aggregate search demand, public recovery-support questions, content gaps, approved partnerships, and voluntary website inquiries without profiling individuals or exposing private Church Hub recovery participation."
      />
      <RecoveryOutreachWorkspace mode={viewer.demo ? "showcase" : "live"} />
    </>
  );
}
