import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { RecoveryMinistryGate } from "@/components/recovery-ministry-gate";
import { requireViewer } from "@/lib/auth/viewer";
import { isRecoveryLeader } from "@/lib/recovery/leadership";

export default async function RecoveryPage() {
  const viewer = await requireViewer();
  const canLead =
    viewer.demo ||
    (viewer.aal === "aal2" &&
      (await isRecoveryLeader(viewer.id, viewer.roles, viewer.demo)));
  const programName = process.env.NEXT_PUBLIC_RECOVERY_MINISTRY_NAME ?? "Recovery Ministry";
  const officialProgramConfirmed = process.env.RECOVERY_OFFICIAL_PROGRAM_CONFIRMED === "true";

  return (
    <>
      <PageHeading
        eyebrow="Private recovery ministry"
        title={programName}
        description="A confidential adult church peer ministry with weekly Scripture, approved curriculum links, participant connection, leader planning, and clear treatment boundaries."
      />
      {canLead ? (
        <div className="module-admin-link">
          <Link href="/admin/recovery">Open recovery administration →</Link>
        </div>
      ) : null}
      <RecoveryMinistryGate
        mode={viewer.demo ? "showcase" : "live"}
        canLead={canLead}
        programName={programName}
        officialProgramConfirmed={officialProgramConfirmed}
      />
    </>
  );
}
