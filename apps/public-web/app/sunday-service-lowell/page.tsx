import { ContentPage } from "@/components/content-page";

export default function Page() {
  return (
    <ContentPage
      eyebrow="Sunday in Lowell"
      title="Sunday worship information"
      intro="Current time, venue, directions, accessibility, children\u2019s information, and schedule overrides from one approved source."
    >
      <h2>Current starter record</h2>
      <p>
        Sunday at 10:00 AM at Butler Middle School, 1140 Gorham Street, Lowell, Massachusetts. The
        designated church content owner must verify this and all arrival instructions before
        production.
      </p>
      <h2>Schedule exceptions</h2>
      <p>
        Date-specific changes override the regular template and automatically update every approved
        channel.
      </p>
    </ContentPage>
  );
}
