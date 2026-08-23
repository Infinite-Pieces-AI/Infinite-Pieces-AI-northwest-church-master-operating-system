import Link from "next/link";
import { hasPermission } from "@church/authorization";
import { GiftsOfChurch } from "@/components/gifts-of-church";
import { PageHeading } from "@/components/page-heading";
import { requireViewer } from "@/lib/auth/viewer";

const giftNeedLeaderRoles = new Set(["group_leader", "minister", "super_admin"]);

export default async function GiftsPage() {
  const viewer = await requireViewer();
  const canLead = viewer.roles.some((role) => giftNeedLeaderRoles.has(role));
  const canModerate = hasPermission(viewer.roles, "moderation.review");

  return (
    <>
      <PageHeading
        eyebrow="Gifts of the Church"
        title="Use what God has given you"
        description="Discover strengths, offer practical skills, share useful items, respond to member needs, and help leaders fill real ministry opportunities."
      />
      {canModerate ? (
        <div className="module-admin-link">
          <Link href="/admin/gifts">Open gift marketplace moderation →</Link>
        </div>
      ) : null}
      <GiftsOfChurch
        mode={viewer.demo ? "showcase" : "live"}
        canLead={canLead}
        assessmentUrl={process.env.NEXT_PUBLIC_SPIRITUAL_GIFTS_ASSESSMENT_URL}
      />
    </>
  );
}
