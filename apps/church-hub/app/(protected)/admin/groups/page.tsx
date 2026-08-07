import { AdminWorkspaceShell } from "@/components/admin-workspace-shell";
import { ApprovalRail, MasterCapabilityBoard } from "@/components/master-capability-board";
import { requirePermission } from "@/lib/auth/require-permission";

const capabilities = [
  {
    title: "Constraint-based proposal engine",
    description:
      "Keeps households together, honors capacity, leadership, availability, accessibility, and restricted-assignment constraints before optimizing any preference.",
    status: "configured" as const,
    owner: "Family group ministry",
    boundary:
      "The engine creates a proposal only. It never activates groups or notifies members without leader approval.",
    evidence: "packages/group-rotation",
  },
  {
    title: "Graph-aware social novelty",
    description:
      "Uses content-free relationship signals and pairing history to reduce repeated combinations, welcome less-connected households, and increase new fellowship connections.",
    status: "configured" as const,
    owner: "Group coordinators",
    boundary:
      "No message content, prayer content, child activity, or private counseling data may be used as an optimization signal.",
    evidence: "relationship_signals + local-swap refinement",
  },
  {
    title: "Reproducible rotation runs",
    description:
      "Every run records its seed, input snapshot, score, warnings, assignments, and algorithm version so leadership can compare cycles and audit changes.",
    status: "review" as const,
    owner: "Ministry administrator",
    evidence: "rotation_runs and rotation_assignments",
  },
  {
    title: "Manual adjustment and pastoral exceptions",
    description:
      "Authorized leaders can move a household, lock an assignment, or reject a proposal while keeping private reasons out of member-facing explanations.",
    status: "planned" as const,
    owner: "Lead minister",
    boundary:
      "Pastoral and safeguarding reasons remain restricted and are never disclosed as the public reason for an assignment.",
  },
];

export default async function Page() {
  await requirePermission("group.manage_assigned");
  return (
    <>
      <AdminWorkspaceShell
        title="Groups and fellowship rotations"
        description="A deterministic, graph-aware optimizer proposes balanced groups while leaders retain pastoral judgment, manual control, and final approval."
      />
      <ApprovalRail
        steps={[
          {
            label: "Prepare",
            detail: "Clean households, leaders, availability, and capacity.",
            state: "complete",
          },
          {
            label: "Generate",
            detail: "Run hard constraints and graph-aware scoring.",
            state: "current",
          },
          {
            label: "Review",
            detail: "Inspect warnings, novelty, and previous-cycle comparison.",
            state: "future",
          },
          {
            label: "Adjust",
            detail: "Apply authorized manual changes without exposing private reasons.",
            state: "future",
          },
          {
            label: "Activate",
            detail: "Approve memberships, channels, and notifications.",
            state: "future",
          },
        ]}
      />
      <MasterCapabilityBoard
        heading="Fellowship Intelligence"
        introduction="This combines the original constraint-based model with the new graph-partitioning insight. The optimizer maximizes healthy new connections without allowing mathematical novelty to override households, safeguarding, accessibility, leadership, or pastoral judgment."
        cards={capabilities}
      />
    </>
  );
}
