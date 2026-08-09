import { ContentPage } from "@/components/content-page";

export default function Page() {
  return (
    <ContentPage
      eyebrow="Students"
      title="Teen ministry"
      intro="Faith, friendship, mentoring, service, and supervised group communication for middle- and high-school students."
    >
      <h2>Supervised digital community</h2>
      <p>
        Teen channels are group-based and visible to approved adult leaders. Adult-to-teen direct
        messaging is disabled by default, and AI may not communicate independently with a minor.
      </p>
      <h2>Belonging and purpose</h2>
      <p>
        Approved leaders can publish Bible discussions, service opportunities, events, and
        parent-facing information.
      </p>
    </ContentPage>
  );
}
