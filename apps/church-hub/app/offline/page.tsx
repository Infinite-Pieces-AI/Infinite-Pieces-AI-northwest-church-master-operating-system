import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="offline-page">
      <section className="auth-card">
        <p className="auth-eyebrow">Connection unavailable</p>
        <h1>You are offline.</h1>
        <p>
          The app protects private member information by keeping authenticated pages network-only.
          Previously saved service details and weekly lesson summaries can still appear in the
          Offline Readiness panel.
        </p>
        <Link className="hub-button hub-button--primary" href="/this-week">
          Try again
        </Link>
      </section>
    </main>
  );
}
