import { MetricCard } from "@/components/metric-card";
import { PageHeading } from "@/components/page-heading";
import { RadarWorkspace } from "@/components/radar-workspace";

export default function RadarPage() {
  return (
    <>
      <PageHeading
        eyebrow="Public conversation intelligence"
        title="Command Radar"
        description="Surface publicly available questions and community discussions, score their local and ministry relevance, and prepare transparent human responses—without crawling private groups or building religious dossiers."
      />

      <section className="command-hero">
        <div>
          <p className="eyebrow">Public intelligence → respectful action</p>
          <h2>Understand what people are publicly asking before deciding what the church should say or build.</h2>
          <p>
            Radar combines approved public-source listening, aggregate search demand, local relevance,
            content gaps, and human review. It never reveals private Google searchers or silently
            contacts anyone.
          </p>
        </div>
        <div className="hero-rail" aria-label="Radar operating boundaries">
          <article><span>01</span><div><strong>Public sources</strong><small>Official APIs, RSS, and approved accessible pages</small></div></article>
          <article><span>02</span><div><strong>Explainable scores</strong><small>Local, church, family, online, freshness, opportunity, risk</small></div></article>
          <article><span>03</span><div><strong>Human response</strong><small>Disclosed affiliation and approval before any reply</small></div></article>
        </div>
      </section>

      <div className="metric-grid">
        <MetricCard label="Public opportunities" value="6" detail="Synthetic conversations ready for product review" trend="4 high-priority" tone="blue" />
        <MetricCard label="Local relevance" value="92%" detail="Average among top Lowell-area signals" trend="Lowell + approved nearby towns" tone="gold" />
        <MetricCard label="Online ministry" value="2" detail="Strong online or Zoom-intent opportunities" trend="No live outreach connected" tone="green" />
        <MetricCard label="Sensitive-risk holds" value="1" detail="Opportunity requires a privacy-first response" trend="No marketing audience created" tone="rose" />
      </div>

      <RadarWorkspace />
    </>
  );
}
