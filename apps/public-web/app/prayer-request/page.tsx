import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content-page";
import { PrayerRequestForm } from "@/components/prayer-request-form";

export const metadata: Metadata = {
  title: "Private Prayer Request",
  description:
    "Share a prayer request through a separate restricted Boston Church Lowell workflow. Prayer content is not used for advertising or general visitor marketing analytics.",
  alternates: { canonical: "/prayer-request" },
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

export default function Page() {
  return (
    <ContentPage
      eyebrow="Restricted prayer pathway"
      title="Request prayer privately"
      intro="Share only what you choose. Prayer text is routed separately from Plan a Visit, public analytics, advertising, and the general visitor CRM."
      ctaLabel="Ask a general question"
      ctaHref="/ask-a-question"
    >
      <div className="sensitive-path-notice">
        <strong>This is not an emergency service.</strong> The form may not be monitored
        immediately. For immediate danger, contact local emergency services. For an urgent
        mental-health crisis in the United States, call or text 988.
      </div>

      <div className="info-grid">
        <div className="info-panel">
          <h2>Restricted access</h2>
          <p>
            Prayer requests are intended for an approved prayer or pastoral workflow. Technical and
            outreach users should not receive automatic access merely because they administer
            another part of the platform.
          </p>
        </div>
        <div className="info-panel">
          <h2>Optional follow-up</h2>
          <p>
            You may request prayer without requesting a response. Contact information is required
            only when you choose follow-up.
          </p>
        </div>
      </div>

      <PrayerRequestForm />

      <p>
        For a first-visit question, family information, accessibility, or an online Bible
        conversation, use the <Link href="/ask-a-question">general question form</Link> instead.
      </p>
    </ContentPage>
  );
}
