import { hasPermission } from "@church/authorization";
import { PageHeading } from "@/components/page-heading";
import { ServiceHub } from "@/components/service-hub";
import { requireViewer } from "@/lib/auth/viewer";

export default async function ServePage() {
  const viewer = await requireViewer();
  const canLead =
    hasPermission(viewer.roles, "content.draft") ||
    hasPermission(viewer.roles, "group.manage_assigned") ||
    hasPermission(viewer.roles, "moderation.review") ||
    hasPermission(viewer.roles, "content.publish");

  return (
    <>
      <PageHeading
        eyebrow="Service Marketplace"
        title="Serve"
        description="Find church-hosted projects, approved partners, member-led invitations, self-guided ideas, and public opportunity leads near the ZIP or location you choose."
      />
      <ServiceHub
        mode={viewer.demo ? "showcase" : "live"}
        canLead={canLead}
        defaultPostalCode={process.env.NEXT_PUBLIC_DEFAULT_SERVICE_ZIP ?? "01852"}
      />
    </>
  );
}
