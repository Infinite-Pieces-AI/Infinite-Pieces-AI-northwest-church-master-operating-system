import Link from "next/link";
import { LiveDataNotice, LiveMetric } from "@/components/live-data-ui";
import { PageHeading } from "@/components/page-heading";
import { loadOutreachOverview, outreachBackendConfigured } from "@/lib/live-intelligence";

const commandLinks: ReadonlyArray<readonly [string, string, string]> = [
  [
    "/member-access",
    "Member access",
    "Review Church Hub invitation requests and voluntary public inquiries.",
  ],
  ["/morning-brief", "Morning brief", "See the highest-priority human actions for the day."],
  [
    "/radar",
    "Command Radar",
    "Review approved public conversation signals without private-group monitoring.",
  ],
  [
    "/search-intelligence",
    "Search Intelligence",
    "See aggregate query, page, and AI-visibility evidence.",
  ],
  ["/visitor-crm", "Visitor CRM", "Coordinate consented follow-up after a person submits a form."],
  [
    "/production-readiness",
    "Production readiness",
    "See which integrations and governance gates are configured.",
  ],
];

export default async function OverviewPage() {
  const overview = await loadOutreachOverview();

  return (
    <>
      <PageHeading
        eyebrow="Real public-discovery operations"
        title="Outreach Intelligence OS"
        description="A private, human-controlled workspace for public-source intelligence, aggregate search performance, content review, voluntary visitor follow-up, and local-presence accuracy."
      />
      {!outreachBackendConfigured() ? (
        <LiveDataNotice title="Production backend is not connected" warning>
          <p>
            This workspace does not fabricate traffic, public conversations, visitors, or rankings.
            Configure the church-owned Supabase project and approved connectors to populate live
            data.
          </p>
        </LiveDataNotice>
      ) : (
        <LiveDataNotice title="Live-data mode">
          <p>
            Every count below is read from the authorized production database for this operator.
          </p>
        </LiveDataNotice>
      )}
      <div className="metric-grid" style={{ marginTop: 18 }}>
        <LiveMetric
          label="Member access queue"
          value={overview.pendingAccessRequests}
          detail="Pending or under-review Hub access requests"
          tone="gold"
        />
        <LiveMetric
          label="Visitor follow-up"
          value={overview.newVisitorRequests}
          detail="New public requests requiring a human owner"
          tone="blue"
        />
        <LiveMetric
          label="Public signals"
          value={overview.radarSignals}
          detail="Current approved public-source opportunities"
          tone="green"
        />
        <LiveMetric
          label="Content review"
          value={overview.contentReviewItems}
          detail="Draft or in-review content briefs"
          tone="gold"
        />
        <LiveMetric
          label="Active campaigns"
          value={overview.activeCampaigns}
          detail="Approved or active contextual campaigns"
          tone="blue"
        />
        <LiveMetric
          label="Connector review"
          value={overview.connectorReviewItems}
          detail="Connectors needing review or suspension resolution"
          tone="rose"
        />
      </div>
      <section className="live-command-grid">
        {commandLinks.map(([href, title, description]) => (
          <Link href={href} key={href}>
            <span aria-hidden="true">↗</span>
            <strong>{title}</strong>
            <p>{description}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
