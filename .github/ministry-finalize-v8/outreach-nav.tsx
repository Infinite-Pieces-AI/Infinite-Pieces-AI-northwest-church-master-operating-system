"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const baseItems = [
  ["Command Radar", "/radar", "⌁"],
  ["Search Intelligence", "/search-intelligence", "⌕"],
  ["Growth", "/growth", "↗"],
  ["Content Command", "/content-command", "✦"],
  ["Local Presence", "/local-presence", "◎"],
] as const;

const endingItems = [
  ["Campaigns", "/campaigns", "◫"],
  ["Visitor CRM", "/visitor-crm", "◇"],
  ["Source Control", "/source-control", "⚙"],
] as const;

export function OutreachNav({
  canRecoveryOutreach,
}: {
  canRecoveryOutreach: boolean;
}) {
  const pathname = usePathname();
  const items = [
    ...baseItems,
    ...(canRecoveryOutreach
      ? ([
          ["Recovery Outreach", "/recovery-outreach", "↺"],
        ] as const)
      : []),
    ...endingItems,
  ];

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
