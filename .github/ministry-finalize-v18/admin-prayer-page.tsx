import { redirect } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { PrayerLeaderConsole } from "@/components/prayer-leader-console";
import { requireViewer } from "@/lib/auth/viewer";

const restrictedPrayerRoles = new Set(["minister", "safety_admin", "super_admin"]);

export default async function PrayerLeaderPage() {
  const viewer = await requireViewer();
  const canReview = viewer.roles.some((role) => restrictedPrayerRoles.has(role));
  if (!canReview) redirect("/this-week?error=forbidden");
  if (!viewer.demo && viewer.aal !== "aal2") {
    redirect(`/mfa?next=${encodeURIComponent("/admin/prayer")}`);
  }

  return (
    <>
      <PageHeading
        eyebrow="Ministry administration · Prayer Well"
        title="Restricted prayer routing"
        description="Coordinate authorized pastoral and safeguarding follow-up without exposing sensitive requests in the member Prayer Well, ordinary channels, AI tools, or Outreach OS."
      />
      <PrayerLeaderConsole mode={viewer.demo ? "showcase" : "live"} />
    </>
  );
}
