import { notFound } from "next/navigation";
import { hasPermission } from "@church/authorization";
import { PageHeading } from "@/components/page-heading";
import { ServiceAdmin } from "@/components/service-admin";
import { requireViewer } from "@/lib/auth/viewer";

export default async function ServiceAdminPage() {
  const viewer = await requireViewer();
  const canManage =
    hasPermission(viewer.roles, "content.draft") ||
    hasPermission(viewer.roles, "moderation.review") ||
    hasPermission(viewer.roles, "group.manage_assigned");
  if (!canManage) notFound();

  return (
    <>
      <PageHeading
        eyebrow="Service operations"
        title="Service Hub Administration"
        description="Review member-led proposals, manage sponsorship labels, verify public sources and partner locations, create volunteer shifts, publish approved opportunities, and review consent-safe impact updates."
      />
      <ServiceAdmin
        mode={viewer.demo ? "showcase" : "live"}
        canPublish={hasPermission(viewer.roles, "content.publish")}
      />
    </>
  );
}
