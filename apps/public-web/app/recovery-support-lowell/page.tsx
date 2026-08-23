import type { Metadata } from "next";
import Link from "next/link";
import { RecoveryInterestForm } from "@/components/recovery-interest-form";

export const metadata: Metadata = {
  title: "Recovery Support in Lowell",
  description:
    "Learn about Boston Church Lowell’s adult recovery peer-support pathway, request a private conversation, and open official treatment resources.",
};

const supportPaths = [
  {
    title: "Church peer support",
    body: "A voluntary adult ministry focused on Scripture, honest community, responsible next steps, and appropriate boundaries. Private group access requires leader review.",
    icon: "∞",
  },
  {
    title: "Private conversation",
    body: "Ask an authorized ministry leader about the church pathway without posting a public recovery story or joining a marketing audience.",
    icon: "○",
  },
  {
    title: "Professional resources",
    body: "Use official federal and Massachusetts resources to locate licensed treatment, crisis support, and recovery services when clinical care is needed.",
    icon: "↗",
  },
] as const;

export default function RecoverySupportLowellPage() {
  return (
    <div className="recovery-public-page">
      <section className="recovery-public-hero">
        <div className="recovery-public-hero__content">
          <p>Adult recovery support · Lowell, Massachusetts</p>
          <h1>You do not have to navigate recovery alone.</h1>
          <span>
            Boston Church Lowell is developing a confidential adult peer-support ministry grounded in
            Scripture, honest community, responsible next steps, and connections to appropriate
            professional care.
          </span>
          <div className="recovery-public-hero__actions">
            <a className="button button--gold" href="#private-request">
              Request a private conversation
            </a>
            <a className="button button--outline" href="#official-resources">
              Find official treatment resources
            </a>
          </div>
        </div>
        <aside className="recovery-public-hero__boundary">
          <strong>Church peer support is not treatment.</strong>
          <p>
            The ministry does not diagnose, detox, prescribe medication, replace a licensed provider,
            or guarantee recovery outcomes.
          </p>
          <p>
            Call <b>911</b> for an overdose or immediate danger. In the United States, call or text
            <b> 988</b> for crisis support.
          </p>
        </aside>
      </section>

      <section className="recovery-public-section">
        <header>
          <p>Choose the next step that fits</p>
          <h2>Spiritual community and appropriate care can work together.</h2>
        </header>
        <div className="recovery-public-grid">
          {supportPaths.map((path) => (
            <article key={path.title}>
              <span aria-hidden="true">{path.icon}</span>
              <h3>{path.title}</h3>
              <p>{path.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="recovery-public-sunday">
        <div>
          <p>Boston Church Lowell</p>
          <h2>Start by meeting the church.</h2>
          <span>
            Sunday worship is currently listed for 10:00 AM at Butler Middle School, 1140 Gorham
            Street, Lowell, Massachusetts. Recovery-ministry meeting details are shared only after the
            ministry is approved and a leader confirms private access.
          </span>
        </div>
        <div>
          <Link className="button button--gold" href="/plan-a-visit">
            Plan your first Sunday
          </Link>
          <Link className="button button--outline" href="/what-to-expect">
            What to expect
          </Link>
        </div>
      </section>

      <section className="recovery-public-section recovery-public-resources" id="official-resources">
        <header>
          <p>Official support directories</p>
          <h2>Use licensed and public resources when treatment is needed.</h2>
        </header>
        <div className="recovery-public-grid">
          <a href="https://findtreatment.gov" target="_blank" rel="noreferrer">
            <strong>FindTreatment.gov</strong>
            <span>Search for licensed mental-health and substance-use treatment providers.</span>
            <b>Open official directory ↗</b>
          </a>
          <a
            href="https://www.samhsa.gov/find-help/helplines/national-helpline"
            target="_blank"
            rel="noreferrer"
          >
            <strong>SAMHSA National Helpline</strong>
            <span>Federal treatment-referral and information resources.</span>
            <b>Open SAMHSA ↗</b>
          </a>
          <a
            href="https://www.mass.gov/info-details/resources-for-substance-use-disorder-treatment-recovery-services"
            target="_blank"
            rel="noreferrer"
          >
            <strong>Massachusetts resources</strong>
            <span>State treatment, recovery-support, and family-resource information.</span>
            <b>Open Mass.gov ↗</b>
          </a>
          <a href="https://988lifeline.org" target="_blank" rel="noreferrer">
            <strong>988 Suicide & Crisis Lifeline</strong>
            <span>Call or text 988 in the United States for crisis support.</span>
            <b>Open 988 Lifeline ↗</b>
          </a>
        </div>
      </section>

      <section className="recovery-public-request" id="private-request">
        <div>
          <p>Voluntary, consented follow-up</p>
          <h2>Ask for a private response.</h2>
          <span>
            Your request begins only when you submit this form and choose a contact method. It is not
            used to infer addiction status, build an advertising audience, or identify private searchers.
          </span>
          <ul>
            <li>Only authorized church leaders should receive the request.</li>
            <li>Prayer, treatment, and private recovery details stay outside marketing systems.</li>
            <li>You may ask only for official resource links without joining a church group.</li>
          </ul>
        </div>
        <RecoveryInterestForm />
      </section>
    </div>
  );
}
