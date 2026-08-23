import { hasPermission } from "@church/authorization";
import { PageHeading } from "@/components/page-heading";
import { RecoveryMinistry } from "@/components/recovery-ministry";
import { requireViewer } from "@/lib/auth/viewer";

export default async function RecoveryPage() {
  const viewer = await requireViewer();
  const canLead =
    hasPermission(viewer.roles, "content.draft") ||
    hasPermission(viewer.roles, "moderation.review") ||
    hasPermission(viewer.roles, "safeguarding.review");
  const programName = process.env.NEXT_PUBLIC_RECOVERY_MINISTRY_NAME ?? "Recovery Ministry";
  const officialProgramConfirmed =
    process.env.RECOVERY_OFFICIAL_PROGRAM_CONFIRMED === "true";

  return (
    <>
      <PageHeading
        eyebrow="Private recovery ministry"
        title={programName}
        description="A confidential, adult, church-based peer ministry with weekly Scripture, approved curriculum links, participant connection, leader planning, and clear treatment boundaries."
      />
      <RecoveryMinistry
        mode={viewer.demo ? "showcase" : "live"}
        canLead={canLead}
        programName={programName}
        officialProgramConfirmed={officialProgramConfirmed}
      />
    </>
  );
}
