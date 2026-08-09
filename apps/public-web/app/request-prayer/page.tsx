import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { PrayerRequestForm } from "@/components/prayer-request-form";

export const metadata: Metadata = {
  title: "Private Prayer Request",
  description: "Send a prayer request through a restricted ministry workflow without creating a general visitor marketing record.",
  alternates: { canonical: "/request-prayer" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <ContentPage eyebrow="Restricted prayer workflow" title="Request prayer without entering a marketing funnel" intro="You may submit a request without asking for a response. Prayer text is separated from public analytics, advertising, and the general visitor CRM." canonicalPath="/request-prayer" ctaLabel="Return to Plan a Visit">
      <div className="privacy-callout privacy-callout--prayer"><strong>Submitting this form does not replace emergency help.</strong><p>If you or another person is in immediate danger, contact emergency services or the appropriate crisis resource. Safeguarding concerns must follow the church’s approved reporting process.</p></div>
      <PrayerRequestForm />
    </ContentPage>
  );
}
