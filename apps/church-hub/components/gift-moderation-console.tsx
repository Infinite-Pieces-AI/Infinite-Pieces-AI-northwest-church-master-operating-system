"use client";

import { useEffect, useMemo, useState } from "react";

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

const previewPosts: ModerationPost[] = [
  {
    id: "gift-review-1",
    postType: "church_need",
    title: "Photographer needed for fall family event",
    description:
      "The events team is looking for a member comfortable photographing a public church gathering for two hours. Media-consent rules still apply to every image.",
    ownerName: "Events Team",
    exchangeType: "volunteer",
    riskLevel: "standard",
    moderationStatus: "pending",
    giftTags: ["service", "encouragement"],
    skillTags: ["photography", "events"],
    createdAt: new Date(Date.now() - 35 * 60_000).toISOString(),
  },
  {
    id: "gift-review-2",
    postType: "member_offer",
    title: "Can help with basic home organization",
    description:
      "Available to help a household sort boxes, label storage, and organize a garage on a Saturday afternoon. Another adult should be present for an in-home visit.",
    ownerName: "Member Volunteer",
    exchangeType: "free",
    riskLevel: "elevated",
    moderationStatus: "pending",
    moderationReason: "Home-access offer requires a clear safety boundary before approval.",
    giftTags: ["helps", "hospitality"],
    skillTags: ["organization"],
    createdAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
  },
  {
    id: "gift-review-3",
    postType: "member_offer",
    title: "Resume and interview practice",
    description:
      "Happy to spend an hour helping another adult polish a resume or practice for an interview. This is peer support, not an employment guarantee.",
    ownerName: "Career Mentor",
    exchangeType: "free",
    riskLevel: "standard",
    moderationStatus: "approved",
    giftTags: ["encouragement", "teaching"],
    skillTags: ["resume writing", "interviewing"],
    createdAt: new Date(Date.now() - 24 * 60 * 60_000).toISOString(),
  },
  {
    id: "gift-review-4",
    postType: "member_offer",
    title: "Bookkeeping help for small projects",
    description:
      "Can provide paid bookkeeping support. Rates and scope would be agreed directly between adults outside the church platform.",
    ownerName: "Finance Professional",
    exchangeType: "paid",
    riskLevel: "elevated",
    moderationStatus: "pending",
    giftTags: ["administration"],
    skillTags: ["bookkeeping", "spreadsheets"],
    createdAt: new Date(Date.now() - 3 * 60 * 60_000).toISOString(),
  },
];

const storageKey = "church-hub-gift-moderation-showcase-v1";

export function GiftModerationConsole({ mode }: { mode: "showcase" | "live" }) {
  const [posts, setPosts] = useState<ModerationPost[]>(mode === "showcase" ? previewPosts : []);
  const [loading, setLoading] = useState(mode === "live");
  const [notice, setNotice] = useState("");
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    if (mode === "showcase") {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as ModerationPost[];
          if (Array.isArray(parsed)) setPosts(parsed);
        } catch {
          window.localStorage.removeItem(storageKey);
        }
      }
      setLoading(false);
      return;
    }
    void loadLive();
  }, [mode, status]);

  useEffect(() => {
    if (mode === "showcase") window.localStorage.setItem(storageKey, JSON.stringify(posts));
  }, [mode, posts]);

  async function loadLive() {
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

  const visiblePosts = useMemo(
    () => (mode === "showcase" ? posts.filter((post) => post.moderationStatus === status) : posts),
    [mode, posts, status],
  );

  async function decide(post: ModerationPost, decision: "approved" | "rejected" | "removed") {
    const reason = window.prompt(
      decision === "approved"
        ? "Optional internal approval note:"
        : "Record a short internal reason for the decision:",
      post.moderationReason ?? "",
    );
    if (reason === null) return;
    if (mode === "showcase") {
      setPosts((current) =>
        current.map((row) =>
          row.id === post.id
            ? { ...row, moderationStatus: decision, moderationReason: reason || undefined }
            : row,
        ),
      );
      setNotice(`Showcase post ${decision}. The change is saved only in this browser.`);
      return;
    }
    try {
      const response = await fetch("/api/admin/gifts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ postId: post.id, decision, moderationReason: reason }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "The decision could not be saved.");
      setNotice(`Post ${decision}.`);
      await loadLive();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The decision could not be saved.");
    }
  }

  function resetShowcase() {
    setPosts(previewPosts);
    window.localStorage.removeItem(storageKey);
    setStatus("pending");
    setNotice("Gift moderation showcase restored.");
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
      {mode === "showcase" ? (
        <p className="module-notice">
          Interactive showcase: moderation decisions are stored only in this browser and never touch
          church records.
        </p>
      ) : null}
      {notice ? (
        <p className="module-notice" role="status">
          {notice}
        </p>
      ) : null}
      {loading ? <p className="module-empty">Loading gift posts…</p> : null}
      {!loading ? (
        <div className="gift-moderation-list">
          {visiblePosts.map((post) => (
            <article key={post.id}>
              <header>
                <div>
                  <span>{post.postType.replaceAll("_", " ")}</span>
                  <span>{post.exchangeType}</span>
                  <span>{post.riskLevel} risk</span>
                </div>
                <small>
                  {post.ownerName} · {new Date(post.createdAt).toLocaleString()}
                </small>
              </header>
              <h4>{post.title}</h4>
              <p>{post.description}</p>
              <div className="tag-row">
                {[...post.giftTags, ...post.skillTags].map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              {post.moderationReason ? <blockquote>{post.moderationReason}</blockquote> : null}
              <div>
                <button type="button" onClick={() => void decide(post, "approved")}>
                  Approve
                </button>
                <button type="button" onClick={() => void decide(post, "rejected")}>
                  Reject
                </button>
                <button type="button" onClick={() => void decide(post, "removed")}>
                  Remove
                </button>
              </div>
            </article>
          ))}
          {!visiblePosts.length ? (
            <p className="module-empty">No gift posts are in this queue.</p>
          ) : null}
        </div>
      ) : null}
      <p className="module-boundary">
        Review paid services, home access, transportation, childcare, professional claims, tools,
        donations, and item sharing carefully. Approval is not a church guarantee of price, quality,
        safety, licensing, insurance, or suitability.
      </p>
      {mode === "showcase" ? (
        <button type="button" className="module-secondary" onClick={resetShowcase}>
          Reset moderation showcase
        </button>
      ) : null}
    </section>
  );
}
