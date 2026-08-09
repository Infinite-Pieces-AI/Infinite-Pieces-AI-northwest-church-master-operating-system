import Link from "next/link";

const navigation = [
  ["What to Expect", "/what-to-expect"],
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
        <div className="header-actions guest-header-actions">
          <Link
            className="member-utility-link"
            href={process.env.NEXT_PUBLIC_HUB_URL ?? "http://localhost:3001/login"}
          >
            Member sign in
          </Link>
          <Link className="button button--outline button--compact" href="/ask-a-question">
            Ask a question
          </Link>
          <Link className="button button--gold button--compact" href="/plan-a-visit">
            Plan your first Sunday
          </Link>
        </div>
      </div>
      <nav aria-label="Mobile navigation" className="mobile-nav page-shell public-mobile-nav">
        <Link href="/plan-a-visit">Plan a visit</Link>
        <Link href="/what-to-expect">What to expect</Link>
        <Link href="/ministries">Ministries</Link>
        <Link href="/events">Events</Link>
        <Link href="/ask-a-question">Ask a question</Link>
      </nav>
    </header>
  );
}
