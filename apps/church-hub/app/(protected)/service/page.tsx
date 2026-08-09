import { PageHeading } from "@/components/page-heading";
import { ServiceMarketplace } from "@/components/service-marketplace";

export default function ServicePage() {
  return <>
    <PageHeading eyebrow="Faith beside other people" title="Service Marketplace" description="Find approved needs, accountable partners, clear shifts, accessibility information, family fit, safeguarding requirements, supplies, and practical impact." />
    <section className="service-hero"><div><p className="hub-kicker">Discover → join → prepare → serve</p><h2>Connection grows when people do meaningful work side by side.</h2><p>Every opportunity should state the real need, who is accountable, what the shift requires, and how the people being served are treated with dignity.</p></div><div className="service-hero__mark" aria-hidden="true">◇</div></section>
    <ServiceMarketplace />
  </>;
}
