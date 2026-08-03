
import { AdminWorkspaceShell } from "@/components/admin-workspace-shell";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function Page() {
  await requirePermission("moderation.review");
  return <AdminWorkspaceShell title="Moderation and safety" description="Report triage, evidence preservation, member safety, limited visibility, escalation, and separation from emergency or mandated reporting." />;
}
