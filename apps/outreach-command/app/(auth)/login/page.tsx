import Link from "next/link";
import { isOutreachDemoModeEnabled } from "@/lib/auth/viewer";

export default function LoginPage() {
  const demo = isOutreachDemoModeEnabled();
  const hubUrl = process.env.NEXT_PUBLIC_CHURCH_HUB_URL ?? "http://localhost:3001";
  const outreachUrl = process.env.NEXT_PUBLIC_OUTREACH_URL ?? "http://localhost:3002";
  const signInUrl = `${hubUrl}/login?next=${encodeURIComponent(`${outreachUrl}/radar`)}`;

  return (
    <main className="login-shell">
      <section className="login-visual">
        <div className="login-orbit" aria-hidden="true">
          <span>SEO</span><span>PUBLIC WEB</span><span>AIO</span><span>CRM</span><span>LOCAL</span>
          <strong>∞</strong>
        </div>
        <div>
          <p className="eyebrow">Boston Church Lowell · private operations</p>
          <h1>Outreach Intelligence OS</h1>
          <p>
            Understand public questions, strengthen local discovery, measure voluntary visitor
            journeys, and prepare respectful human outreach without profiling private spiritual lives.
          </p>
        </div>
      </section>
      <section className="login-card">
        <span className="brand-mark" aria-hidden="true">∞</span>
        <p className="eyebrow">Authorized leaders only</p>
        <h2>Open the command center</h2>
        <p>
          Production access uses the same church-controlled identity and multifactor safeguards as
          the Church Hub.
        </p>
        {demo ? (
          <Link className="primary-button" href="/radar">Enter Demo Outreach OS →</Link>
        ) : (
          <a className="primary-button" href={signInUrl}>Sign in through Church Hub →</a>
        )}
        <div className="login-boundaries">
          <strong>Public intelligence, not private surveillance</strong>
          <span>Public sources and aggregate search data only.</span>
          <span>No scraped member directory or religious-belief dossiers.</span>
          <span>No automatic replies, publishing, or ad targeting.</span>
        </div>
      </section>
    </main>
  );
}
