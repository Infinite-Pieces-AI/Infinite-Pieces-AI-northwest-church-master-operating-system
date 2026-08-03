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
        description="Chronological, ministry-aware communication designed for usefulness—not endless engagement."
        actions={<button className="hub-button hub-button--primary">Create approved post</button>}
      />
      <div className="community-layout">
        <aside className="hub-panel channel-list">
          <p className="hub-kicker">My channels</p>
          <a className="active" href="#feed">Church-wide feed <span>4</span></a>
          <a href="#feed">Announcements</a>
          <a href="#feed">Northwest Family Group <span>3</span></a>
          <a href="#feed">Parents Community <span>1</span></a>
          <a href="#feed">Topic discussions</a>
          <a href="#feed">Prayer requests</a>
          <RealtimePresenceIndicator
            channelId="church-wide"
            profileId={viewer.id}
            displayLabel={viewer.displayName}
            demo={viewer.demo}
          />
          <div className="channel-rule">
            <strong>No unrestricted DMs</strong>
            <span>Teen channels are group-based and leader-visible. Sensitive reports use restricted workflows.</span>
          </div>
        </aside>
        <section id="feed" className="feed">
          {communityPosts.map((post) => (
            <article className="feed-post" key={post.id}>
              <header>
                <span className="avatar">{post.author.slice(0, 1)}</span>
                <div>
                  <strong>{post.author}</strong>
                  <small>{post.audience} · {post.createdAt}</small>
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
