import Link from "next/link";
import styles from "./recovery-support-feature.module.css";

export function RecoverySupportFeature() {
  return (
    <section className={styles.section} aria-labelledby="recovery-support-title">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <p>Recovery support and Christian community</p>
          <h2 id="recovery-support-title">A private next step for people pursuing recovery.</h2>
          <p>
            Learn about the church’s adult recovery-ministry vision, request a confidential
            conversation, explore public treatment resources, and understand how Church Hub can
            support a private weekly ministry journey without exposing participant information.
          </p>
          <div className={styles.actions}>
            <Link href="/recovery-support-lowell">Explore recovery support</Link>
            <Link href="/plan-a-visit">Plan your first Sunday</Link>
          </div>
        </div>
        <aside className={styles.card}>
          <strong>Peer ministry with responsible boundaries</strong>
          <span>
            Church support can exist alongside licensed treatment. The public website does not infer
            addiction status or reveal private searchers, participants, requests, or group activity.
          </span>
          <ul>
            <li>Voluntary leader conversation</li>
            <li>Private Hub access after approval</li>
            <li>Weekly Scripture and community</li>
            <li>Public professional-resource links</li>
          </ul>
        </aside>
      </div>
    </section>
  );
}
