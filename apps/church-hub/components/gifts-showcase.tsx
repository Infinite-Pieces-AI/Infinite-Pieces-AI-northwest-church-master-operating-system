"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useShowcaseStore } from "./use-showcase-store";

type GiftTab = "exchange" | "profile" | "assessment";
type OpportunityType =
  | "church_need"
  | "member_need"
  | "service_offer"
  | "item_for_sale"
  | "item_free"
  | "barter";

type OpportunityStatus = "open" | "matched" | "fulfilled" | "closed";

interface GiftSkill {
  id: string;
  name: string;
  category: string;
  level: "learning" | "comfortable" | "experienced" | "expert";
  serve: boolean;
  mentor: boolean;
}

interface GiftReply {
  id: string;
  label: string;
  message: string;
  createdAt: string;
}

interface GiftOpportunity {
  id: string;
  type: OpportunityType;
  title: string;
  description: string;
  category: string;
  compensation: "volunteer" | "free" | "paid" | "barter";
  price?: number;
  location: string;
  schedule: string;
  authorLabel: string;
  status: OpportunityStatus;
  replies: GiftReply[];
}

interface GiftsState {
  profile: {
    headline: string;
    summary: string;
    availability: string;
    sharing: "private" | "leaders" | "church";
  };
  skills: GiftSkill[];
  opportunities: GiftOpportunity[];
  assessment: Record<string, number>;
}

const giftCategories = [
  "Hospitality",
  "Teaching",
  "Encouragement",
  "Mercy and care",
  "Service",
  "Leadership",
  "Administration",
  "Music",
  "Creative",
  "Technology",
  "Trades and repair",
  "Transportation",
  "Professional",
  "Other",
];

const initialState: GiftsState = {
  profile: {
    headline: "I enjoy practical service, welcoming people, and technology.",
    summary:
      "I am open to helping with Sunday setup, family events, simple technology questions, and one-time projects.",
    availability: "Most Saturdays and some Sundays after worship.",
    sharing: "church",
  },
  skills: [
    {
      id: "gift-setup",
      name: "Event setup and logistics",
      category: "Service",
      level: "experienced",
      serve: true,
      mentor: false,
    },
    {
      id: "gift-tech",
      name: "Websites and technology",
      category: "Technology",
      level: "comfortable",
      serve: true,
      mentor: true,
    },
  ],
  opportunities: [
    {
      id: "need-welcome",
      type: "church_need",
      title: "Two welcome-team helpers for next Sunday",
      description:
        "Help greet first-time guests, answer basic building questions, and walk families toward Kids Kingdom check-in.",
      category: "Hospitality",
      compensation: "volunteer",
      location: "Butler Middle School",
      schedule: "Sunday, 9:25–10:10 AM",
      authorLabel: "Church need",
      status: "open",
      replies: [],
    },
    {
      id: "offer-repair",
      type: "service_offer",
      title: "Available for small household repair questions",
      description:
        "I can help church members think through basic repairs, furniture assembly, or what kind of professional to call for a larger job.",
      category: "Trades and repair",
      compensation: "free",
      location: "Lowell area",
      schedule: "Coordinate in the app",
      authorLabel: "Member offer",
      status: "open",
      replies: [
        {
          id: "reply-repair-1",
          label: "Member question",
          message: "Would you be willing to help me understand a shelving project?",
          createdAt: "Today",
        },
      ],
    },
    {
      id: "free-bike",
      type: "item_free",
      title: "Children’s bicycle available to another family",
      description:
        "A gently used bicycle is available at no cost. A parent should inspect fit and safety before use.",
      category: "Family items",
      compensation: "free",
      location: "Exchange at a public church gathering",
      schedule: "Available this week",
      authorLabel: "Family listing",
      status: "open",
      replies: [],
    },
    {
      id: "need-photos",
      type: "church_need",
      title: "Photography help for an approved service project",
      description:
        "The communications team needs a volunteer who can take a small set of consent-approved photos and deliver accessible image descriptions.",
      category: "Creative",
      compensation: "volunteer",
      location: "Lowell",
      schedule: "Saturday morning",
      authorLabel: "Communications team",
      status: "matched",
      replies: [],
    },
  ],
  assessment: {
    hospitality: 4,
    teaching: 2,
    encouragement: 4,
    mercy: 3,
    service: 5,
    leadership: 3,
    administration: 4,
    creative: 3,
  },
};

