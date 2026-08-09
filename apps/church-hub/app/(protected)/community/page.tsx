import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { RealtimePresenceIndicator } from "@/components/realtime-presence-indicator";
import { communityPosts } from "@/lib/demo-data";
import { requireViewer } from "@/lib/auth/viewer";

export default async function CommunityPage() {
  const viewer = await requireViewer();
  return (
    <>
      <PageHeading
        eyebrow="Moderated community"
        title="Community"
        description="Chronological, ministry-aware communication for encouragement, prayer, conversation, and real-life connection—not endless engagement."
        actions={
          <div className="heading-actions">
            <Link className="hub-button hub-button--primary" href="/fellowship">
              Create a meetup
            </Link>
            <button className="hub-button hub-button--secondary">Create approved post</button>
          </div>
        }
      />
      <div className="community-layout">
        <aside className="hub-panel channel-list">
          <p className="hub-kicker">My channels</p>
          <a className="active" href="#feed">
            Church-wide feed <span>4</span>
          </a>
          <a href="#feed">Announcements</a>
          <Link href="/fellowship">
            Open fellowship invitations <span>6</span>
          </Link>
          <a href="#feed">
            Northwest Family Group <span>3</span>
          </a>
          <a href="#feed">
            Parents Community <span>1</span>
          </a>
          <a href="#feed">Topic discussions</a>
          <a href="#feed">Prayer requests</a>
          <RealtimePresenceIndicator
            channelId="church-wide"
            profileId={viewer.id}
            displayLabel={viewer.displayName}
            demo={viewer.demo}
          />
          <div className="channel-rule">
            <strong>Connection beyond the feed</strong>
            <span>
              Turn a conversation into a prayer walk, meal, playdate, service outing, or public
              meetup through Fellowship.
            </span>
          </div>
          <div className="channel-rule">
            <strong>No unrestricted DMs</strong>
            <span>
              Teen channels are group-based and leader-visible. Sensitive reports use restricted
              workflows.
            </span>
          </div>
        </aside>
        <section id="feed" className="feed">
          <article className="community-connection-banner">
            <div>
              <p className="hub-kicker">From post to presence</p>
              <h2>See something you would join in real life?</h2>
              <p>
                Open Fellowship to join through the Hub without needing to already have the host’s
                phone number.
              </p>
            </div>
            <Link className="hub-button hub-button--light" href="/fellowship">
              Browse meetups
            </Link>
          </article>
          {communityPosts.map((post) => (
            <article className="feed-post" key={post.id}>
              <header>
                <span className="avatar">{post.author.slice(0, 1)}</span>
                <div>
                  <strong>{post.author}</strong>
                  <small>
                    {post.audience} · {post.createdAt}
                  </small>
                </div>
                <button aria-label={`Report or manage ${post.title}`}>•••</button>
              </header>
              <h2>{post.title}</h2>
              <p>{post.body}</p>
              <footer>
                <button>♡ {post.reactions}</button>
                <button>◌ {post.comments} comments</button>
                <button>Save</button>
              </footer>
            </article>
          ))}
        </section>
      </div>
    </>
  );
}
