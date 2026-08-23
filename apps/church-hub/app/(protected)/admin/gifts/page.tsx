import { PageHeading } from "@/components/page-heading";
import { GiftModerationConsole } from "@/components/gift-moderation-console";
import { requireAdminPermission } from "@/lib/auth/require-admin-permission";

export default async function GiftModerationPage() {
  await requireAdminPermission("moderation.review");
  return (
    <>
      <PageHeading
        eyebrow="Ministry administration · Gifts of the Church"
        title="Gift marketplace moderation"
        description="Review member offers, requests, item sharing, paid services, and church needs before they reach the approved member board."
      />
      <GiftModerationConsole />
    </>
  );
}
