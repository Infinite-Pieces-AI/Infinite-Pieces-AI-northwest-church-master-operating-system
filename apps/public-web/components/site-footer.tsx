import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-shell footer-grid">
        <div>
          <p className="footer-brand">Boston Church Lowell</p>
          <p>
            Sunday worship at 10:00 AM
            <br />
            Butler Middle School
            <br />
            1140 Gorham Street, Lowell, MA 01852
          </p>
          <p className="fine-print">
            Service details must be confirmed by the designated church content owner before
            production launch.
          </p>
        </div>
        <div>
          <h2>Visit</h2>
          <Link href="/plan-a-visit">Plan a Visit</Link>
          <Link href="/what-to-expect">What to Expect</Link>
          <Link href="/kids-kingdom">Kids Kingdom</Link>
          <Link href="/teens">Teen Ministry</Link>
        </div>
        <div>
          <h2>Connect</h2>
          <Link href="/family-groups">Family Groups</Link>
          <Link href="/bible-studies">Bible Studies</Link>
          <Link href="/lowell-community">Serve Lowell</Link>
          <Link href="/contact">Contact & Prayer</Link>
        </div>
        <div>
          <h2>Trust</h2>
          <Link href="/privacy">Privacy & Safety</Link>
          <Link href="/accessibility">Accessibility</Link>
          <a href={process.env.NEXT_PUBLIC_HUB_URL ?? "http://localhost:3001/login"}>Member Hub</a>
        </div>
      </div>
      <div className="page-shell footer-bottom">
        <span>© {new Date().getFullYear()} Boston Church Lowell / Northwest</span>
        <span>Church-owned digital platform</span>
      </div>
    </footer>
  );
}
