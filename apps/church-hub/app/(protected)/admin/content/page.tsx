import { AdminWorkspaceShell } from "@/components/admin-workspace-shell";
import { ApprovalRail, MasterCapabilityBoard } from "@/components/master-capability-board";
import { requirePermission } from "@/lib/auth/require-permission";

const capabilities = [
  {
    title: "Canonical service publishing",
    description:
      "One approved occurrence updates the public banner, Plan a Visit, member dashboard, event page, structured data, calendar feeds, and reviewable notification and social drafts.",
    status: "configured" as const,
    owner: "Content editor",
    evidence: "locations + service_templates + service_occurrences + overrides",
  },
  {
    title: "Weekly lesson workspace",
    description:
      "Ministers can assemble a series, weekly lesson, Scripture references, outline, resources, discussion questions, audio or video, and ministry-specific follow-up.",
    status: "configured" as const,
    owner: "Teaching ministry",
    boundary:
      "Licensed Bible text remains provider-controlled; the database stores references and approved excerpts only.",
  },
  {
    title: "AI curriculum draft",
    description:
      "A sermon outline can produce a seven-day reflection structure, small-group questions, related Scripture references, parent discussion prompts, and a concise weekly summary.",
    status: "review" as const,
    owner: "Ministerial reviewer",
    boundary:
      "AI output is a draft. It cannot publish doctrine, replace pastoral judgment, or write directly to member channels.",
  },
  {
    title: "Visual and social creative prompts",
    description:
      "The system generates platform-ready image prompts, caption variants, short-video concepts, alt text, and translations aligned to approved facts and the lesson theme.",
    status: "review" as const,
    owner: "Communications reviewer",
    boundary:
      "Generated people may not be presented as actual church members or depict real children without approved media.",
  },
  {
    title: "Citation-based Bible companion",
    description:
      "Retrieval is limited to approved beliefs, sermon transcripts, published lessons, minister-reviewed resources, licensed passages, and public ministry FAQs.",
    status: "blocked" as const,
    owner: "AI governance owner",
    boundary:
      "The answer endpoint remains disabled until source permissions, provider contracts, evaluation, and red-team gates pass.",
  },
  {
    title: "Multi-surface approval and audit",
    description:
      "The exact draft, reviewer, theological approval, scheduled time, final published version, and downstream delivery events are recorded in an auditable workflow.",
    status: "planned" as const,
    owner: "Publishing administrator",
  },
];

export default async function Page() {
  await requirePermission("content.draft");
  return (
    <>
      <AdminWorkspaceShell
        title="Teaching and publishing workspace"
        description="One approved source powers Sunday information, weekly discipleship, community discussion, public outreach, and downstream drafts without losing human control."
      />
      <ApprovalRail
        steps={[
          {
            label: "Source",
            detail: "Minister enters approved facts and sermon outline.",
            state: "complete",
          },
          {
            label: "Generate",
            detail: "Create curriculum, discussion, social, and visual drafts.",
            state: "current",
          },
          {
            label: "Review",
            detail: "Content and theological reviewers inspect exact output.",
            state: "future",
          },
          {
            label: "Schedule",
            detail: "Select surfaces, audience, date, and notification level.",
            state: "future",
          },
          {
            label: "Publish",
            detail: "Execute, record audit evidence, and measure usefulness.",
            state: "future",
          },
        ]}
      />
      <MasterCapabilityBoard
        heading="Ministry Content Engine"
        introduction="The strongest theological and generative-AI ideas now share a single draft-review-publish pipeline. Weekly teaching can become a useful curriculum and outreach package while Scripture licensing, doctrinal approval, child safety, and audience permissions remain enforceable boundaries."
        cards={capabilities}
      />
    </>
  );
}
