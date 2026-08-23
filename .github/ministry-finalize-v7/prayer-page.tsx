import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { PrayerWellComplete } from "@/components/prayer-well-complete";
import { requireViewer } from "@/lib/auth/viewer";

const restrictedPrayerRoles = new Set(["minister", "safety_admin", "super_admin"]);

export default async function PrayerPage() {
  const viewer = await requireViewer();
  const canLead =
    viewer.demo ||
    (viewer.aal === "aal2" && viewer.roles.some((role) => restrictedPrayerRoles.has(role)));

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
