import { redirect } from "next/navigation";
import { hasPermission } from "@church/authorization";
import { GiftModerationConsole } from "@/components/gift-moderation-console";
import { PageHeading } from "@/components/page-heading";
import { requireViewer } from "@/lib/auth/viewer";

export default async function GiftModerationPage() {
  const viewer = await requireViewer();
  if (!hasPermission(viewer.roles, "moderation.review")) {
    redirect("/this-week?error=forbidden");
  }
  if (!viewer.demo && viewer.aal !== "aal2") {
    redirect(`/mfa?next=${encodeURIComponent("/admin/gifts")}`);
  }

  return (
    <>
      <PageHeading
        eyebrow="Ministry administration · Gifts"
        title="Gift marketplace moderation"
        description="Review member offers, needs, item sharing, paid services, church needs, risk indicators, and private moderation decisions before broader visibility."
      />
      <GiftModerationConsole mode={viewer.demo ? "showcase" : "live"} />
    </>
  );
}
