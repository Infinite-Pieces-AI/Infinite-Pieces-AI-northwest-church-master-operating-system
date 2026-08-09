import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content-page";
import { PublicActionLink } from "@/components/public-action-link";
import { VisitForm } from "@/components/visit-form";
import { getPublishedSchedule } from "@/lib/published-content";

export const metadata: Metadata = {
  title: "Plan Your First Sunday",
  description: "See the current service time, Butler Middle School meeting location, directions, Kids Kingdom information, accessibility guidance, and an optional visit form.",
  alternates: { canonical: "/plan-a-visit" },
};

export default function Page() {
  const service = getPublishedSchedule();
  const time = service.localTime === "10:00" ? "10:00 AM" : service.localTime;

  return (
    <ContentPage eyebrow="Your first Sunday" title="Plan your first Sunday without pressure" intro="Browse the practical details first. A form is available only if you would like a welcome volunteer to help you prepare." canonicalPath="/plan-a-visit">
      <section className="visit-certainty-card">
        <div><p className="eyebrow">Current Sunday gathering</p><h2>{service.title}</h2><p><strong>{service.date} at {time}</strong><br />{service.location.name}<br />{service.location.addressLine1}, {service.location.city}, {service.location.region} {service.location.postalCode}</p></div>
        <div className="button-row">
          <PublicActionLink className="button button--gold" href={service.location.directionsUrl} event="directions_clicked" properties={{ path: "/plan-a-visit" }}>Get directions</PublicActionLink>
          <PublicActionLink className="button button--outline-dark" href="/api/public/schedule/calendar" event="calendar_added" properties={{ path: "/plan-a-visit" }} download>Add to calendar</PublicActionLink>
        </div>
      </section>

      <h2>Browse first—no contact information required</h2>
      <div className="choice-grid choice-grid--light">
        <Link className="choice-card" href="/what-to-expect"><strong>See the service step by step</strong><span>Arrival, clothing, worship, children, accessibility, and what happens afterward.</span></Link>
        <Link className="choice-card" href="/kids-kingdom"><strong>Review Kids Kingdom</strong><span>See approved children’s ministry information before deciding what works for your household.</span></Link>
        <Link className="choice-card" href="/can-i-come-to-church-alone"><strong>Coming alone?</strong><span>Learn how to arrive and participate without already knowing anyone.</span></Link>
        <Link className="choice-card" href="/ask-a-question"><strong>Ask something first</strong><span>Choose a topic and receive a response using your selected contact method.</span></Link>
      </div>

      <h2>Practical arrival information</h2>
      <div className="info-grid">
        <div className="info-panel"><h3>Parking</h3><p>{service.location.parkingInstructions || "Use the current directions link and follow church signs and welcome volunteers when you arrive."}</p></div>
        <div className="info-panel"><h3>Entrance</h3><p>{service.location.entranceInstructions || "Look for current church directional signs at the school entrance used for Sunday worship."}</p></div>
        <div className="info-panel"><h3>Accessibility</h3><p>{service.location.accessibilityNotes || "Ask a question before Sunday if you would like help planning an accessible arrival."}</p></div>
        <div className="info-panel"><h3>Children</h3><p>Guardians may review Kids Kingdom information ahead of time and decide whether children attend a class or remain with the household.</p></div>
      </div>

      <h2>Would a welcome volunteer help?</h2>
      <p>Share only what is needed for this visit. You may choose email or phone, and a last name is optional. Prayer requests use a different restricted workflow.</p>
      <VisitForm />
    </ContentPage>
  );
}
