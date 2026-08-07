import { AdminWorkspaceShell } from "@/components/admin-workspace-shell";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function Page() {
  await requirePermission("access.approve");
  return (
    <AdminWorkspaceShell
      title="Access and invitations"
      description="Requests are verified by leaders. Invitations are tied to an email, hashed, single-use, expiring, revocable, and audited."
    />
  );
}
