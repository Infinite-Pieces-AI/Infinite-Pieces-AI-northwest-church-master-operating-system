import type { ReactNode } from "react";
import Link from "next/link";
import { hasPermission, type Permission } from "@church/authorization";
import type { Viewer } from "@/lib/auth/viewer";
import { MobileNav } from "./mobile-nav";
import { ServiceWorkerRegistration } from "./service-worker-registration";

const sideItems = [
  ["This Week", "/this-week", "⌂"],
  ["Bible Journey", "/bible", "✦"],
  ["Fellowship", "/fellowship", "∞"],
  ["Community", "/community", "◌"],
  ["Events", "/events", "□"],
  ["Family", "/family", "⌁"]
] as const;

const adminPermissions: readonly Permission[] = [
  "content.draft",
  "access.approve",
  "group.manage_assigned",
  "safeguarding.review",
  "moderation.review",
  "outreach.manage",
  "audit.read",
  "system.health.read"
];

export function AppShell({ viewer, children }: { viewer: Viewer; children: ReactNode }) {
  const canAdmin = adminPermissions.some((permission) =>
    hasPermission(viewer.roles, permission)
  );

  return (
    <div className="hub-shell">
      <ServiceWorkerRegistration />
      <aside className="hub-sidebar">
        <Link className="hub-brand" href="/this-week">
          <span aria-hidden="true">∞</span>
          <strong>Church Hub</strong>
          <small>Lowell · Northwest</small>
        </Link>
        <nav aria-label="Member navigation">
          {sideItems.map(([label, href, icon]) => (
            <Link key={href} href={href}>
              <span aria-hidden="true">{icon}</span>
              {label}
            </Link>
          ))}
          {canAdmin ? (
            <Link href="/admin">
              <span aria-hidden="true">⚙</span>
              Ministry Admin
            </Link>
          ) : null}
        </nav>
        <div className="sidebar-safety">
          <strong>Belonging with boundaries</strong>
          <span>
            Use public meeting places for open invitations. Keep child, prayer, counseling,
            safeguarding, and private-group information inside approved workflows.
          </span>
        </div>
      </aside>
      <div className="hub-main">
        <header className="hub-topbar">
          <div>
            <p>Boston Church Lowell</p>
            <span>Belong · Grow · Follow Jesus together</span>
          </div>
          <div className="viewer-chip">
            <span>{viewer.displayName.slice(0, 1)}</span>
            <div>
              <strong>{viewer.displayName}</strong>
              <small>{viewer.demo ? "Synthetic demo account" : viewer.email}</small>
            </div>
            <Link href="/profile" aria-label="Open profile settings">
              ›
            </Link>
          </div>
        </header>
        {viewer.demo ? (
          <div className="demo-banner">
            <strong>Demo mode:</strong> all people, children, groups, locations, and activity shown
            here are synthetic. Production builds block demo mode.
          </div>
        ) : null}
        <main className="hub-content">{children}</main>
        <MobileNav canAdmin={canAdmin} />
      </div>
    </div>
  );
}
