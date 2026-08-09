import { PageHeading } from "@/components/page-heading";
import { VisitorCrm } from "@/components/visitor-crm";

export default function VisitorCrmPage() {
  return (
    <>
      <PageHeading
        eyebrow="Voluntary follow-up only"
        title="Visitor CRM"
        description="Coordinate consented next steps after someone chooses to submit a form. Public search behavior, private prayer details, children’s information, and inferred beliefs never become lead records."
      />
      <VisitorCrm />
    </>
  );
}
