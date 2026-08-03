import { AdminWorkspaceShell } from "@/components/admin-workspace-shell";
import { ApprovalRail, MasterCapabilityBoard, ReadinessChecklist } from "@/components/master-capability-board";
import { requirePermission } from "@/lib/auth/require-permission";

const capabilities = [
  {
    title: "Aggregate Search Performance",
    description: "Imports query, page, impression, click, position, country, and device aggregates from Search Console and ranks opportunities without identifying an individual searcher.",
    status: "configured" as const,
    owner: "Outreach lead",
    boundary: "Private religious questions, prayer activity, member records, and pastoral data are prohibited audience signals.",
    evidence: "search-console-sync + keyword_opportunities"
  },
  {
    title: "People-first Content Studio",
    description: "Creates reviewable briefs for useful Lowell pages, sermon summaries, event descriptions, captions, short-video scripts, alt text, translations, and image prompts.",
    status: "configured" as const,
    owner: "Communications team",
    boundary: "No mass programmatic page generation. Every page needs approved facts, substantive sections, and human review."
  },
  {
    title: "Local presence readiness",
    description: "Tracks official identity, rented-venue evidence, accurate staffed hours, signage, category review, and church-owned recovery access before any profile claim or update.",
    status: "review" as const,
    owner: "Central church liaison",
    boundary: "The platform records readiness; it does not misrepresent ownership, permanent occupancy, or facility hours."
  },
  {
    title: "Campaign Studio",
    description: "Organizes objectives, geography, high-intent keyword groups, landing pages, approved creative, UTM tracking, budget, conversion events, and results.",
    status: "planned" as const,
    owner: "Campaign manager",
    boundary: "No member-list targeting, inferred religious-belief profiles, prayer-page retargeting, or automated budget changes."
  },
  {
    title: "Voluntary visitor CRM",
    description: "Tracks visit requests and user-selected next steps such as a service visit, Bible study, family group, or member access request with consent-aware follow-up.",
    status: "configured" as const,
    owner: "Welcome ministry",
    boundary: "Only voluntarily submitted data is stored; private prayer, child, counseling, and ministry records stay out of ad platforms."
  },
  {
    title: "Approval-controlled social publishing",
    description: "AI can draft captions, image prompts, email notices, and social variants; a named reviewer must approve the exact version before a worker may publish it.",
    status: "review" as const,
    owner: "Communications reviewer",
    boundary: "Automatic social publishing is prohibited by environment and database policy."
  }
];

export default async function Page() {
  await requirePermission("outreach.manage");
  return (
    <>
      <AdminWorkspaceShell
        title="Outreach Studio"
        description="A responsible local discovery and communications system built around useful content, aggregate measurement, voluntary follow-up, and human publication."
      />
      <ApprovalRail
        steps={[
          { label: "Observe", detail: "Import aggregate search and public analytics data.", state: "complete" },
          { label: "Brief", detail: "Combine opportunity signals with approved church facts.", state: "current" },
          { label: "Draft", detail: "Create page, caption, ad, video, and image-prompt drafts.", state: "future" },
          { label: "Approve", detail: "Communications and theological review where needed.", state: "future" },
          { label: "Measure", detail: "Track meaningful public conversions and improve.", state: "future" }
        ]}
      />
      <MasterCapabilityBoard
        heading="Local Discovery and Growth OS"
        introduction="This blends SEO, Google Business Profile logistics, Google Ad Grants readiness, AI-assisted content, campaign operations, social distribution, analytics, and visitor follow-up without trying to identify people from private spiritual searches."
        cards={capabilities}
      />
      <div className="dashboard-grid">
        <ReadinessChecklist
          title="Local profile readiness"
          items={[
            { label: "Official public identity approved", complete: false },
            { label: "Venue representation and operating evidence reviewed", complete: false },
            { label: "Actual staffed service hours confirmed", complete: false },
            { label: "On-site signage and welcome desk documented", complete: false },
            { label: "Primary category reviewed for accuracy", complete: false },
            { label: "Two church-controlled recovery owners assigned", complete: false }
          ]}
        />
        <ReadinessChecklist
          title="Ad Grants evaluation"
          items={[
            { label: "Eligibility and organizational documentation confirmed", complete: false },
            { label: "Church-controlled domain and administrative email", complete: false },
            { label: "Substantive mission and ministry pages published", complete: false },
            { label: "Meaningful conversion tracking configured", complete: false },
            { label: "Specific high-intent keyword groups reviewed", complete: false },
            { label: "Sensitive-audience and advertising policy approved", complete: false }
          ]}
        />
      </div>
    </>
  );
}
