import { redirect } from "next/navigation";
import { hasPermission } from "@church/authorization";
import { PageHeading } from "@/components/page-heading";
import { GiftModerationConsole } from "@/components/gift-moderation-console";
import { requireViewer } from "@/lib/auth/viewer";

export default async function GiftModerationPage() {
  const viewer = await requireViewer();
  if (!hasPermission(viewer.roles, "moderation.review")) redirect("/this-week?error=forbidden");

  return (
    <>
      <PageHeading
        eyebrow="Ministry administration · Gifts of the Church"
        title="Gift marketplace moderation"
        description="Review member offers, requests, item sharing, paid services, and church needs before they reach the approved member board."
      />
      <GiftModerationConsole mode={viewer.demo ? "showcase" : "live"} />
    </>
  );
}
