import Link from "next/link";
import { isOutreachDemoModeEnabled } from "@/lib/auth/viewer";

export default function LoginPage() {
  const demo = isOutreachDemoModeEnabled();
  const hubUrl = process.env.NEXT_PUBLIC_CHURCH_HUB_URL ?? "http://localhost:3001";
  const outreachUrl = process.env.NEXT_PUBLIC_OUTREACH_URL ?? "http://localhost:3002";
  const signInUrl = `${hubUrl}/login?next=${encodeURIComponent(`${outreachUrl}/overview`)}`;

  return (
    <main className="login-shell">
      <section className="login-visual">
        <div className="login-orbit" aria-hidden="true">
          <span>PUBLIC QUESTIONS</span>
          <span>SEARCH</span>
          <span>SITE TRUTH</span>
          <span>CRM</span>
          <span>LOCAL</span>
          <strong>∞</strong>
        </div>
        <div>
          <p className="eyebrow">Boston Church Lowell · private operations</p>
          <h1>Turn public questions into respectful ministry action.</h1>
          <p>
            Review aggregate search and local visibility, approved public conversation signals,
            content and campaign recommendations, site quality, and consented visitor follow-up.
          </p>
        </div>
      </section>
      <section className="login-card">
        <span className="brand-mark" aria-hidden="true">∞</span>
        <p className="eyebrow">Authorized leaders only</p>
        <h2>Open Outreach Intelligence OS</h2>
        <p>
          Production access shares the Church Hub identity, requires an approved outreach role,
          AAL2 multifactor authentication, and a recently issued secure session.
        </p>
        {demo ? (
          <Link className="primary-button" href="/overview">Enter Demo Outreach OS →</Link>
        ) : (
          <a className="primary-button" href={signInUrl}>Sign in through Church Hub →</a>
        )}
        <div className="login-boundaries">
          <strong>Public intelligence, not private surveillance</strong>
          <span>No private-group monitoring or access-control bypass.</span>
          <span>No individual religious profiles or vulnerability scores.</span>
          <span>No automatic public replies, publishing, meetings, ad audiences, or budget changes.</span>
          <span>Every production access is logged for church governance.</span>
        </div>
      </section>
    </main>
  );
}
