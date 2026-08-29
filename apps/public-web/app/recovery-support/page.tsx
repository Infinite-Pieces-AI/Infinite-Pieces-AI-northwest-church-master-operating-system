import type { Metadata } from "next";
import Link from "next/link";
import { RecoveryInterestForm } from "@/components/recovery-interest-form";
import styles from "./recovery-support.module.css";

export const metadata: Metadata = {
  title: "Recovery Support in Lowell",
  description:
    "Learn about Christ-centered recovery support, verified treatment resources, and confidential next steps through Boston Church Lowell.",
  alternates: { canonical: "/recovery-support" },
};

const meetingSchedule =
  process.env.NEXT_PUBLIC_RECOVERY_MEETING_SCHEDULE ??
  "Meeting schedule and room published after leadership approval";
const meetingLocation =
  process.env.NEXT_PUBLIC_RECOVERY_MEETING_LOCATION ??
  "Butler Middle School, 1140 Gorham Street, Lowell, Massachusetts";

export default function RecoverySupportPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Boston Church Lowell · Recovery support</p>
          <h1>Faith, honest community, and real recovery resources.</h1>
          <p className={styles.lede}>
            Learn about a private, Christ-centered support community, explore verified treatment
            and crisis resources, or request a confidential conversation with an approved church
            leader. You do not have to share your story publicly to take a next step.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primary} href="#confidential-conversation">
              Request a confidential conversation
            </a>
            <a className={styles.secondary} href="#resources">
              Find verified resources
            </a>
            <Link className={styles.secondary} href="/plan-a-visit">
              Plan a Sunday visit
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.safety} aria-label="Urgent safety information">
        <div>
          <strong>This page is not emergency, medical, detoxification, or treatment care.</strong>
          <span>
            Call 911 for immediate danger or a suspected overdose. In the United States, call or
            text 988 for urgent crisis support. Do not wait for an app message or church reply.
          </span>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <p className={styles.eyebrow}>What this ministry is designed to offer</p>
          <h2>Support that respects dignity, privacy, and professional care.</h2>
          <p className={styles.sectionIntro}>
            The church recovery ministry is designed to complement—not replace—licensed treatment,
            medical care, medication, counseling, emergency response, or other recovery supports.
            Participation is voluntary and is not displayed in a public church directory.
          </p>
          <div className={styles.cardGrid}>
            <article className={styles.card}>
              <span aria-hidden="true">∞</span>
              <h3>Consistent community</h3>
              <p>
                Meet with an approved group, receive encouragement, and build a practical network
                of support without public disclosure or pressure to perform.
              </p>
            </article>
            <article className={styles.card}>
              <span aria-hidden="true">✦</span>
              <h3>Scripture and reflection</h3>
              <p>
                Follow a leader-reviewed weekly path with Scripture references, discussion, private
                reflection, and realistic practices for continued support.
              </p>
            </article>
            <article className={styles.card}>
              <span aria-hidden="true">✓</span>
              <h3>Clear care boundaries</h3>
              <p>
                Leaders explain confidentiality limits, safeguarding duties, urgent-response
                options, and when professional treatment resources are the right next step.
              </p>
            </article>
          </div>

          <article className={styles.meetingCard} id="meeting">
            <div>
              <strong>Recovery Ministry meeting</strong>
              <small>{meetingSchedule}</small>
              <small>{meetingLocation}</small>
            </div>
            <span className={styles.status}>Leadership confirmation required</span>
          </article>
        </div>
      </section>

      <section className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <p className={styles.eyebrow}>A repeatable weekly rhythm</p>
          <h2>Practical enough to use, flexible enough to support real people.</h2>
          <div className={styles.rhythmGrid}>
            <article className={styles.rhythmCard}>
              <span>1</span>
              <h3>Welcome and agreements</h3>
              <p>Review safety, confidentiality limits, voluntary participation, and resources.</p>
            </article>
            <article className={styles.rhythmCard}>
              <span>2</span>
              <h3>Scripture and weekly theme</h3>
              <p>Use church-approved teaching or authorized licensed material with clear sources.</p>
            </article>
            <article className={styles.rhythmCard}>
              <span>3</span>
              <h3>Supported discussion</h3>
              <p>Invite honest participation without forcing disclosure, testimony, or advice.</p>
            </article>
            <article className={styles.rhythmCard}>
              <span>4</span>
              <h3>One practical next step</h3>
              <p>Choose a realistic support, treatment, community, or spiritual action for the week.</p>
            </article>
            <article className={styles.rhythmCard}>
              <span>5</span>
              <h3>Resource connection</h3>
              <p>Make professional, crisis, treatment, and peer-support options easy to reach.</p>
            </article>
            <article className={styles.rhythmCard}>
              <span>6</span>
              <h3>Prayer and follow-up</h3>
              <p>Close with voluntary prayer and assign any consented, appropriate follow-up.</p>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.section} id="resources">
        <div className={styles.sectionInner}>
          <p className={styles.eyebrow}>Verified public resources</p>
          <h2>Use official support when ministry support is not enough.</h2>
          <div className={styles.resourceGrid}>
            <article className={styles.resourceCard}>
              <span>911</span>
              <h3>Immediate danger or suspected overdose</h3>
              <p>Call 911 in the United States. Do not wait for a church or app response.</p>
            </article>
            <article className={styles.resourceCard}>
              <span>988</span>
              <h3>Urgent crisis support</h3>
              <p>Call or text 988 in the United States for urgent crisis support.</p>
              <a href="https://988lifeline.org/" target="_blank" rel="noreferrer">
                Open the 988 Lifeline ↗
              </a>
            </article>
            <article className={styles.resourceCard}>
              <span>⌕</span>
              <h3>Find treatment</h3>
              <p>Search the official U.S. treatment locator by location and service need.</p>
              <a href="https://findtreatment.gov/" target="_blank" rel="noreferrer">
                Open FindTreatment.gov ↗
              </a>
            </article>
            <article className={styles.resourceCard}>
              <span>24/7</span>
              <h3>Treatment information and referral</h3>
              <p>Use SAMHSA’s official public treatment information and referral resources.</p>
              <a
                href="https://www.samhsa.gov/find-help/helplines/national-helpline"
                target="_blank"
                rel="noreferrer"
              >
                Open the SAMHSA National Helpline ↗
              </a>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.sectionAlt} id="confidential-conversation">
        <div className={`${styles.sectionInner} ${styles.formWrap}`}>
          <div>
            <p className={styles.eyebrow}>A voluntary next step</p>
            <h2>Ask for a confidential conversation.</h2>
            <p className={styles.sectionIntro}>
              Share only what is needed to arrange the next step. This form is intentionally
              separate from advertising audiences, prayer posts, public analytics profiles, and
              ordinary visitor marketing.
            </p>
            <ul className={styles.boundaryList}>
              <li>You choose email or phone.</li>
              <li>You choose the kind of help you are requesting.</li>
              <li>You do not need to submit a detailed history.</li>
              <li>You may ask only for verified treatment resources.</li>
              <li>You may opt out of further contact.</li>
            </ul>
          </div>
          <div className={styles.formPanel}>
            <h2>Recovery support inquiry</h2>
            <p>An approved church leader should respond only through the method you select.</p>
            <RecoveryInterestForm />
          </div>
        </div>
      </section>
    </main>
  );
}
