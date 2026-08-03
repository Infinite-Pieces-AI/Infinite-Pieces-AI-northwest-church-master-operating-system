
import { PageHeading } from "@/components/page-heading";

export function AdminWorkspaceShell({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <PageHeading eyebrow="Ministry administration" title={title} description={description} />
      <section className="hub-panel">
        <p className="hub-kicker">Starter workspace</p>
        <h2>Review-first workflow connected to least-privilege permissions</h2>
        <p>
          Destructive actions remain behind validated server commands, database policies, MFA-gated
          privileged roles, and audit events. Synthetic demo mode never changes production data.
        </p>
        <div className="workflow-steps" aria-label="Administrative review workflow">
          <span>1 · Draft</span>
          <span>2 · Validate</span>
          <span>3 · Review</span>
          <span>4 · Approve</span>
          <span>5 · Execute</span>
          <span>6 · Audit</span>
        </div>
      </section>
    </>
  );
}
