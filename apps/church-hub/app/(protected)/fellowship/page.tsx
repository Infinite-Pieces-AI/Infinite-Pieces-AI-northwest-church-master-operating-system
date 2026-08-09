import { ConnectionConcierge } from "@/components/connection-concierge";
import { FellowshipBoard } from "@/components/fellowship-board";
import { PageHeading } from "@/components/page-heading";
import { requireViewer } from "@/lib/auth/viewer";
import { loadFellowshipMeetups } from "@/lib/fellowship";

export default async function FellowshipPage() {
  const viewer = await requireViewer();
  const meetups = await loadFellowshipMeetups(viewer).catch(() => []);
  return <>
    <PageHeading eyebrow="Never do ordinary life alone" title="Fellowship" description="Member-created prayer walks, playdates, meals, service, sports, outings, and open invitations—without needing someone’s phone number first." />
    <section className="fellowship-hero"><div className="fellowship-hero__copy"><p className="hub-kicker">Belonging made visible</p><h2>See where life is happening. Join gently. Invite freely.</h2><p>Fellowship turns ordinary plans into open doors: a family at the park, a prayer walk, coffee after work, a service project, an open lunch table, or a whole-church outing.</p><div className="fellowship-stat-row"><div><strong>{meetups.length}</strong><span>open invitations</span></div><div><strong>3</strong><span>response choices</span></div><div><strong>1</strong><span>participant-only thread</span></div></div></div><div className="fellowship-constellation" aria-hidden="true"><span>Prayer</span><span>Families</span><span>Meals</span><span>Service</span><span>Sports</span><strong>∞</strong></div></section>
    <ConnectionConcierge />
    <section className="fellowship-principles"><article><span>01</span><div><strong>Low pressure</strong><p>Come late, leave early, bring children, or simply observe before joining.</p></div></article><article><span>02</span><div><strong>Member safe</strong><p>General public locations are visible; exact instructions unlock through authorized RSVP states.</p></div></article><article><span>03</span><div><strong>No phone-number barrier</strong><p>Discover, respond, coordinate, and receive updates through a purpose-specific meetup thread.</p></div></article><article><span>04</span><div><strong>Practical clarity</strong><p>Hosts can state capacity, accessibility, cost, food, transportation, recurrence, and weather plans.</p></div></article></section>
    <FellowshipBoard initialMeetups={meetups} demo={viewer.demo} />
    <section className="hub-panel fellowship-safety-panel"><div><p className="hub-kicker">Connection with boundaries</p><h2>Designed to reduce isolation without turning people into location data.</h2></div><ul><li>Open invitations use public or general meeting places, not home addresses.</li><li>Exact instructions and virtual links remain in a separate protected record.</li><li>Children do not create meetups or appear in searchable attendance lists.</li><li>Teen gatherings remain group-based and leader-visible.</li><li>Moderators can pause, report, or remove unsafe invitations.</li></ul></section>
  </>;
}
