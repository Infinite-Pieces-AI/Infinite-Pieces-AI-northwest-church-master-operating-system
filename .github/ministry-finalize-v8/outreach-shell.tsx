import type { ReactNode } from "react";
import Link from "next/link";
import type { OutreachViewer } from "@/lib/auth/viewer";
import { canManageRecoveryOutreach } from "@/lib/auth/recovery-outreach";
import { OutreachNav } from "./outreach-nav";

export function OutreachShell({
  viewer,
  children,
}: {
  viewer: OutreachViewer;
  children: ReactNode;
}) {
  const publicUrl = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const hubUrl = process.env.NEXT_PUBLIC_CHURCH_HUB_URL ?? "http://localhost:3001";
  const canRecoveryOutreach = canManageRecoveryOutreach(viewer.roles);

  return (
    <div className="os-shell">
      <aside className="os-sidebar">
        <Link className="os-brand" href="/radar">
          <span aria-hidden="true">∞</span>
          <div>
            <strong>Outreach Intelligence</strong>
            <small>Boston Church Lowell</small>
          </div>
        </Link>
        <OutreachNav canRecoveryOutreach={canRecoveryOutreach} />
        <div className="source-boundary">
          <span className="source-boundary__icon" aria-hidden="true">
            ◉
          </span>
          <div>
            <strong>Public-source boundary</strong>
            <p>
              Aggregate search data and publicly available discussions only. No private-group
              crawling, individual religious profiling, treatment-patient research, or recovery-member
              targeting.
            </p>
          </div>
        </div>
      </aside>
      <div className="os-main">
        <header className="os-topbar">
          <div className="topbar-status">
            <span>
              <i className="status-dot status-dot--demo" />
              {viewer.demo ? "Interactive showcase" : "Connected intelligence"}
            </span>
            <span>
              <i className="status-dot status-dot--safe" />
              Human approval required
            </span>
          </div>
          <div className="topbar-actions">
            <a href={publicUrl}>Public site ↗</a>
            <a href={hubUrl}>Church Hub ↗</a>
            <div className="viewer-chip">
              <span>{viewer.displayName.slice(0, 1)}</span>
              <div>
                <strong>{viewer.displayName}</strong>
                <small>{viewer.demo ? "Showcase operator" : viewer.email}</small>
              </div>
            </div>
          </div>
        </header>
        {viewer.demo ? (
          <div className="demo-rail">
            <strong>Interactive showcase:</strong> opportunities, traffic, organizations, people,
            rankings, and campaign results shown in preview mode remain fictional browser-only data
            until approved integrations are connected.
          </div>
        ) : null}
        <main className="os-content">{children}</main>
      </div>
    </div>
  );
}
