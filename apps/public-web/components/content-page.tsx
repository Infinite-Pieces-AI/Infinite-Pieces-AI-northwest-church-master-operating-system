import type { ReactNode } from "react";
import Link from "next/link";

export function ContentPage({ eyebrow, title, intro, children, ctaLabel = "Plan a Visit", ctaHref = "/plan-a-visit" }: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <>
      <section className="page-hero"><div className="page-shell narrow"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="lead">{intro}</p></div></section>
      <section className="page-section"><div className="page-shell narrow prose">{children}</div></section>
      <section className="cta-band"><div className="page-shell cta-band__inner"><div><p className="eyebrow">Take the next step</p><h2>You are welcome to begin with a conversation.</h2></div><Link className="button button--gold" href={ctaHref}>{ctaLabel}</Link></div></section>
    </>
  );
}
