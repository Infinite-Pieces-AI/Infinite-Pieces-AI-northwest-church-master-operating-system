import { redirect } from "next/navigation";
import { hasPermission } from "@church/authorization";
import { PageHeading } from "@/components/page-heading";
import { RecoveryAdminConsole } from "@/components/recovery-admin-console";
import { requireViewer } from "@/lib/auth/viewer";

export default async function RecoveryAdministrationPage() {
  const viewer = await requireViewer();
  const canManage =
    hasPermission(viewer.roles, "content.draft") ||
    hasPermission(viewer.roles, "safeguarding.review") ||
    hasPermission(viewer.roles, "moderation.review");
  if (!canManage) redirect("/this-week?error=forbidden");

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
