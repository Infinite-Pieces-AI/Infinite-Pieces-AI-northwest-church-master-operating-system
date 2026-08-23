"use client";

import { useEffect, useState } from "react";

interface ModerationPost {
  id: string;
  postType: string;
  title: string;
  description: string;
  ownerName: string;
  exchangeType: string;
  riskLevel: string;
  moderationStatus: string;
  moderationReason?: string;
  giftTags: string[];
  skillTags: string[];
  createdAt: string;
}

export function GiftModerationConsole() {
  const [posts, setPosts] = useState<ModerationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [status, setStatus] = useState("pending");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/gifts?status=${encodeURIComponent(status)}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as { posts?: ModerationPost[]; message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Gift moderation could not be loaded.");
      setPosts(payload.posts ?? []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gift moderation could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [status]);

  async function decide(post: ModerationPost, decision: "approved" | "rejected" | "removed") {
    const reason = window.prompt(
      decision === "approved"
        ? "Optional internal approval note:"
        : "Record a short internal reason for the decision:",
    );
    try {
      const response = await fetch("/api/admin/gifts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ postId: post.id, decision, moderationReason: reason ?? "" }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "The decision could not be saved.");
      setNotice(`Post ${decision}.`);
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The decision could not be saved.");
    }
  }

  return (
    <section className="module-workspace">
      <div className="section-heading">
        <div>
          <p>Risk-aware member marketplace</p>
          <h3>Gift post moderation</h3>
        </div>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="pending">Pending review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="removed">Removed</option>
        </select>
      </div>
      {notice ? <p className="module-notice" role="status">{notice}</p> : null}
      {loading ? <p className="module-empty">Loading gift posts…</p> : null}
      {!loading ? (
        <div className="gift-moderation-list">
          {posts.map((post) => (
            <article key={post.id}>
              <header>
                <div>
                  <span>{post.postType.replaceAll("_", " ")}</span>
                  <span>{post.exchangeType}</span>
                  <span>{post.riskLevel} risk</span>
                </div>
                <small>{post.ownerName} · {new Date(post.createdAt).toLocaleString()}</small>
              </header>
              <h4>{post.title}</h4>
              <p>{post.description}</p>
              <div className="tag-row">
                {[...post.giftTags, ...post.skillTags].map((tag) => <span key={tag}>{tag}</span>)}
              </div>
              {post.moderationReason ? <blockquote>{post.moderationReason}</blockquote> : null}
              <div>
                <button type="button" onClick={() => void decide(post, "approved")}>Approve</button>
                <button type="button" onClick={() => void decide(post, "rejected")}>Reject</button>
                <button type="button" onClick={() => void decide(post, "removed")}>Remove</button>
              </div>
            </article>
          ))}
          {!posts.length ? <p className="module-empty">No gift posts are in this queue.</p> : null}
        </div>
      ) : null}
      <p className="module-boundary">
        Review paid services, home access, transportation, childcare, professional claims, tools,
        donations, and item sharing carefully. Approval is not a church guarantee of price, quality,
        safety, licensing, insurance, or suitability.
      </p>
    </section>
  );
}
