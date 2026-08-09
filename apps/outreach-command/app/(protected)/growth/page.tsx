import { MetricCard } from "@/components/metric-card";
import { PageHeading } from "@/components/page-heading";
import { GrowthIntelligence } from "@/components/growth-intelligence";

export default function GrowthPage() {
  return (
    <>
      <PageHeading
        eyebrow="Aggregate visitor journeys"
        title="Growth Intelligence"
        description="Measure how public discovery becomes a voluntary next step: Plan a Visit, an event registration, a Bible-study request, an online conversation, or a request for follow-up."
      />
      <div className="metric-grid">
        <MetricCard label="Synthetic visits" value="1,206" detail="Thirty-day public website traffic" trend="+34% illustrative trend" tone="blue" />
        <MetricCard label="Meaningful conversions" value="91" detail="Voluntary public actions, not time-on-site" trend="7.5% illustrative rate" tone="gold" />
        <MetricCard label="Online requests" value="38" detail="Synthetic Zoom or online conversation requests" trend="18 attended in demo funnel" tone="green" />
        <MetricCard label="Unassigned requests" value="1" detail="Welcome-team ownership gap" trend="Requires human follow-up" tone="rose" />
      </div>
      <GrowthIntelligence />
    </>
  );
}
