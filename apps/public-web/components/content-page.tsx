import type { ReactNode } from "react";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { siteUrl } from "@/lib/site-url";

export function ContentPage({
  eyebrow,
  title,
  intro,
  children,
  ctaLabel = "Plan a Visit",
  ctaHref = "/plan-a-visit",
  canonicalPath,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
  canonicalPath?: string;
}) {
  const breadcrumbData = canonicalPath
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl("/").toString() },
          {
            "@type": "ListItem",
            position: 2,
            name: title,
            item: siteUrl(canonicalPath).toString(),
          },
        ],
      }
    : null;

  return (
    <>
      {breadcrumbData ? <JsonLd data={breadcrumbData} /> : null}
      <section className="page-hero">
        <div className="page-shell narrow">
          {canonicalPath ? (
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span aria-hidden="true">/</span>
              <span>{title}</span>
            </nav>
          ) : null}
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lead">{intro}</p>
        </div>
      </section>
      <section className="page-section">
        <div className="page-shell narrow prose">{children}</div>
      </section>
      <section className="cta-band">
        <div className="page-shell cta-band__inner">
          <div>
            <p className="eyebrow">Take a low-pressure next step</p>
            <h2>You are welcome to begin with a visit or a conversation.</h2>
          </div>
          <div className="button-row">
            <Link className="button button--outline" href="/ask-a-question">
              Ask a question
            </Link>
            <Link className="button button--gold" href={ctaHref}>
              {ctaLabel}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
