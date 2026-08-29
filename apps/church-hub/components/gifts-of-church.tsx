"use client";

import { useEffect, useMemo, useState } from "react";

type GiftTheme = "directional" | "relational" | "insight" | "positional" | "other";
type GiftPostType = "offer" | "member_need" | "church_need" | "item_share";
type ExchangeType = "free" | "donation" | "borrow" | "exchange" | "paid";
type ModerationStatus = "pending" | "approved" | "rejected" | "removed";

type GiftTab = "board" | "gifts" | "create" | "matches" | "review";

interface GiftScore {
  id: string;
  label: string;
  score: number;
  theme: GiftTheme;
}

interface GiftResponse {
  id: string;
  profileName: string;
  message: string;
  status: "interested" | "accepted" | "declined" | "completed" | "withdrawn";
}

interface GiftPost {
  id: string;
  type: GiftPostType;
  title: string;
  description: string;
  ownerName: string;
  isMine: boolean;
  giftTags: string[];
  skillTags: string[];
  exchangeType: ExchangeType;
  priceNote?: string;
  generalLocation?: string;
  availability?: string;
  status: "draft" | "open" | "matched" | "fulfilled" | "closed" | "removed";
  moderationStatus: ModerationStatus;
  responses: GiftResponse[];
}

interface GiftsPayload {
  scores: GiftScore[];
  posts: GiftPost[];
  providerKey?: string;
  providerReportUrl?: string | null;
}

const previewScores: GiftScore[] = [
  { id: "hospitality", label: "Hospitality", score: 96, theme: "relational" },
  { id: "apostleship", label: "Apostleship", score: 92, theme: "directional" },
  { id: "evangelism", label: "Evangelism", score: 88, theme: "directional" },
  { id: "leadership", label: "Leadership", score: 72, theme: "positional" },
  { id: "wisdom", label: "Wisdom", score: 67, theme: "insight" },
  { id: "prophecy", label: "Prophecy", score: 61, theme: "insight" },
  { id: "mentoring", label: "Mentoring", score: 58, theme: "relational" },
  { id: "faith", label: "Faith", score: 52, theme: "directional" },
  { id: "mercy", label: "Mercy", score: 46, theme: "relational" },
  { id: "service", label: "Service", score: 25, theme: "positional" },
];

const previewPosts: GiftPost[] = [
  {
    id: "gift-post-1",
    type: "church_need",
    title: "Sunday welcome team needs two more hosts",
    description:
      "Help first-time guests find the right entrance, Kids Kingdom check-in, seating, and a friendly person to answer questions.",
    ownerName: "Hospitality Team",
    isMine: false,
    giftTags: ["Hospitality", "Mercy"],
    skillTags: ["Greeting", "Guest support"],
    exchangeType: "free",
    generalLocation: "Butler Middle School",
    availability: "Sundays, 9:20–10:15 AM",
    status: "open",
    moderationStatus: "approved",
    responses: [],
  },
  {
    id: "gift-post-2",
    type: "offer",
    title: "I can photograph family and service events",
    description:
      "I have portrait and event-photography experience and can help with approved, consented church events twice per month.",
    ownerName: "Alex Member",
    isMine: false,
    giftTags: ["Service", "Hospitality"],
    skillTags: ["Photography", "Editing"],
    exchangeType: "free",
    availability: "Two Saturdays or Sundays each month",
    status: "open",
    moderationStatus: "approved",
    responses: [],
  },
  {
    id: "gift-post-3",
    type: "member_need",
    title: "Help assembling a bookshelf after our move",
    description:
      "A household in the region could use one person with basic tools for about an hour. No home address is shared until both approved members agree privately.",
    ownerName: "Member household",
    isMine: false,
    giftTags: ["Service", "Mercy"],
    skillTags: ["Basic tools", "Furniture assembly"],
    exchangeType: "free",
    generalLocation: "Lowell area",
    availability: "Saturday afternoon",
    status: "open",
    moderationStatus: "approved",
    responses: [],
  },
  {
    id: "gift-post-4",
    type: "item_share",
    title: "Children’s folding tables available to borrow",
    description:
      "Four clean folding tables are available for a family-group event or approved church gathering.",
    ownerName: "Morgan Member",
    isMine: false,
    giftTags: ["Hospitality"],
    skillTags: ["Event supplies"],
    exchangeType: "borrow",
    generalLocation: "Chelmsford / Lowell",
    status: "open",
    moderationStatus: "approved",
    responses: [],
  },
  {
    id: "gift-post-5",
    type: "offer",
    title: "Paid bookkeeping help for small projects",
    description:
      "I can offer paid bookkeeping setup for approved members or ministry projects. Terms and professional scope need moderator review before this appears to the church.",
    ownerName: "You",
    isMine: true,
    giftTags: ["Service", "Wisdom"],
    skillTags: ["Bookkeeping", "Spreadsheets"],
    exchangeType: "paid",
    priceNote: "Discuss scope privately after approval",
    generalLocation: "Remote / Lowell",
    status: "draft",
    moderationStatus: "pending",
    responses: [],
  },
];

