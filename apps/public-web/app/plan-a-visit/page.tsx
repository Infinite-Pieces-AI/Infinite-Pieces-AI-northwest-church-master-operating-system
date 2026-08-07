import { ContentPage } from "@/components/content-page";
import { VisitForm } from "@/components/visit-form";

export default function Page() {
  return (
    <ContentPage
      eyebrow="Visit Lowell"
      title="Plan your first Sunday visit"
      intro="Find the current service time, venue, directions, family information, accessibility details, and a voluntary way to let us know you are coming."
    >
      <div className="info-grid">
        <div className="info-panel">
          <h2>Sunday details</h2>
          <p>
            <strong>10:00 AM</strong>
            <br />
            Butler Middle School
            <br />
            1140 Gorham Street, Lowell, MA 01852
          </p>
        </div>
        <div className="info-panel">
          <h2>Before production</h2>
          <p>
            Leadership must approve parking, entrance, accessibility, Kids Kingdom ages,
            cancellation contacts, and special-service overrides.
          </p>
        </div>
      </div>
      <h2>Let us help you prepare</h2>
      <p>
        Complete only the information you choose. The form does not create a member account and does
        not send your details to advertising platforms.
      </p>
      <VisitForm />
    </ContentPage>
  );
}
