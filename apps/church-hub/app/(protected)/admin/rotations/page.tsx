import { RotationGenerator } from "@/components/rotation-generator";
import { AdminWorkspaceShell } from "@/components/admin-workspace-shell";
import { requirePermission } from "@/lib/auth/require-permission";

function nextMonthValue() {
  const date = new Date();
  date.setUTCMonth(date.getUTCMonth() + 1, 1);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function Page() {
  await requirePermission("group.manage_assigned");
  return (
    <>
      <AdminWorkspaceShell
        title="Volunteer rotations"
        description="Prepare a review-only serving proposal from a vetted roster, blackout dates, and serving preferences. Gemini may assist with the draft, but leaders keep final responsibility for every assignment."
      />
      <RotationGenerator month={nextMonthValue()} />
    </>
  );
}