const themeLabels: Record<GiftTheme, string> = {
  directional: "Directional",
  relational: "Relational",
  insight: "Insight",
  positional: "Positional",
  other: "Other",
};

const postTypeLabels: Record<GiftPostType, string> = {
  offer: "Gift offered",
  member_need: "Member need",
  church_need: "Church need",
  item_share: "Share or borrow",
};

const storageKey = "church-hub-gifts-showcase-v2";

function isRiskyPost(
  post: Pick<GiftPost, "type" | "exchangeType" | "title" | "description" | "skillTags">,
) {
  return (
    post.exchangeType === "paid" ||
    post.type === "member_need" ||
    post.type === "item_share" ||
    /\b(child|children|babysit|childcare|ride|transport|driver|home|house|address|medical|therapy|legal|finance|loan|cash|electrical|plumbing|contractor|licensed)\b/i.test(
      `${post.title} ${post.description} ${post.skillTags.join(" ")}`,
    )
  );
}

export function GiftsOfChurch({
  mode,
  canLead,
  canModerate,
  assessmentUrl,
}: {
  mode: "showcase" | "live";
  canLead: boolean;
  canModerate: boolean;
  assessmentUrl?: string;
}) {
  const [activeTab, setActiveTab] = useState<GiftTab>("board");
  const [scores, setScores] = useState<GiftScore[]>(previewScores);
  const [posts, setPosts] = useState<GiftPost[]>(previewPosts);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | GiftPostType>("all");
  const [loading, setLoading] = useState(mode === "live");
  const [notice, setNotice] = useState("");
  const [guideQuestion, setGuideQuestion] = useState("");

  useEffect(() => {
    if (mode === "showcase") {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as GiftsPayload;
          if (Array.isArray(parsed.scores) && Array.isArray(parsed.posts)) {
            setScores(parsed.scores);
            setPosts(parsed.posts);
          }
        } catch {
          window.localStorage.removeItem(storageKey);
        }
      }
      return;
    }
    void refreshLive();
  }, [mode]);

  useEffect(() => {
    if (mode !== "showcase") return;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ scores, posts } satisfies GiftsPayload),
    );
  }, [mode, posts, scores]);

  async function refreshLive() {
    setLoading(true);
    try {
      const response = await fetch("/api/gifts", { cache: "no-store" });
      const payload = (await response.json()) as GiftsPayload & { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Unable to load Gifts of the Church.");
      setScores(payload.scores ?? []);
      setPosts(payload.posts ?? []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load Gifts of the Church.");
    } finally {
      setLoading(false);
    }
  }

  async function sendLive(action: string, payload: Record<string, unknown>) {
    const response = await fetch("/api/gifts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    const result = (await response.json()) as { message?: string };
    if (!response.ok) throw new Error(result.message ?? "The action could not be completed.");
    await refreshLive();
  }

  const boardPosts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (post.moderationStatus !== "approved" && !post.isMine) return false;
      if (post.status === "removed") return false;
      if (filter !== "all" && post.type !== filter) return false;
      if (!normalized) return true;
      return `${post.title} ${post.description} ${post.giftTags.join(" ")} ${post.skillTags.join(" ")}`
        .toLowerCase()
        .includes(normalized);
    });
  }, [filter, posts, query]);

  const pendingPosts = useMemo(
    () => posts.filter((post) => post.moderationStatus === "pending"),
    [posts],
  );

  const matchedPosts = useMemo(() => {
    const strongest = new Set(
      scores.filter((score) => score.score >= 50).map((score) => score.label),
    );
    return posts
      .filter(
        (post) => post.moderationStatus === "approved" && post.status === "open" && !post.isMine,
      )
      .map((post) => ({
        post,
        score: post.giftTags.reduce((total, tag) => total + (strongest.has(tag) ? 1 : 0), 0),
      }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [posts, scores]);

  function guide() {
    const text = guideQuestion.toLowerCase();
    if (/assessment|score|gift|wired|strength/.test(text)) {
      setActiveTab("gifts");
      setNotice("Opened My Gifts so you can review or enter the strengths you choose to share.");
    } else if (/offer|post|sell|borrow|share|need help|church need/.test(text)) {
      setActiveTab("create");
      setNotice(
        "Opened Create so you can offer a skill, request help, share an item, or post an approved church need.",
      );
    } else {
      setActiveTab("matches");
      setNotice(
        "Opened Matches based only on the gift labels you explicitly entered—not private messages or inferred spirituality.",
      );
    }
  }

  async function createPost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const type = String(data.get("type")) as GiftPostType;
    const exchangeType = String(data.get("exchangeType")) as ExchangeType;
    const post: GiftPost = {
      id: crypto.randomUUID(),
      type,
      title: String(data.get("title") ?? "").trim(),
      description: String(data.get("description") ?? "").trim(),
      ownerName: canLead && type === "church_need" ? "Church leadership" : "You",
      isMine: true,
      giftTags: String(data.get("giftTags") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 12),
      skillTags: String(data.get("skillTags") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 12),
      exchangeType,
      priceNote: String(data.get("priceNote") ?? "").trim() || undefined,
      generalLocation: String(data.get("generalLocation") ?? "").trim() || undefined,
      availability: String(data.get("availability") ?? "").trim() || undefined,
      status: "draft",
      moderationStatus: "pending",
      responses: [],
    };
    const autoApprove = canModerate && type === "church_need" && !isRiskyPost(post);
    post.status = autoApprove ? "open" : "draft";
    post.moderationStatus = autoApprove ? "approved" : "pending";
    try {
      if (mode === "showcase") {
        setPosts((current) => [post, ...current]);
      } else {
        await sendLive("create_post", post as unknown as Record<string, unknown>);
      }
      form.reset();
      setActiveTab("board");
      setNotice(
        autoApprove
          ? "The approved church need is now open to members."
          : "Your post was saved for moderator review. You can see it while it is pending.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The post could not be created.");
    }
  }

  async function respond(post: GiftPost) {
    if (post.moderationStatus !== "approved" || post.status !== "open") return;
    const message = window.prompt("Write a short private response to the post owner:")?.trim();
    if (!message) return;
    try {
      if (mode === "showcase") {
        setPosts((current) =>
          current.map((row) =>
            row.id === post.id
              ? {
                  ...row,
                  responses: [
                    ...row.responses,
                    {
                      id: crypto.randomUUID(),
                      profileName: "You",
                      message,
                      status: "interested",
                    },
                  ],
                }
              : row,
          ),
        );
      } else {
        await sendLive("respond", { postId: post.id, message });
      }
      setNotice("Your private response was sent to the post owner.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The response could not be sent.");
    }
  }

  async function reviewPost(post: GiftPost, decision: "approved" | "rejected") {
    if (!canModerate) return;
    try {
      if (mode === "showcase") {
        setPosts((current) =>
          current.map((row) =>
            row.id === post.id
              ? {
                  ...row,
                  moderationStatus: decision,
                  status: decision === "approved" ? "open" : "removed",
                }
              : row,
          ),
        );
      } else {
        await sendLive("review_post", { postId: post.id, decision });
      }
      setNotice(
        decision === "approved"
          ? "The post is approved and visible to authorized members."
          : "The post was rejected and removed from member discovery.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The moderation decision failed.");
    }
  }

  async function closePost(post: GiftPost) {
    if (!post.isMine) return;
    try {
      if (mode === "showcase") {
        setPosts((current) =>
          current.map((row) => (row.id === post.id ? { ...row, status: "closed" } : row)),
        );
      } else {
        await sendLive("close_post", { postId: post.id });
      }
      setNotice("The post was closed.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The post could not be closed.");
    }
  }

  async function updateScore(score: GiftScore, nextValue: number) {
    const bounded = Math.max(0, Math.min(100, nextValue));
    const next = { ...score, score: bounded };
    if (mode === "showcase") {
      setScores((current) => current.map((row) => (row.id === score.id ? next : row)));
      return;
    }
    try {
      await sendLive("save_score", next as unknown as Record<string, unknown>);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The gift score could not be saved.");
    }
  }

  function resetShowcase() {
    setScores(previewScores);
    setPosts(previewPosts);
    window.localStorage.removeItem(storageKey);
    setNotice("Gifts of the Church showcase restored.");
  }

  const tabs: Array<[GiftTab, string]> = [
    ["board", "Gift board"],
    ["matches", "My matches"],
    ["gifts", "My gifts"],
    ["create", "Create post"],
  ];
  if (canModerate) tabs.push(["review", `Review (${pendingPosts.length})`]);

  return (
    <div className="ministry-module gifts-module">
      <section className="module-hero module-hero--gifts">
        <div>
          <p className="module-kicker">Every member has something to contribute</p>
          <h2>Discover gifts. Offer help. Meet real church needs.</h2>
          <p>
            Record the strengths you choose to share, post a practical skill or item, request help,
            and connect gifts to approved church and community needs.
          </p>
        </div>
        <div className="module-hero__metric">
          <strong>
            {
              posts.filter((post) => post.status === "open" && post.moderationStatus === "approved")
                .length
            }
          </strong>
          <span>open approved opportunities</span>
        </div>
      </section>

      <section className="module-guide">
        <div>
          <strong>✦ Gift Guide</strong>
          <span>Ask where to enter your assessment, offer a skill, or find a matching need.</span>
        </div>
        <div>
          <input
            value={guideQuestion}
            onChange={(event) => setGuideQuestion(event.target.value)}
            placeholder="Example: I am good at welcoming people—where could I help?"
          />
          <button type="button" onClick={guide}>
            Guide me
          </button>
        </div>
      </section>

      <nav className="module-tabs" aria-label="Gifts of the Church sections">
        {tabs.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={activeTab === value ? "active" : ""}
            onClick={() => setActiveTab(value)}
          >
            {label}
          </button>
        ))}
      </nav>

      {notice ? (
        <p className="module-notice" role="status">
          {notice}
        </p>
      ) : null}
      {loading ? <p className="module-empty">Loading the church gift board…</p> : null}

      {!loading && activeTab === "board" ? (
        <section className="module-workspace">
          <div className="module-toolbar">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search hospitality, repairs, photography, mentoring…"
            />
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as typeof filter)}
            >
              <option value="all">All posts</option>
              <option value="church_need">Church needs</option>
              <option value="offer">Gifts offered</option>
              <option value="member_need">Member needs</option>
              <option value="item_share">Share or borrow</option>
            </select>
          </div>
          <div className="gift-board-grid">
            {boardPosts.map((post) => (
              <article className="gift-post-card" key={post.id}>
                <header>
                  <span>{postTypeLabels[post.type]}</span>
                  <b>
                    {post.moderationStatus === "pending" ? "Awaiting review" : post.exchangeType}
                  </b>
                </header>
                <h3>{post.title}</h3>
                <p>{post.description}</p>
                <div className="tag-row">
                  {[...post.giftTags, ...post.skillTags].map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <dl>
                  <div>
                    <dt>Posted by</dt>
                    <dd>{post.ownerName}</dd>
                  </div>
                  {post.generalLocation ? (
                    <div>
                      <dt>Area</dt>
                      <dd>{post.generalLocation}</dd>
                    </div>
                  ) : null}
                  {post.availability ? (
                    <div>
                      <dt>When</dt>
                      <dd>{post.availability}</dd>
                    </div>
                  ) : null}
                  {post.priceNote ? (
                    <div>
                      <dt>Terms</dt>
                      <dd>{post.priceNote}</dd>
                    </div>
                  ) : null}
                </dl>
                <footer>
                  {post.moderationStatus === "approved" &&
                  post.status === "open" &&
                  !post.isMine ? (
                    <button type="button" onClick={() => void respond(post)}>
                      Respond privately
                    </button>
                  ) : null}
                  {post.isMine && post.moderationStatus === "pending" ? (
                    <small>Only you and moderators can see this draft.</small>
                  ) : null}
                  {post.isMine && post.moderationStatus === "approved" && post.status === "open" ? (
                    <button type="button" onClick={() => void closePost(post)}>
                      Close post
                    </button>
                  ) : null}
                  <small>
                    {post.responses.length} response{post.responses.length === 1 ? "" : "s"}
                  </small>
                </footer>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {!loading && activeTab === "matches" ? (
        <section className="module-workspace">
          <div className="section-heading">
            <div>
              <p>Explainable matching</p>
              <h3>Approved needs that overlap with your entered gifts</h3>
            </div>
          </div>
          <p className="module-boundary">
            Matching uses only gift labels you explicitly entered. It never reads prayer requests,
            private messages, recovery participation, or a hidden “spiritual maturity” score.
          </p>
          <div className="match-list">
            {matchedPosts.map(({ post, score }) => (
              <article key={post.id}>
                <strong>{post.title}</strong>
                <span>
                  {score} matching gift tag{score === 1 ? "" : "s"}:{" "}
                  {post.giftTags
                    .filter((tag) => scores.some((gift) => gift.label === tag && gift.score >= 50))
                    .join(", ")}
                </span>
                <button type="button" onClick={() => void respond(post)}>
                  I may be able to help
                </button>
              </article>
            ))}
            {!matchedPosts.length ? (
              <p className="module-empty">
                Add gift labels or wait for an approved church need that overlaps with them.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {!loading && activeTab === "gifts" ? (
        <section className="module-workspace gifts-report">
          <div className="section-heading">
            <div>
              <p>Member-controlled assessment summary</p>
              <h3>Your strengths at a glance</h3>
            </div>
            {assessmentUrl ? (
              <a href={assessmentUrl} target="_blank" rel="noreferrer">
                Open approved assessment ↗
              </a>
            ) : null}
          </div>
          <p className="module-boundary">
            The Hub does not copy TrueWiring’s questionnaire or licensed report. You may manually
            enter results from a report you are authorized to use, and only your explicit gift posts
            become visible to other members.
          </p>
          <div className="gift-score-list">
            {scores.map((score) => (
              <label key={score.id}>
                <span>
                  <strong>{score.label}</strong>
                  <small>{themeLabels[score.theme]}</small>
                </span>
                <div>
                  <i style={{ width: `${score.score}%` }} data-theme={score.theme} />
                </div>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={score.score}
                  onChange={(event) => void updateScore(score, Number(event.target.value))}
                  aria-label={`${score.label} percentage`}
                />
              </label>
            ))}
          </div>
          {mode === "showcase" ? (
            <button className="module-secondary" type="button" onClick={resetShowcase}>
              Reset showcase
            </button>
          ) : null}
        </section>
      ) : null}

      {!loading && activeTab === "create" ? (
        <section className="module-workspace">
          <div className="section-heading">
            <div>
              <p>One clear post</p>
              <h3>Offer a gift or describe a need</h3>
            </div>
          </div>
          <form className="module-form" onSubmit={(event) => void createPost(event)}>
            <label>
              Post type
              <select name="type" defaultValue="offer">
                <option value="offer">I can offer a gift or skill</option>
                <option value="member_need">I need practical help</option>
                {canLead ? <option value="church_need">The church needs help</option> : null}
                <option value="item_share">I can share, lend, or request an item</option>
              </select>
            </label>
            <label>
              Title
              <input name="title" required minLength={3} maxLength={180} />
            </label>
            <label className="span-2">
              Description
              <textarea name="description" required minLength={10} maxLength={5000} rows={5} />
            </label>
            <label>
              Spiritual-gift tags
              <input name="giftTags" placeholder="Hospitality, Mercy, Leadership" />
            </label>
            <label>
              Practical skill tags
              <input name="skillTags" placeholder="Cooking, tutoring, repairs" />
            </label>
            <label>
              Exchange
              <select name="exchangeType" defaultValue="free">
                <option value="free">Free service</option>
                <option value="donation">Donation</option>
                <option value="borrow">Borrow or lend</option>
                <option value="exchange">Exchange</option>
                <option value="paid">Paid professional service</option>
              </select>
            </label>
            <label>
              Terms, if paid
              <input name="priceNote" placeholder="The app does not process payment" />
            </label>
            <label>
              General area
              <input
                name="generalLocation"
                placeholder="Lowell area; exact address shared privately"
              />
            </label>
            <label>
              Availability
              <input name="availability" placeholder="Saturday mornings" />
            </label>
            <button type="submit">Submit for member-board review</button>
          </form>
          <p className="module-boundary">
            The church moderates posts before broad publication. The app does not process payments,
            verify professional licenses, authorize unscreened child care, or permit dangerous,
            illegal, controlled, or restricted items.
          </p>
        </section>
      ) : null}

      {!loading && activeTab === "review" && canModerate ? (
        <section className="module-workspace">
          <div className="section-heading">
            <div>
              <p>Authorized moderation</p>
              <h3>Pending Gift Board posts</h3>
            </div>
          </div>
          <p className="module-boundary">
            Review payment, home access, transportation, child-related activity,
            professional-service claims, and item safety carefully. Approval does not certify a
            license, guarantee a service, or transfer church liability.
          </p>
          <div className="gift-board-grid">
            {pendingPosts.map((post) => (
              <article className="gift-post-card" key={post.id}>
                <header>
                  <span>{postTypeLabels[post.type]}</span>
                  <b>Pending</b>
                </header>
                <h3>{post.title}</h3>
                <p>{post.description}</p>
                <div className="tag-row">
                  {[...post.giftTags, ...post.skillTags].map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <dl>
                  <div>
                    <dt>Member</dt>
                    <dd>{post.ownerName}</dd>
                  </div>
                  <div>
                    <dt>Exchange</dt>
                    <dd>{post.exchangeType}</dd>
                  </div>
                  {post.generalLocation ? (
                    <div>
                      <dt>Area</dt>
                      <dd>{post.generalLocation}</dd>
                    </div>
                  ) : null}
                </dl>
                <footer>
                  <button type="button" onClick={() => void reviewPost(post, "approved")}>
                    Approve
                  </button>
                  <button type="button" onClick={() => void reviewPost(post, "rejected")}>
                    Reject
                  </button>
                </footer>
              </article>
            ))}
            {!pendingPosts.length ? (
              <p className="module-empty">No posts are waiting for review.</p>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
