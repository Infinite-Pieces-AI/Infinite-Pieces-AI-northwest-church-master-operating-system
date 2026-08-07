import { ContentPage } from "@/components/content-page";

export default function Page() {
  return (
    <ContentPage
      eyebrow="Trust and safety"
      title="Privacy, children, and responsible technology"
      intro="Understand the intended data boundaries, guardian controls, moderation, AI limits, and contact choices for this platform."
    >
      <h2>Public and private are separate</h2>
      <p>
        The public site reads only published content. Member, household, child, prayer, attendance,
        counseling, and private-channel data remain behind authentication and database-level
        authorization.
      </p>
      <h2>Advertising boundaries</h2>
      <p>
        Member lists, prayer details, religious questions, child information, and ministry
        assignments are never sent to advertising platforms or used to construct religious-interest
        audiences.
      </p>
      <h2>AI boundaries</h2>
      <p>
        AI has no database administrator credentials and no default access to private records. Human
        approval remains required for public, theological, moderation, and pastoral uses.
      </p>
    </ContentPage>
  );
}
