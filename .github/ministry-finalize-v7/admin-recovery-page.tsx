import { redirect } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { RecoveryAdminConsole } from "@/components/recovery-admin-console";
import { requireViewer } from "@/lib/auth/viewer";
import { isRecoveryLeader } from "@/lib/recovery/leadership";

export default async function RecoveryAdministrationPage() {
  const viewer = await requireViewer();
  const canManage = await isRecoveryLeader(viewer.id, viewer.roles, viewer.demo);
  if (!canManage) redirect("/this-week?error=forbidden");
  if (!viewer.demo && viewer.aal !== "aal2") {
    redirect(`/mfa?next=${encodeURIComponent("/admin/recovery")}`);
  }

  return (
    <>
      <PageHeading
        eyebrow="Ministry administration · Recovery"
        title="Recovery program and access"
        description="Create the private ministry program, review voluntary access requests, confirm curriculum and program-name permissions, and protect participant confidentiality."
      />
      <RecoveryAdminConsole mode={viewer.demo ? "showcase" : "live"} />
    </>
  );
}
