import Link from "next/link";
import { hasPermission } from "@church/authorization";
import { PageHeading } from "@/components/page-heading";
import { PrayerWellComplete } from "@/components/prayer-well-complete";
import { requireViewer } from "@/lib/auth/viewer";

export default async function PrayerPage() {
  const viewer = await requireViewer();
  const canLead =
    hasPermission(viewer.roles, "moderation.review") ||
    hasPermission(viewer.roles, "safeguarding.review") ||
    hasPermission(viewer.roles, "content.publish");

  return (
    <>
      <PageHeading
        eyebrow="Prayer Well"
        title="Carry one another in prayer"
        description="Share requests with the audience you choose, mark when you prayed, offer encouragement, post updates, and remember answered prayers."
      />
      {canLead ? (
        <div className="module-admin-link">
          <Link href="/admin/prayer">Open restricted prayer routing →</Link>
        </div>
      ) : null}
      <PrayerWellComplete mode={viewer.demo ? "showcase" : "live"} canLead={canLead} />
    </>
  );
}
