import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { isDemoModeEnabled } from "@/lib/auth/viewer";

export default function LoginPage() {
  const demoEnabled = isDemoModeEnabled();

  return (
    <section className="auth-card auth-card--member-welcome">
      <p className="auth-eyebrow">Your church week, all in one place</p>
      <h1>Welcome to Church Hub.</h1>
      <p>
        See this week’s teaching, join a meal or prayer walk, find a service opportunity, stay
        connected to your groups, and manage approved family tools.
      </p>

      <div className="member-login-value-grid" aria-label="Church Hub capabilities">
        <article>
          <span>✦</span>
          <strong>Grow</strong>
          <small>Weekly teaching and the whole-Bible journey</small>
        </article>
        <article>
          <span>∞</span>
          <strong>Connect</strong>
          <small>Meals, walks, playdates, groups, and meetups</small>
        </article>
        <article>
          <span>◇</span>
          <strong>Serve</strong>
          <small>Real needs, shifts, teams, and community partners</small>
        </article>
        <article>
          <span>⌁</span>
          <strong>Care</strong>
          <small>Family tools, notifications, and approved support</small>
        </article>
      </div>

      {demoEnabled ? (
        <>
          <Link className="demo-entry" href="/this-week">
            Enter Demo Church Hub →
          </Link>
          <p className="auth-demo-note">
            Demo mode uses fictional data so you can explore the full app before Supabase is
            connected.
          </p>
          <div className="auth-divider">
            <span>or use the secure member flow</span>
          </div>
        </>
      ) : null}

      <LoginForm />

      <div className="auth-support-grid">
        <Link href="/request-access">
          <strong>Request member access</strong>
          <span>Known members and guardians are approved through a single-use invitation.</span>
        </Link>
        <a href="mailto:technology@example.invalid?subject=Church%20Hub%20account%20help">
          <strong>Account or email changed?</strong>
          <span>Ask the church’s approved support owner for identity-safe help.</span>
        </a>
      </div>
      <p className="auth-fine-print">
        Passkeys and trusted-device approval are planned after the church-controlled production
        identity environment is configured. Privileged accounts require multifactor authentication.
      </p>
      <a className="back-public" href={process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}>
        ← Return to the public website
      </a>
    </section>
  );
}