const typeLabels: Record<OpportunityType, string> = {
  church_need: "Church need",
  member_need: "Member need",
  service_offer: "Skill offered",
  item_for_sale: "For sale",
  item_free: "Free item",
  barter: "Exchange",
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function GiftsShowcase() {
  const [state, setState, reset, hydrated] = useShowcaseStore(
    "church-hub-gifts-showcase-v1",
    initialState,
  );
  const [tab, setTab] = useState<GiftTab>("exchange");
  const [filter, setFilter] = useState<"all" | OpportunityType>("all");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return state.opportunities.filter((item) => {
      const typeMatch = filter === "all" || item.type === filter;
      const textMatch =
        !needle ||
        `${item.title} ${item.description} ${item.category} ${item.location}`
          .toLowerCase()
          .includes(needle);
      return typeMatch && textMatch;
    });
  }, [filter, search, state.opportunities]);

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState((current) => ({
      ...current,
      profile: {
        headline: String(form.get("headline") ?? "").trim(),
        summary: String(form.get("summary") ?? "").trim(),
        availability: String(form.get("availability") ?? "").trim(),
        sharing: String(form.get("sharing") ?? "church") as GiftsState["profile"]["sharing"],
      },
    }));
  }

  function addSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    if (!name) return;
    const skill: GiftSkill = {
      id: makeId("gift"),
      name,
      category: String(form.get("category") ?? "Other"),
      level: String(form.get("level") ?? "comfortable") as GiftSkill["level"],
      serve: form.get("serve") === "on",
      mentor: form.get("mentor") === "on",
    };
    setState((current) => ({ ...current, skills: [...current.skills, skill] }));
    event.currentTarget.reset();
  }

  function createOpportunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const type = String(form.get("type") ?? "service_offer") as OpportunityType;
    const compensation = String(form.get("compensation") ?? "volunteer") as GiftOpportunity["compensation"];
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    if (!title || !description) return;
    const rawPrice = Number(form.get("price") ?? 0);
    const opportunity: GiftOpportunity = {
      id: makeId("opportunity"),
      type,
      title,
      description,
      category: String(form.get("category") ?? "Other"),
      compensation,
      ...(compensation === "paid" && rawPrice >= 0 ? { price: rawPrice } : {}),
      location: String(form.get("location") ?? "Coordinate privately").trim(),
      schedule: String(form.get("schedule") ?? "Coordinate in the app").trim(),
      authorLabel: type === "church_need" ? "Church need" : "My listing",
      status: "open",
      replies: [],
    };
    setState((current) => ({
      ...current,
      opportunities: [opportunity, ...current.opportunities],
    }));
    setCreating(false);
    event.currentTarget.reset();
  }

  function addReply(event: FormEvent<HTMLFormElement>, opportunityId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const message = String(form.get("message") ?? "").trim();
    if (!message) return;
    setState((current) => ({
      ...current,
      opportunities: current.opportunities.map((item) =>
        item.id === opportunityId
          ? {
              ...item,
              replies: [
                ...item.replies,
                { id: makeId("reply"), label: "My reply", message, createdAt: "Just now" },
              ],
            }
          : item,
      ),
    }));
    setReplyingTo(null);
  }

  function setStatus(id: string, status: OpportunityStatus) {
    setState((current) => ({
      ...current,
      opportunities: current.opportunities.map((item) =>
        item.id === id ? { ...item, status } : item,
      ),
    }));
  }

  const rankedAssessment = Object.entries(state.assessment).sort((a, b) => b[1] - a[1]);

  return (
    <div className="ministry-showcase gifts-showcase" aria-busy={!hydrated}>
      <section className="space-hero space-hero--gifts">
        <div>
          <p className="space-eyebrow">Every member has something to contribute</p>
          <h2>Gifts of the Church</h2>
          <p>
            Share skills, discover church needs, offer practical help, exchange useful items, and
            make it easier for people to serve with the strengths God has given them.
          </p>
          <div className="space-hero__actions">
            <button className="hub-button hub-button--light" type="button" onClick={() => setCreating(true)}>
              + Post a gift or need
            </button>
            <button className="hub-button hub-button--ghost-light" type="button" onClick={() => setTab("profile")}>
              Build my gift profile
            </button>
          </div>
        </div>
        <div className="space-stat-ring" aria-label={`${state.skills.length} gifts in my profile`}>
          <strong>{state.skills.length}</strong>
          <span>gifts in my profile</span>
        </div>
      </section>

      <nav className="space-tabs" aria-label="Gifts workspace">
        <button className={tab === "exchange" ? "active" : ""} onClick={() => setTab("exchange")} type="button">
          Gifts Exchange
        </button>
        <button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")} type="button">
          My Gifts
        </button>
        <button className={tab === "assessment" ? "active" : ""} onClick={() => setTab("assessment")} type="button">
          Strengths Reflection
        </button>
        <button className="space-tabs__reset" type="button" onClick={reset}>
          Reset preview
        </button>
      </nav>

      {tab === "exchange" ? (
        <>
          <section className="space-toolbar">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search skills, needs, items, or locations…"
              aria-label="Search Gifts of the Church"
            />
            <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
              <option value="all">All posts</option>
              {Object.entries(typeLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
            <button className="hub-button hub-button--primary" type="button" onClick={() => setCreating(true)}>
              New post
            </button>
          </section>

          {creating ? (
            <section className="space-form-card">
              <div className="panel-heading">
                <div>
                  <p className="hub-kicker">Create a church-visible post</p>
                  <h2>What can you offer or what is needed?</h2>
                </div>
                <button className="space-icon-button" type="button" onClick={() => setCreating(false)} aria-label="Close form">
                  ×
                </button>
              </div>
              <form className="space-form" onSubmit={createOpportunity}>
                <label>
                  Post type
                  <select name="type" defaultValue="service_offer">
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Category
                  <select name="category">{giftCategories.map((category) => <option key={category}>{category}</option>)}</select>
                </label>
                <label className="space-form__wide">
                  Title
                  <input name="title" maxLength={180} required placeholder="Example: Help needed setting up tables" />
                </label>
                <label className="space-form__wide">
                  Description
                  <textarea name="description" rows={4} maxLength={4000} required />
                </label>
                <label>
                  Arrangement
                  <select name="compensation" defaultValue="volunteer">
                    <option value="volunteer">Volunteer</option>
                    <option value="free">Free</option>
                    <option value="paid">Paid introduction</option>
                    <option value="barter">Exchange / barter</option>
                  </select>
                </label>
                <label>
                  Price, when paid
                  <input name="price" type="number" min={0} step="0.01" placeholder="0.00" />
                </label>
                <label>
                  General location
                  <input name="location" maxLength={180} placeholder="Lowell area or church gathering" />
                </label>
                <label>
                  Timing
                  <input name="schedule" maxLength={300} placeholder="Saturday morning or flexible" />
                </label>
                <div className="space-form__wide space-form__actions">
                  <button className="hub-button hub-button--primary" type="submit">Publish to the church board</button>
                  <small>
                    The church does not process payments or guarantee private transactions. Keep
                    exchanges transparent and use safe public meeting arrangements.
                  </small>
                </div>
              </form>
            </section>
          ) : null}

          <section className="opportunity-grid">
            {filtered.map((item) => (
              <article className="opportunity-card" key={item.id}>
                <header>
                  <span className={`space-badge space-badge--${item.type}`}>{typeLabels[item.type]}</span>
                  <span className={`space-status space-status--${item.status}`}>{item.status}</span>
                </header>
                <p className="opportunity-card__author">{item.authorLabel} · {item.category}</p>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
                <dl>
                  <div><dt>Where</dt><dd>{item.location}</dd></div>
                  <div><dt>When</dt><dd>{item.schedule}</dd></div>
                  <div>
                    <dt>Arrangement</dt>
                    <dd>
                      {item.compensation}
                      {item.price !== undefined ? ` · $${item.price.toFixed(2)}` : ""}
                    </dd>
                  </div>
                </dl>
                {item.replies.length ? (
                  <div className="space-thread">
                    {item.replies.map((reply) => (
                      <div key={reply.id}>
                        <strong>{reply.label}</strong>
                        <span>{reply.message}</span>
                        <small>{reply.createdAt}</small>
                      </div>
                    ))}
                  </div>
                ) : null}
                {replyingTo === item.id ? (
                  <form className="inline-reply" onSubmit={(event) => addReply(event, item.id)}>
                    <textarea name="message" rows={3} required placeholder="Ask a question or offer to help…" />
                    <div>
                      <button className="hub-button hub-button--primary" type="submit">Post reply</button>
                      <button className="hub-button hub-button--secondary" type="button" onClick={() => setReplyingTo(null)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="opportunity-card__actions">
                    <button className="hub-button hub-button--primary" type="button" onClick={() => setReplyingTo(item.id)}>
                      {item.type === "church_need" || item.type === "member_need" ? "I may be able to help" : "Ask or reply"}
                    </button>
                    {item.authorLabel === "My listing" ? (
                      <button className="hub-button hub-button--secondary" type="button" onClick={() => setStatus(item.id, "fulfilled")}>
                        Mark fulfilled
                      </button>
                    ) : null}
                  </div>
                )}
              </article>
            ))}
          </section>
        </>
      ) : null}

      {tab === "profile" ? (
        <div className="space-two-column">
          <section className="space-form-card">
            <p className="hub-kicker">How I hope to contribute</p>
            <h2>My gift profile</h2>
            <form className="space-form" onSubmit={saveProfile}>
              <label className="space-form__wide">
                Headline
                <input name="headline" defaultValue={state.profile.headline} maxLength={160} />
              </label>
              <label className="space-form__wide">
                Service summary
                <textarea name="summary" rows={5} defaultValue={state.profile.summary} maxLength={1200} />
              </label>
              <label className="space-form__wide">
                Availability
                <input name="availability" defaultValue={state.profile.availability} maxLength={500} />
              </label>
              <label>
                Who may see this?
                <select name="sharing" defaultValue={state.profile.sharing}>
                  <option value="private">Only me</option>
                  <option value="leaders">Approved leaders</option>
                  <option value="church">Church members</option>
                </select>
              </label>
              <div className="space-form__actions">
                <button className="hub-button hub-button--primary" type="submit">Save profile</button>
              </div>
            </form>
          </section>
          <section className="space-form-card">
            <p className="hub-kicker">Skills and gifts</p>
            <h2>{state.skills.length} gifts listed</h2>
            <div className="gift-skill-list">
              {state.skills.map((skill) => (
                <article key={skill.id}>
                  <div><strong>{skill.name}</strong><span>{skill.category} · {skill.level}</span></div>
                  <div className="gift-flags">
                    {skill.serve ? <span>Ready to serve</span> : null}
                    {skill.mentor ? <span>Can mentor</span> : null}
                  </div>
                </article>
              ))}
            </div>
            <form className="space-form space-form--compact" onSubmit={addSkill}>
              <label className="space-form__wide">
                Add a gift or practical skill
                <input name="name" required maxLength={120} placeholder="Example: cooking for large groups" />
              </label>
              <label>Category<select name="category">{giftCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
              <label>Experience<select name="level" defaultValue="comfortable"><option value="learning">Learning</option><option value="comfortable">Comfortable</option><option value="experienced">Experienced</option><option value="expert">Expert</option></select></label>
              <label className="space-check"><input name="serve" type="checkbox" defaultChecked /> Open to serving</label>
              <label className="space-check"><input name="mentor" type="checkbox" /> Open to mentoring</label>
              <button className="hub-button hub-button--secondary" type="submit">Add gift</button>
            </form>
          </section>
        </div>
      ) : null}

      {tab === "assessment" ? (
        <div className="space-two-column">
          <section className="space-form-card">
            <p className="hub-kicker">Voluntary self-reflection</p>
            <h2>Where do you feel energized to contribute?</h2>
            <p>
              This is not a spiritual ranking or automatic assignment. It helps you name strengths,
              growth areas, and conversations you may want to have with a ministry leader.
            </p>
            <div className="assessment-list">
              {Object.entries(state.assessment).map(([key, value]) => (
                <label key={key}>
                  <span>{key.replaceAll("_", " ")}</span>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={value}
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        assessment: { ...current.assessment, [key]: Number(event.target.value) },
                      }))
                    }
                  />
                  <strong>{value}/5</strong>
                </label>
              ))}
            </div>
          </section>
          <section className="space-form-card assessment-results">
            <p className="hub-kicker">My current reflection</p>
            <h2>Strongest areas right now</h2>
            {rankedAssessment.slice(0, 4).map(([key, value], index) => (
              <article key={key}>
                <span>{index + 1}</span>
                <div><strong>{key.replaceAll("_", " ")}</strong><small>{value}/5 self-reported</small></div>
              </article>
            ))}
            <div className="space-callout">
              <strong>Suggested next step</strong>
              <p>
                Browse open church needs that match your top areas, or share this reflection with an
                approved leader for a human conversation.
              </p>
              <button className="hub-button hub-button--primary" type="button" onClick={() => { setTab("exchange"); setFilter("church_need"); }}>
                View matching church needs
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
