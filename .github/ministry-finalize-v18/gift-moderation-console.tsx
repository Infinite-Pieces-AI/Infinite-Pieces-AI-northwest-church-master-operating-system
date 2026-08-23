"use client";

import { useEffect, useMemo, useState } from "react";

type ModerationStatus = "pending" | "approved" | "rejected" | "removed";
type RiskLevel = "standard" | "review" | "restricted";

interface GiftModerationPost {
  id: string;
  ownerName: string;
  postType: string;
  title: string;
  description: string;
  giftTags: string[];
  skillTags: string[];
  exchangeType: string;
  priceNote?: string;
  generalLocation?: string;
  availability?: string;
  status: string;
  moderationStatus: ModerationStatus;
  riskLevel: RiskLevel;
  moderationNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

const previewPosts: GiftModerationPost[] = [
  {
    id: "gift-review-1",
    ownerName: "Taylor Member",
    postType: "offer",
    title: "Paid electrical repair assistance",
    description:
      "I am offering paid household electrical assistance. A moderator should verify how professional licensing, insurance, home access, and payment language are represented before this appears to members.",
    giftTags: ["Service"],
    skillTags: ["Electrical", "Home access"],
    exchangeType: "paid",
    priceNote: "Contact for a quote",
    generalLocation: "Lowell area",
    availability: "Saturday mornings",
    status: "open",
    moderationStatus: "pending",
    riskLevel: "review",
    createdAt: new Date(Date.now() - 25 * 60_000).toISOString(),
  },
  {
    id: "gift-review-2",
    ownerName: "Hospitality Leader",
    postType: "church_need",
    title: "Two welcome-team volunteers needed",
    description:
      "Help first-time guests find the approved entrance, Kids Kingdom check-in, seating, and a person who can answer practical questions.",
    giftTags: ["Hospitality", "Mercy"],
    skillTags: ["Greeting", "Guest support"],
    exchangeType: "free",
    generalLocation: "Butler Middle School",
    availability: "Sundays, 9:20–10:15 AM",
    status: "open",
    moderationStatus: "approved",
    riskLevel: "standard",
    moderationNote: "Verified as an approved church need.",
    reviewedBy: "Local Preview Moderator",
    reviewedAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 60 * 60_000).toISOString(),
  },
];

export function GiftModerationConsole({ mode }: { mode: "showcase" | "live" }) {
  const [posts, setPosts] = useState<GiftModerationPost[]>(
    mode === "showcase" ? previewPosts : [],
  );
  const [view, setView] = useState<"pending" | "history">("pending");
  const [loading, setLoading] = useState(mode === "live");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (mode === "live") void refresh();
  }, [mode]);

  async function refresh() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/gifts", { cache: "no-store" });
      const payload = (await response.json()) as {
        posts?: GiftModerationPost[];
        message?: string;
      };
      if (!response.ok) throw new Error(payload.message ?? "Gift moderation could not be loaded.");
      setPosts(payload.posts ?? []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gift moderation could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  async function decide(post: GiftModerationPost, decision: ModerationStatus) {
    const note = window.prompt(
      decision === "approved"
        ? "Record why this post is safe and appropriate for the selected audience:"
        : "Record the private moderation reason:",
      post.moderationNote ?? "",
    );
    if (note === null) return;
    try {
      if (mode === "showcase") {
        setPosts((current) =>
          current.map((entry) =>
            entry.id === post.id
              ? {
                  ...entry,
                  moderationStatus: decision,
                  moderationNote: note.trim() || undefined,
                  status: decision === "approved" ? "open" : decision === "removed" ? "removed" : "closed",
                  reviewedBy: "Local Preview Moderator",
                  reviewedAt: new Date().toISOString(),
                }
              : entry,
          ),
        );
      } else {
        const response = await fetch("/api/admin/gifts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ postId: post.id, decision, note }),
        });
        const payload = (await response.json()) as { message?: string };
        if (!response.ok) throw new Error(payload.message ?? "Moderation failed.");
        await refresh();
      }
      setNotice(`Gift post marked ${decision}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Moderation failed.");
    }
  }

  const visible = useMemo(
    () =>
      posts.filter((post) =>
        view === "pending" ? post.moderationStatus === "pending" : post.moderationStatus !== "pending",
      ),
    [posts, view],
  );

  return (
    <section className="module-workspace">
      <div className="module-tabs" aria-label="Gift moderation views">
        <button
          type="button"
          className={view === "pending" ? "active" : ""}
          onClick={() => setView("pending")}
        >
          Pending review
        </button>
        <button
          type="button"
          className={view === "history" ? "active" : ""}
          onClick={() => setView("history")}
        >
          Decision history
        </button>
      </div>
      <p className="module-boundary">
        Paid services, item sharing, transportation, home access, childcare language, professional
        claims, tools, donations, and payment-account references require careful review. Approval is
        not a guarantee of quality, safety, licensing, insurance, or outcome.
      </p>
      {notice ? (
        <p className="module-notice" role="status">
          {notice}
        </p>
      ) : null}
      {loading ? <p className="module-empty">Loading moderation queue…</p> : null}
      {!loading ? (
        <div className="gift-moderation-list">
          {visible.map((post) => (
            <article key={post.id}>
              <header>
                <div>
                  <span>{post.postType.replaceAll("_", " ")}</span>
                  <span>{post.exchangeType}</span>
                  <span>{post.riskLevel} risk</span>
                  <span>{post.moderationStatus}</span>
                </div>
                <small>{new Date(post.createdAt).toLocaleString()}</small>
              </header>
              <h3>{post.title}</h3>
              <p>{post.description}</p>
              <dl>
                <div>
                  <dt>Member</dt>
                  <dd>{post.ownerName}</dd>
                </div>
                <div>
                  <dt>Tags</dt>
                  <dd>{[...post.giftTags, ...post.skillTags].join(" · ") || "None"}</dd>
                </div>
                <div>
                  <dt>Area</dt>
                  <dd>{post.generalLocation ?? "Not specified"}</dd>
                </div>
                <div>
                  <dt>Terms</dt>
                  <dd>{post.priceNote ?? post.exchangeType}</dd>
                </div>
              </dl>
              {post.moderationNote ? (
                <blockquote>
                  <strong>Moderator note</strong>
                  <p>{post.moderationNote}</p>
                  {post.reviewedBy ? (
                    <small>
                      {post.reviewedBy}
                      {post.reviewedAt ? ` · ${new Date(post.reviewedAt).toLocaleString()}` : ""}
                    </small>
                  ) : null}
                </blockquote>
              ) : null}
              {post.moderationStatus === "pending" ? (
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
              ) : null}
            </article>
          ))}
          {!visible.length ? <p className="module-empty">No gift posts are in this view.</p> : null}
        </div>
      ) : null}
    </section>
  );
}
