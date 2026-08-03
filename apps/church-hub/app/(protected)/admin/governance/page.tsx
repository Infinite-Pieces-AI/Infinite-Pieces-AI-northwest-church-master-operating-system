
import { AdminWorkspaceShell } from "@/components/admin-workspace-shell";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function Page() {
  await requirePermission("audit.read");
  return <AdminWorkspaceShell title="Governance and audit" description="Access reviews, retention, deletion, incidents, backup restores, vendors, account ownership, release gates, and policy acknowledgements." />;
}
