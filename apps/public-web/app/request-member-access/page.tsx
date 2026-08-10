import Link from "next/link";
import { getPublishedSchedule } from "@/lib/published-content";

export default function RequestMemberAccessPage() {
  const service = getPublishedSchedule();
  const hubUrl = process.env.NEXT_PUBLIC_HUB_URL ?? "http://localhost:3001";
  const serviceTime = service.localTime === "10:00" ? "10:00 AM" : service.localTime;

  return (
    <section className="page-section">
      <div className="page-shell narrow-page">
        <p className="eyebrow">Private fellowship and connection app</p>
        <h1>Request Church Hub access</h1>
        <p className="lead">
          Church Hub is an invite-only member application for the current Bible journey, Fellowship
          meetups, service opportunities, group communication, events, and guardian-managed family
          tools.
        </p>
        <div className="real-request-card">
          <h2>How access works</h2>
          <ol>
            <li>Submit an access request using the Church Hub form.</li>
            <li>An authorized leader verifies the person, household, and expected ministries.</li>
            <li>The system sends a single-use invitation to the intended email address.</li>
            <li>The member accepts the privacy and community policies before access begins.</li>
          </ol>
          <a className="button button--gold" href={`${hubUrl}/request-access`}>
            Open the access-request form
          </a>
        </div>
        <div className="real-request-card">
          <h2>Ask about it in person</h2>
          <p>
            Join us Sunday at {serviceTime} at {service.location.name},{" "}
            {service.location.addressLine1}, {service.location.city}, Massachusetts. A leader can
            explain the app and the approval process.
          </p>
          <div className="button-row">
            <Link className="button button--outline-dark" href="/plan-a-visit">
              Plan your first Sunday
            </Link>
            <a className="button button--outline-dark" href={service.location.directionsUrl}>
              Get directions
            </a>
          </div>
        </div>
        <p className="privacy-note">
          One shared congregation code is not used. Invitations are intended for one email, expire,
          can be revoked, and are recorded with the approving administrator.
        </p>
      </div>
    </section>
  );
}
