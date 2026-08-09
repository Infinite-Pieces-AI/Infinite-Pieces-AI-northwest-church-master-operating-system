import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content-page";

export const metadata: Metadata = {
  title: "What Happens at a Church Service?",
  description:
    "A plain-language guide to worship, prayer, Scripture, teaching, children, announcements, and optional conversation after a Sunday gathering.",
  alternates: { canonical: "/what-happens-at-a-church-service" },
};

export default function Page() {
  return (
    <ContentPage
      eyebrow="A plain-language guide"
      title="What happens at a church service?"
      intro="Church can feel unfamiliar when you do not know the sequence. Here is a simple description of the major parts of a typical Sunday gathering."
      canonicalPath="/what-happens-at-a-church-service"
    >
      <h2>Welcome and worship</h2>
      <p>
        People gather, receive practical information, and participate in songs or other forms of
        congregational worship. Guests may observe or participate at their own pace.
      </p>
      <h2>Prayer and Scripture</h2>
      <p>
        The gathering includes prayer and readings or references from Scripture. The current sermon
        page identifies the passages connected to the week’s teaching.
      </p>
      <h2>Teaching</h2>
      <p>
        A minister or approved speaker teaches from Scripture. Public sermon pages should identify
        the speaker, date, references, summary, and available media or transcript.
      </p>
      <h2>Children and teens</h2>
      <p>
        Guardians decide what works for their household. Review current ministry information before
        Sunday and ask questions about check-in, classes, or remaining together.
      </p>
      <h2>Announcements and connection</h2>
      <p>
        Leaders share current information. Afterward, conversation is optional; you may ask a
        question, meet someone, or simply leave.
      </p>
      <Link className="button button--gold" href="/what-to-expect">
        See the Lowell first-Sunday guide
      </Link>
    </ContentPage>
  );
}
