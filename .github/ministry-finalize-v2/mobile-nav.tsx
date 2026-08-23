import Link from "next/link";

const items = [
  ["This Week", "/this-week", "⌂"],
  ["Fellowship", "/fellowship", "∞"],
  ["Gifts", "/gifts", "✧"],
  ["Prayer", "/prayer", "◉"],
  ["More", "/more", "•••"],
] as const;

export function MobileNav({ canAdmin: _canAdmin }: { canAdmin: boolean }) {
  return (
    <nav className="bottom-nav" aria-label="Mobile member navigation">
      {items.map(([label, href, icon]) => (
        <Link key={href} href={href}>
          <span aria-hidden="true">{icon}</span>
          <small>{label}</small>
        </Link>
      ))}
    </nav>
  );
}
