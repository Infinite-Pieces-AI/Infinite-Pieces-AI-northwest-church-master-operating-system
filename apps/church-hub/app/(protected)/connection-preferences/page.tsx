import Link from "next/link";
import { ConnectionPreferencesForm } from "@/components/connection-preferences-form";
import { PageHeading } from "@/components/page-heading";

export default function ConnectionPreferencesPage() {
  return (
    <>
      <PageHeading
        eyebrow="Your choices, your pace"
        title="Connection Preferences"
        description="Choose the kinds of authorized member gatherings, time windows, and general areas you would like the Connection Guide to consider. Every suggestion must explain which explicit choices matched."
        actions={
          <Link className="hub-button hub-button--secondary" href="/fellowship">
            Back to Fellowship
          </Link>
        }
      />

      <section className="connection-preference-boundaries">
        <article>
          <strong>Allowed recommendation inputs</strong>
          <p>Your saved categories, availability, general area, family-friendly preference, group membership, and authorized meetup attributes.</p>
        </article>
        <article>
          <strong>Prohibited recommendation inputs</strong>
          <p>Prayer text, counseling, pastoral conversations, private messages, child records, inferred loneliness, risk, or spiritual-engagement scoring.</p>
        </article>
        <article>
          <strong>Your controls</strong>
          <p>Pause recommendations, change preferences, choose fewer suggestions like one, or disable the system entirely.</p>
        </article>
      </section>

      <ConnectionPreferencesForm />
    </>
  );
}
