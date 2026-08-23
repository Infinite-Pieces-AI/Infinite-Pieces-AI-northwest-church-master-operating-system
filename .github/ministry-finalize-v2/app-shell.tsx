import type { ReactNode } from "react";
import Link from "next/link";
import { hasPermission, type Permission } from "@church/authorization";
import type { Viewer } from "@/lib/auth/viewer";
import { MinistryNavigator } from "./ministry-navigator";
import { MobileNav } from "./mobile-nav";
import { ServiceWorkerRegistration } from "./service-worker-registration";

const sideItems = [
  ["This Week", "/this-week", "⌂"],
  ["Bible Journey", "/bible", "✦"],
  ["Fellowship", "/fellowship", "∞"],
  ["Gifts of the Church", "/gifts", "✧"],
  ["Prayer Well", "/prayer", "◉"],
  ["Serve", "/serve", "◇"],
  ["Recovery Ministry", "/recovery", "↺"],
  ["Community", "/community", "◌"],
  ["Events", "/events", "□"],
  ["Connection Path", "/connection-path", "↗"],
  ["Family", "/family", "⌁"],
] as const;

const adminPermissions: readonly Permission[] = [
  "content.draft",
  "access.approve",
  "group.manage_assigned",
  "safeguarding.review",
  "moderation.review",
  "outreach.manage",
  "audit.read",
  "system.health.read",
];

export function AppShell({ viewer, children }: { viewer: Viewer; children: ReactNode }) {
  const canAdmin = adminPermissions.some((permission) => hasPermission(viewer.roles, permission));
  const canOutreach = hasPermission(viewer.roles, "outreach.manage");
  const canModerateGifts = hasPermission(viewer.roles, "moderation.review");
  const canReviewPrayer =
    hasPermission(viewer.roles, "moderation.review") ||
    hasPermission(viewer.roles, "safeguarding.review") ||
    hasPermission(viewer.roles, "content.publish");
  const canManageRecovery =
    hasPermission(viewer.roles, "content.draft") ||
    hasPermission(viewer.roles, "moderation.review") ||
    hasPermission(viewer.roles, "safeguarding.review");
  const outreachUrl =
    process.env.NEXT_PUBLIC_OUTREACH_URL ??
    process.env.NEXT_PUBLIC_OUTREACH_COMMAND_URL ??
    "http://localhost:3002";

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
          {canModerateGifts ? (
            <Link className="sidebar-subitem" href="/admin/gifts">
              <span>·</span>
              Gift Moderation
            </Link>
          ) : null}
          {canReviewPrayer ? (
            <Link className="sidebar-subitem" href="/admin/prayer">
              <span>·</span>
              Prayer Routing
            </Link>
          ) : null}
          {canManageRecovery ? (
            <Link className="sidebar-subitem" href="/admin/recovery">
              <span>·</span>
              Recovery Access
            </Link>
          ) : null}
          {canOutreach ? (
            <a href={outreachUrl}>
              <span aria-hidden="true">⌕</span>
              Outreach OS ↗
            </a>
          ) : null}
        </nav>
        <div className="sidebar-safety">
          <strong>Belonging with boundaries</strong>
          <span>
            Use public meeting places for open invitations. Keep child, prayer, recovery,
            counseling, safeguarding, and private-group information inside approved workflows.
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
              <small>{viewer.demo ? "Interactive showcase member" : viewer.email}</small>
            </div>
            <Link href="/profile" aria-label="Open profile settings">
              ›
            </Link>
          </div>
        </header>
        {viewer.demo ? (
          <div className="preview-banner">
            <strong>Interactive showcase mode:</strong> the finished workflows are clickable and
            save only inside this browser. Nothing changes real church records.
          </div>
        ) : null}
        <main className="hub-content">
          <MinistryNavigator />
          {children}
        </main>
        <MobileNav canAdmin={canAdmin} />
      </div>
    </div>
  );
}
