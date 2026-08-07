import Link from "next/link";

const items = [
  ["Week", "/this-week", "⌂"],
  ["Bible", "/bible", "✦"],
  ["Meetups", "/fellowship", "∞"],
  ["Community", "/community", "◌"],
  ["Family", "/family", "⌁"]
] as const;

export function MobileNav({ canAdmin }: { canAdmin: boolean }) {
  return (
    <nav className="bottom-nav" aria-label="Mobile member navigation">
      {items.map(([label, href, icon]) => (
        <Link key={href} href={href}>
          <span aria-hidden="true">{icon}</span>
          <small>{label}</small>
        </Link>
      ))}
      {canAdmin ? (
        <Link className="bottom-nav__admin" href="/admin" aria-label="Ministry administration">
          ⚙
        </Link>
      ) : null}
    </nav>
  );
}
