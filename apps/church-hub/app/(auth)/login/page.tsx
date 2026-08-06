import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { isDemoModeEnabled } from "@/lib/auth/viewer";

export default function LoginPage() {
  const demoEnabled = isDemoModeEnabled();

  return (
    <section className="auth-card">
      <p className="auth-eyebrow">Member sign-in</p>
      <h1>Welcome back.</h1>
      <p>
        Use the email address connected to your approved member account. We will send a
        short-lived secure link.
      </p>

      {demoEnabled ? (
        <>
          <Link className="demo-entry" href="/this-week">
            Enter Demo Church Hub →
          </Link>
          <p className="auth-demo-note">
            Demo mode uses fictional data so you can explore the full app before Supabase is connected.
          </p>
          <div className="auth-divider"><span>or test the real sign-in flow later</span></div>
        </>
      ) : null}

      <LoginForm />

      <div className="auth-divider"><span>Need access?</span></div>
      <Link className="hub-button hub-button--secondary" href="/request-access">
        Request member access
      </Link>
      <a
        className="back-public"
        href={process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}
      >
        ← Return to the public website
      </a>
    </section>
  );
}
