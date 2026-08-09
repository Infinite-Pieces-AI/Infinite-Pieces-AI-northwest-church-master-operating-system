import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content-page";
import { getPublishedSchedule } from "@/lib/published-content";

export const metadata: Metadata = {
  title: "Looking for a Church in Lowell, Massachusetts?",
  description: "Current Sunday worship details, what to expect, family and teen ministry, Bible conversations, fellowship, and service at Boston Church Lowell.",
  alternates: { canonical: "/church-in-lowell" },
};

export default function Page() {
  const service = getPublishedSchedule();
  const time = service.localTime === "10:00" ? "10:00 AM" : service.localTime;
  return (
    <ContentPage eyebrow="A practical Lowell church guide" title="Looking for a church in Lowell, Massachusetts?" intro="Start with accurate Sunday information, learn what the community values, and decide whether a visit, question, Bible conversation, online option, or service opportunity fits your next step." canonicalPath="/church-in-lowell">
      <section className="direct-answer"><p className="eyebrow">Current gathering</p><h2>Sunday worship at {time}</h2><p>{service.location.name}<br />{service.location.addressLine1}, {service.location.city}, {service.location.region} {service.location.postalCode}</p><Link className="button button--gold" href="/plan-a-visit">Plan your first Sunday</Link></section>

      <h2>What kind of community is this?</h2>
      <p>Boston Church Lowell is presented here as a Jesus-centered community seeking to worship, learn Scripture, build genuine relationships, and serve neighbors. The public website is designed to let you explore before deciding whether to attend.</p>

      <div className="guide-grid">
        <article><h3>I want to know Jesus</h3><p>Explore questions about Jesus, current teaching, Scripture references, and ways to begin a Bible conversation.</p><Link href="/questions-about-jesus">Start here →</Link></article>
        <article><h3>I want community</h3><p>Learn about family groups, meals, prayer walks, Bible discussions, member-created meetups, and serving beside others.</p><Link href="/how-to-find-a-church-community">Explore community →</Link></article>
        <article><h3>I am visiting with family</h3><p>Review Kids Kingdom, teen ministry, check-in expectations, and the first-Sunday guide before you arrive.</p><Link href="/church-for-families-lowell">Explore the family pathway →</Link></article>
        <article><h3>I want to serve</h3><p>See how approved public events and community partnerships can help faith become practical.</p><Link href="/serve-lowell">Explore service →</Link></article>
        <article><h3>I cannot attend in person yet</h3><p>Request an approved online Bible conversation or ask when a Zoom discussion is available.</p><Link href="/online-bible-study">Explore online options →</Link></article>
        <article><h3>I have a question first</h3><p>Choose a topic and decide whether an authorized volunteer responds by email or phone.</p><Link href="/ask-a-question">Ask a question →</Link></article>
      </div>

      <h2>What should I compare when choosing a church?</h2>
      <p>Look for clarity about beliefs, responsible leadership, healthy relationships, child and teen safety, service, how questions are handled, and whether the public experience matches the claims made online. Visit more than once if you need time to understand the community.</p>
    </ContentPage>
  );
}
