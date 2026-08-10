"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["Overview", "/overview", "⌂"],
  ["Morning Brief", "/morning-brief", "☀"],
  ["Member Access", "/member-access", "◇"],
  ["Command Radar", "/radar", "⌁"],
  ["Search Intelligence", "/search-intelligence", "⌕"],
  ["Site Quality", "/site-quality", "✓"],
  ["Growth", "/growth", "↗"],
  ["Content Command", "/content-command", "✦"],
  ["Local Presence", "/local-presence", "◎"],
  ["Campaigns", "/campaigns", "◫"],
  ["Visitor CRM", "/visitor-crm", "◇"],
  ["Source Control", "/source-control", "⚙"],
  ["Production Readiness", "/production-readiness", "◉"],
] as const;

export function OutreachNav() {
  const pathname = usePathname();
  return (
    <nav className="os-nav" aria-label="Outreach Intelligence navigation">
      {items.map(([label, href, icon]) => (
        <Link className={pathname.startsWith(href) ? "active" : ""} href={href} key={href}>
          <span aria-hidden="true">{icon}</span>
          <strong>{label}</strong>
        </Link>
      ))}
    </nav>
  );
}
