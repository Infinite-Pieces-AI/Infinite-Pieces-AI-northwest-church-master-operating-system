import { redirect } from "next/navigation";
import { hasPermission } from "@church/authorization";
import { PageHeading } from "@/components/page-heading";
import { PrayerLeaderConsole } from "@/components/prayer-leader-console";
import { requireViewer } from "@/lib/auth/viewer";

export default async function PrayerLeaderPage() {
  const viewer = await requireViewer();
  const canReview =
    hasPermission(viewer.roles, "safeguarding.review") ||
    hasPermission(viewer.roles, "moderation.review") ||
    hasPermission(viewer.roles, "content.publish");
  if (!canReview) redirect("/this-week?error=forbidden");

  return (
    <>
      <PageHeading
        eyebrow="Ministry administration · Prayer Well"
        title="Restricted prayer routing"
        description="Coordinate authorized pastoral and safeguarding follow-up without exposing sensitive requests in the member Prayer Well, ordinary channels, AI tools, or Outreach OS."
      />
      <PrayerLeaderConsole />
    </>
  );
}
