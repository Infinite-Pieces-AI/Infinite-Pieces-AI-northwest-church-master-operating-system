import { RecoveryOutreachWorkspace } from "@/components/recovery-outreach-workspace";
import { loadRecoveryOutreachData } from "@/lib/recovery-outreach";

export const dynamic = "force-dynamic";

export default async function RecoveryOutreachPage() {
  const data = await loadRecoveryOutreachData();
  return (
    <RecoveryOutreachWorkspace
      configured={data.configured}
      resources={data.resources}
      opportunities={data.opportunities}
      inquiries={data.inquiries}
    />
  );
}
