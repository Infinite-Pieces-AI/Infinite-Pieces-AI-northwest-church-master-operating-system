import Link from "next/link";

const navigation = [
  ["Plan a Visit", "/plan-a-visit"],
  ["About", "/about"],
  ["Ministries", "/ministries"],
  ["Events", "/events"],
  ["Sermons", "/sermons"],
  ["Bible Studies", "/bible-studies"],
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="site-header__inner page-shell">
        <Link className="brand" href="/" aria-label="Boston Church Lowell home">
          <span className="brand__mark" aria-hidden="true">
            ∞
          </span>
          <span>
            <strong>Boston Church</strong>
            <small>Lowell · Northwest</small>
          </span>
        </Link>
        <nav aria-label="Primary navigation" className="desktop-nav">
          {navigation.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link className="text-link" href="/contact">
            Contact
          </Link>
          <Link
            className="button button--gold button--compact"
            href={process.env.NEXT_PUBLIC_HUB_URL ?? "http://localhost:3001/login"}
          >
            Member login
          </Link>
        </div>
      </div>
      <nav aria-label="Mobile navigation" className="mobile-nav page-shell">
        {navigation.slice(0, 5).map(([label, href]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
