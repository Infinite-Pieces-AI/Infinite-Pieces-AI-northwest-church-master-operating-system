import type { ReactNode } from "react";
import Link from "next/link";
import type { OutreachViewer } from "@/lib/auth/viewer";
import { OutreachNav } from "./outreach-nav";

export function OutreachShell({ viewer, children }: { viewer: OutreachViewer; children: ReactNode }) {
  const publicUrl = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const hubUrl = process.env.NEXT_PUBLIC_CHURCH_HUB_URL ?? "http://localhost:3001";
  const environment = viewer.demo ? "Demo environment" : process.env.VERCEL_ENV ?? "Production environment";

  return (
    <div className="os-shell">
      <aside className="os-sidebar">
        <Link className="os-brand" href="/overview">
          <span aria-hidden="true">∞</span>
          <div><strong>Outreach Intelligence</strong><small>Boston Church Lowell</small></div>
        </Link>
        <OutreachNav />
        <div className="source-boundary">
          <span className="source-boundary__icon" aria-hidden="true">◉</span>
          <div><strong>Public-source boundary</strong><p>Aggregate search data and approved public discussions only. No private-group crawling, searcher identity, or individual religious profiling.</p></div>
        </div>
      </aside>
      <div className="os-main">
        <header className="os-topbar">
          <div className="topbar-status">
            <span><i className="status-dot status-dot--demo" />{environment}</span>
            <span><i className="status-dot status-dot--safe" />AAL2 · human approval required</span>
          </div>
          <div className="topbar-actions">
            <a href={publicUrl}>Public site ↗</a>
            <a href={hubUrl}>Church Hub ↗</a>
            <div className="viewer-chip"><span>{viewer.displayName.slice(0, 1)}</span><div><strong>{viewer.displayName}</strong><small>{viewer.demo ? "Synthetic demo operator" : viewer.email}</small></div></div>
          </div>
        </header>
        {viewer.demo ? <div className="demo-rail"><strong>Synthetic demo:</strong> opportunities, traffic, people, rankings, source results, and campaign outcomes are fictional until approved integrations are connected.</div> : null}
        <main className="os-content">{children}</main>
      </div>
    </div>
  );
}
