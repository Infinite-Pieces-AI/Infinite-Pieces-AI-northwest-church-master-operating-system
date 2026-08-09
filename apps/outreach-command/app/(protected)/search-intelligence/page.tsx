import { MetricCard } from "@/components/metric-card";
import { PageHeading } from "@/components/page-heading";
import { SearchIntelligence } from "@/components/search-intelligence";

export default function SearchIntelligencePage() {
  return (
    <>
      <PageHeading
        eyebrow="SEO + AIO discovery"
        title="Search Intelligence"
        description="See aggregate queries, missing pages, ranking gaps, and AI-answer visibility so the public website becomes easier for local families and online seekers to understand and find."
      />
      <div className="metric-grid">
        <MetricCard
          label="Synthetic impressions"
          value="4.7K"
          detail="Across the current opportunity set"
          trend="Demo data until Search Console connects"
          tone="blue"
        />
        <MetricCard
          label="Page gaps"
          value="3"
          detail="High-intent topics without a dedicated page"
          trend="Online, Zoom, young adults"
          tone="gold"
        />
        <MetricCard
          label="Average CTR"
          value="2.8%"
          detail="Across tracked synthetic queries"
          trend="Opportunity exists in titles and answers"
          tone="green"
        />
        <MetricCard
          label="AI visibility gaps"
          value="3"
          detail="Prompts where the church is absent or weak"
          trend="No attempt to manipulate answer engines"
          tone="rose"
        />
      </div>
      <SearchIntelligence />
    </>
  );
}
