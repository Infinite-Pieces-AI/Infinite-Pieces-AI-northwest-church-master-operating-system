"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

type RecoveryRole = "participant" | "peer_support" | "leader" | "admin";
type SessionStatus = "draft" | "published" | "completed" | "cancelled";
type ProgressStatus = "not_started" | "in_progress" | "completed" | "skipped";

interface RecoverySession {
  id: string;
  week: number;
  title: string;
  summary: string;
  scriptureReferences: string[];
  resourceUrl?: string;
  scheduledFor?: string;
  status: SessionStatus;
  progress: ProgressStatus;
  leaderAgenda?: string;
  safetyNotes?: string;
}

interface RecoveryPost {
  id: string;
  type: "announcement" | "discussion" | "encouragement" | "resource" | "meeting_update";
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
  leaderOnly: boolean;
  comments: Array<{ id: string; authorName: string; body: string; createdAt: string }>;
}

interface RecoveryPayload {
  program: {
    id: string;
    displayName: string;
    publicSummary: string;
    meetingDay?: string;
    meetingTime?: string;
    generalLocation?: string;
    programType: "custom" | "celebrate_recovery";
    officialProgramConfirmation: boolean;
  } | null;
  membershipRole: RecoveryRole | null;
  sessions: RecoverySession[];
  posts: RecoveryPost[];
}

const defaultProgramDetails = {
  meetingDay: "Sunday",
  meetingTime: "08:30",
  generalLocation: "Approved participants receive exact room directions privately.",
};

const previewSessions: RecoverySession[] = [
  {
    id: "recovery-week-1",
    week: 1,
    title: "Welcome, safety, and honest community",
    summary:
      "Establish confidentiality expectations, understand the difference between peer ministry and treatment, and identify trusted supports for the week ahead.",
    scriptureReferences: ["Psalm 34:18", "Galatians 6:2"],
    status: "completed",
    progress: "completed",
  },
  {
    id: "recovery-week-2",
    week: 2,
    title: "Hope beyond isolation",
    summary:
      "Explore how hope grows through truth, community, spiritual practice, and appropriate professional support rather than secrecy or willpower alone.",
    scriptureReferences: ["Romans 5:3–5", "Ecclesiastes 4:9–10"],
    status: "completed",
    progress: "completed",
  },
  {
    id: "recovery-week-3",
    week: 3,
    title: "Surrender and the next right step",
    summary:
      "Name what cannot be controlled, identify one responsible action, and practice asking God and safe people for help.",
    scriptureReferences: ["Proverbs 3:5–6", "Matthew 11:28–30"],
    status: "published",
    progress: "in_progress",
    scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60_000).toISOString(),
    leaderAgenda:
      "Opening and confidentiality reminder; Scripture and teaching; discussion prompts; responsible next-step plan; resource reminder; close in prayer.",
    safetyNotes:
      "Review the emergency boundary and current treatment referral resources before the group begins.",
  },
  {
    id: "recovery-week-4",
    week: 4,
    title: "Honest inventory without shame",
    summary:
      "Prepare for a careful, supported examination of patterns, consequences, strengths, risks, and relationships. Private details belong in approved leader or professional settings—not the group feed.",
    scriptureReferences: ["Psalm 139:23–24", "1 John 1:9"],
    status: "published",
    progress: "not_started",
  },
  {
    id: "recovery-week-5",
    week: 5,
    title: "Repair, boundaries, and accountability",
    summary:
      "Consider repair that is safe and appropriate, establish boundaries, and build an accountability plan that respects legal, clinical, and safeguarding limits.",
    scriptureReferences: ["Romans 12:18", "Ephesians 4:25"],
    status: "published",
    progress: "not_started",
  },
  {
    id: "recovery-week-6",
    week: 6,
    title: "Daily practices and relapse-response planning",
    summary:
      "Build a practical plan for spiritual rhythms, peer contact, treatment adherence where applicable, triggers, warning signs, and what to do after a setback.",
    scriptureReferences: ["Lamentations 3:22–23", "1 Corinthians 10:13"],
    status: "published",
    progress: "not_started",
  },
  {
    id: "recovery-week-7",
    week: 7,
    title: "Relationships, forgiveness, and wise limits",
    summary:
      "Explore forgiveness without removing necessary boundaries or bypassing consequences, safety planning, treatment, or legal responsibility.",
    scriptureReferences: ["Colossians 3:12–14", "Proverbs 4:23"],
    status: "published",
    progress: "not_started",
  },
  {
    id: "recovery-week-8",
    week: 8,
    title: "Service without rescuing",
    summary:
      "Use recovery experience to encourage others while respecting scope, confidentiality, leader oversight, and the difference between peer support and clinical care.",
    scriptureReferences: ["2 Corinthians 1:3–4", "1 Peter 4:10"],
    status: "published",
    progress: "not_started",
  },
];

const previewPosts: RecoveryPost[] = [
  {
    id: "recovery-post-1",
    type: "announcement",
    title: "Sunday group begins at 8:30 AM",
    body: "Please arrive through the approved entrance. The meeting ends with enough time to transition to worship. Exact room directions remain available to approved participants.",
    authorName: "Recovery Ministry Leader",
    createdAt: new Date(Date.now() - 20 * 60_000).toISOString(),
    leaderOnly: false,
    comments: [],
  },
  {
    id: "recovery-post-2",
    type: "encouragement",
    title: "One responsible next step",
    body: "This week, focus on one safe next action rather than trying to solve everything at once. Reach out to your approved support person before isolation grows.",
    authorName: "Peer Support Leader",
    createdAt: new Date(Date.now() - 6 * 60 * 60_000).toISOString(),
    leaderOnly: false,
    comments: [
      {
        id: "recovery-comment-1",
        authorName: "Participant A",
        body: "Thank you. I wrote down my two people to call this week.",
        createdAt: new Date(Date.now() - 4 * 60 * 60_000).toISOString(),
      },
    ],
  },
];

const storageKey = "church-hub-recovery-showcase-v2";

export function RecoveryMinistry({
  mode,
  canLead,
  programName,
  officialProgramConfirmed,
  programId,
}: {
  mode: "showcase" | "live";
  canLead: boolean;
  programName: string;
  officialProgramConfirmed: boolean;
  programId?: string;
}) {
  const [activeTab, setActiveTab] = useState<
    "week" | "journey" | "group" | "resources" | "leader"
  >("week");
  const [sessions, setSessions] = useState<RecoverySession[]>(previewSessions);
  const [posts, setPosts] = useState<RecoveryPost[]>(previewPosts);
  const [membershipRole, setMembershipRole] = useState<RecoveryRole | null>(
    canLead ? "leader" : "participant",
  );
  const [programDetails, setProgramDetails] = useState(defaultProgramDetails);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(mode === "live");
  const [guideQuestion, setGuideQuestion] = useState("");

  useEffect(() => {
    if (mode === "showcase") {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        try {
          const payload = JSON.parse(stored) as Pick<
            RecoveryPayload,
            "sessions" | "posts" | "membershipRole"
          > & { programDetails?: typeof defaultProgramDetails };
          if (Array.isArray(payload.sessions)) setSessions(payload.sessions);
          if (Array.isArray(payload.posts)) setPosts(payload.posts);
          if (payload.membershipRole) setMembershipRole(payload.membershipRole);
          if (payload.programDetails) setProgramDetails(payload.programDetails);
        } catch {
          window.localStorage.removeItem(storageKey);
        }
      }
      return;
    }
    void refreshLive();
  }, [mode, programId]);

  useEffect(() => {
    if (mode !== "showcase") return;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ sessions, posts, membershipRole, programDetails }),
    );
  }, [membershipRole, mode, posts, programDetails, sessions]);

  async function refreshLive() {
    setLoading(true);
    try {
      const query = programId ? `?programId=${encodeURIComponent(programId)}` : "";
      const response = await fetch(`/api/recovery${query}`, { cache: "no-store" });
      const payload = (await response.json()) as RecoveryPayload & { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Unable to load Recovery Ministry.");
      setSessions(payload.sessions ?? []);
      setPosts(payload.posts ?? []);
      setMembershipRole(payload.membershipRole ?? null);
      if (payload.program) {
        setProgramDetails({
          meetingDay: payload.program.meetingDay ?? "Meeting",
          meetingTime: payload.program.meetingTime ?? "",
          generalLocation:
            payload.program.generalLocation ??
            "Approved participants receive exact room directions privately.",
        });
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load Recovery Ministry.");
    } finally {
      setLoading(false);
    }
  }

  async function sendLive(action: string, payload: Record<string, unknown>) {
    const response = await fetch("/api/recovery", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, programId, ...payload }),
    });
    const result = (await response.json()) as { message?: string };
    if (!response.ok) throw new Error(result.message ?? "The recovery-ministry action failed.");
    await refreshLive();
  }

  const currentSession = useMemo(
    () =>
      sessions.find(
        (session) => session.status === "published" && session.progress !== "completed",
      ) ??
      sessions[0] ??
      null,
    [sessions],
  );
  const completion = sessions.length
    ? Math.round(
        (sessions.filter((session) => session.progress === "completed").length /
          sessions.length) *
          100,
      )
    : 0;

  function guide() {
    const question = guideQuestion.toLowerCase();
    if (/lesson|week|curriculum|scripture|step|journey/.test(question)) {
      setActiveTab("journey");
      setNotice("Opened the weekly journey and approved resource links.");
    } else if (/talk|group|message|connect|encouragement|people/.test(question)) {
      setActiveTab("group");
      setNotice("Opened the private participant group.");
    } else if (/treatment|doctor|detox|medication|crisis|help now|professional/.test(question)) {
      setActiveTab("resources");
      setNotice(
        "Opened professional and public treatment resources. Church peer support is not a substitute for medical or clinical care.",
      );
    } else if (/lead|agenda|teach|session|facilitate/.test(question) && canLead) {
      setActiveTab("leader");
      setNotice("Opened the restricted leader planner.");
    } else {
      setActiveTab("week");
      setNotice("Opened this week’s approved next steps.");
    }
  }

  async function setProgress(session: RecoverySession, progress: ProgressStatus) {
    try {
      if (mode === "showcase") {
        setSessions((current) =>
          current.map((row) => (row.id === session.id ? { ...row, progress } : row)),
        );
      } else {
        await sendLive("set_progress", { sessionId: session.id, progressStatus: progress });
      }
      setNotice("Your private journey progress was updated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Progress could not be updated.");
    }
  }

  async function createPost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const post: RecoveryPost = {
      id: crypto.randomUUID(),
      type: String(data.get("type")) as RecoveryPost["type"],
      title: String(data.get("title") ?? "").trim(),
      body: String(data.get("body") ?? "").trim(),
      authorName: canLead ? "You · Leader" : "You",
      createdAt: new Date().toISOString(),
      leaderOnly: data.get("leaderOnly") === "on",
      comments: [],
    };
    try {
      if (mode === "showcase") setPosts((current) => [post, ...current]);
      else await sendLive("create_post", post as unknown as Record<string, unknown>);
      event.currentTarget.reset();
      setNotice("The post was added to the approved recovery group.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The post could not be added.");
    }
  }

  async function comment(post: RecoveryPost) {
    const body = window
      .prompt("Write a brief group response. Do not post another person’s private recovery details:")
      ?.trim();
    if (!body) return;
    try {
      if (mode === "showcase") {
        setPosts((current) =>
          current.map((row) =>
            row.id === post.id
              ? {
                  ...row,
                  comments: [
                    ...row.comments,
                    {
                      id: crypto.randomUUID(),
                      authorName: "You",
                      body,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                }
              : row,
          ),
        );
      } else {
        await sendLive("comment", { postId: post.id, body });
      }
      setNotice("Your response was added to the private group.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The response could not be added.");
    }
  }

  async function createSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const session: RecoverySession = {
      id: crypto.randomUUID(),
      week: Number(data.get("week")),
      title: String(data.get("title") ?? "").trim(),
      summary: String(data.get("summary") ?? "").trim(),
      scriptureReferences: String(data.get("scriptureReferences") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      resourceUrl: String(data.get("resourceUrl") ?? "").trim() || undefined,
      scheduledFor: String(data.get("scheduledFor") ?? "") || undefined,
      leaderAgenda: String(data.get("leaderAgenda") ?? "").trim(),
      safetyNotes: String(data.get("safetyNotes") ?? "").trim() || undefined,
      status: "published",
      progress: "not_started",
    };
    try {
      if (mode === "showcase") {
        setSessions((current) => [...current, session].sort((a, b) => a.week - b.week));
      } else {
        await sendLive("create_session", session as unknown as Record<string, unknown>);
      }
      event.currentTarget.reset();
      setNotice(
        "The participant guide and restricted facilitator agenda were published together.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The session could not be created.");
    }
  }

  function resetShowcase() {
    setSessions(previewSessions);
    setPosts(previewPosts);
    setMembershipRole(canLead ? "leader" : "participant");
    setProgramDetails(defaultProgramDetails);
    window.localStorage.removeItem(storageKey);
    setNotice("Recovery Ministry showcase restored.");
  }

  if (!membershipRole && mode === "live") {
    return (
      <section className="module-empty-state">
        <h2>Recovery Ministry access is private and opt-in.</h2>
        <p>
          An approved leader must confirm the group, privacy agreement, age policy, and membership
          before participant resources or discussions become visible.
        </p>
      </section>
    );
  }

  return (
    <div className="ministry-module recovery-module">
      <section className="module-hero module-hero--recovery">
        <div>
          <p className="module-kicker">Private peer ministry · adult participants</p>
          <h2>{programName}</h2>
          <p>
            Follow the weekly ministry path, open approved Scripture and curriculum resources,
            connect with the private group, and help leaders prepare a consistent Sunday gathering.
          </p>
        </div>
        <div
          className="recovery-progress-ring"
          style={{ "--progress": completion } as CSSProperties}
        >
          <strong>{completion}%</strong>
          <span>journey complete</span>
        </div>
      </section>

      {!officialProgramConfirmed ? (
        <section className="curriculum-boundary">
          <strong>Recovery Ministry configuration</strong>
          <span>
            The app does not claim official Celebrate Recovery affiliation or reproduce its licensed
            curriculum until church leadership confirms the program relationship and copyright
            permissions.
          </span>
        </section>
      ) : null}

      <section className="module-guide">
        <div>
          <strong>✦ Recovery Guide</strong>
          <span>
            Find this week’s lesson, the private group, leader tools, or professional resources.
          </span>
        </div>
        <div>
          <input
            value={guideQuestion}
            onChange={(event) => setGuideQuestion(event.target.value)}
            placeholder="Example: Where can I find this week’s Scripture and meeting plan?"
          />
          <button type="button" onClick={guide}>
            Guide me
          </button>
        </div>
      </section>

      <nav className="module-tabs" aria-label="Recovery Ministry sections">
        {([
          ["week", "This week"],
          ["journey", "Weekly journey"],
          ["group", "Private group"],
          ["resources", "Get support"],
          ["leader", "Leader tools"],
        ] as const)
          .filter(([value]) => value !== "leader" || canLead)
          .map(([value, label]) => (
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
      {loading ? <p className="module-empty">Loading the private ministry workspace…</p> : null}

      {!loading && activeTab === "week" ? (
        <section className="recovery-week-layout">
          <article className="recovery-current-card">
            <span>Week {currentSession?.week ?? "—"}</span>
            <h3>{currentSession?.title ?? "No published session"}</h3>
            <p>
              {currentSession?.summary ??
                "A leader has not published this week’s participant guide."}
            </p>
            {currentSession?.scriptureReferences.length ? (
              <div className="tag-row">
                {currentSession.scriptureReferences.map((reference) => (
                  <span key={reference}>{reference}</span>
                ))}
              </div>
            ) : null}
            {currentSession?.resourceUrl ? (
              <a href={currentSession.resourceUrl} target="_blank" rel="noreferrer">
                Open approved curriculum resource ↗
              </a>
            ) : null}
            {currentSession ? (
              <div className="recovery-actions">
                <button
                  type="button"
                  onClick={() => void setProgress(currentSession, "in_progress")}
                >
                  Start this week
                </button>
                <button
                  type="button"
                  className="success"
                  onClick={() => void setProgress(currentSession, "completed")}
                >
                  Mark complete
                </button>
              </div>
            ) : null}
          </article>
          <aside className="recovery-meeting-card">
            <p>{programDetails.meetingDay} gathering</p>
            <h3>{formatRecoveryTime(programDetails.meetingTime)}</h3>
            <span>{programDetails.generalLocation}</span>
            <ul>
              <li>Welcome and safety reminder</li>
              <li>Approved teaching or testimony</li>
              <li>Small-group discussion</li>
              <li>Next-step and support plan</li>
            </ul>
          </aside>
        </section>
      ) : null}

      {!loading && activeTab === "journey" ? (
        <section className="module-workspace">
          <div className="section-heading">
            <div>
              <p>Participant-controlled progress</p>
              <h3>Weekly recovery ministry path</h3>
            </div>
          </div>
          <div className="recovery-journey-list">
            {sessions.map((session) => (
              <article
                key={session.id}
                className={`recovery-session recovery-session--${session.progress}`}
              >
                <span>{session.progress === "completed" ? "✓" : session.week}</span>
                <div>
                  <strong>{session.title}</strong>
                  <p>{session.summary}</p>
                  <small>{session.scriptureReferences.join(" · ")}</small>
                </div>
                <select
                  value={session.progress}
                  onChange={(event) =>
                    void setProgress(session, event.target.value as ProgressStatus)
                  }
                  aria-label={`Progress for ${session.title}`}
                >
                  <option value="not_started">Not started</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="skipped">Skip for now</option>
                </select>
              </article>
            ))}
          </div>
          <p className="module-boundary">
            The Hub records only the progress status you choose. It does not require a sobriety date,
            diagnosis, substance history, relapse narrative, medication record, treatment history,
            legal history, or private journal entry.
          </p>
        </section>
      ) : null}

      {!loading && activeTab === "group" ? (
        <section className="recovery-group-layout">
          <div className="recovery-posts">
            {posts
              .filter((post) => !post.leaderOnly || canLead)
              .map((post) => (
                <article key={post.id}>
                  <header>
                    <span>{post.type.replaceAll("_", " ")}</span>
                    <small>
                      {post.authorName} · {new Date(post.createdAt).toLocaleString()}
                    </small>
                  </header>
                  <h3>{post.title}</h3>
                  <p>{post.body}</p>
                  <div className="recovery-comments">
                    {post.comments.map((entry) => (
                      <p key={entry.id}>
                        <strong>{entry.authorName}</strong>
                        {entry.body}
                        <small>{new Date(entry.createdAt).toLocaleString()}</small>
                      </p>
                    ))}
                  </div>
                  <button type="button" onClick={() => void comment(post)}>
                    Respond in group
                  </button>
                </article>
              ))}
          </div>
          <form
            className="module-form recovery-post-form"
            onSubmit={(event) => void createPost(event)}
          >
            <h3>Share with the group</h3>
            <label>
              Type
              <select name="type" defaultValue="encouragement">
                <option value="encouragement">Encouragement</option>
                <option value="discussion">Discussion</option>
                <option value="resource">Resource</option>
                {canLead ? <option value="announcement">Announcement</option> : null}
                {canLead ? <option value="meeting_update">Meeting update</option> : null}
              </select>
            </label>
            <label>
              Title
              <input name="title" required maxLength={180} />
            </label>
            <label>
              Message
              <textarea name="body" rows={5} required maxLength={5000} />
            </label>
            {canLead ? (
              <label className="check-label">
                <input name="leaderOnly" type="checkbox" /> Leader-only planning note
              </label>
            ) : null}
            <button type="submit">Post privately</button>
            <small>
              Do not post another person’s name, treatment history, medication, legal matter, or
              confidential share.
            </small>
          </form>
        </section>
      ) : null}

      {!loading && activeTab === "resources" ? (
        <section className="module-workspace recovery-resources">
          <div className="section-heading">
            <div>
              <p>Peer ministry plus appropriate care</p>
              <h3>Recovery and treatment resources</h3>
            </div>
          </div>
          <div className="resource-card-grid">
            <a
              href="https://www.samhsa.gov/substance-use/treatment/find-treatment"
              target="_blank"
              rel="noreferrer"
            >
              <strong>SAMHSA treatment resources</strong>
              <span>Find licensed treatment and national referral options.</span>
              <b>Open official resource ↗</b>
            </a>
            <a
              href="https://www.mass.gov/info-details/resources-for-substance-use-disorder-treatment-recovery-services"
              target="_blank"
              rel="noreferrer"
            >
              <strong>Massachusetts treatment and recovery resources</strong>
              <span>State resources for treatment, recovery support, and families.</span>
              <b>Open Mass.gov ↗</b>
            </a>
            <a href="https://celebraterecovery.com/find-help-2/" target="_blank" rel="noreferrer">
              <strong>Celebrate Recovery group and online help</strong>
              <span>Official group finder and approved online resources.</span>
              <b>Open official site ↗</b>
            </a>
            <a href="https://findtreatment.gov" target="_blank" rel="noreferrer">
              <strong>FindTreatment.gov</strong>
              <span>Search for licensed mental health and substance-use treatment.</span>
              <b>Search providers ↗</b>
            </a>
          </div>
          <p className="module-boundary">
            This church ministry offers spiritual community and peer support. It does not diagnose,
            detox, prescribe medication, replace treatment, or promise recovery outcomes.
          </p>
        </section>
      ) : null}

      {!loading && activeTab === "leader" && canLead ? (
        <section className="recovery-leader-layout">
          <form className="module-form" onSubmit={(event) => void createSession(event)}>
            <h3>Publish a weekly participant guide</h3>
            <label>
              Week
              <input name="week" type="number" min={1} max={260} required />
            </label>
            <label>
              Title
              <input name="title" required maxLength={180} />
            </label>
            <label className="span-2">
              Participant summary
              <textarea
                name="summary"
                rows={5}
                required
                minLength={20}
                maxLength={3000}
              />
            </label>
            <label>
              Scripture references
              <input name="scriptureReferences" placeholder="Psalm 34:18, Galatians 6:2" />
            </label>
            <label>
              Licensed resource URL
              <input
                name="resourceUrl"
                type="url"
                placeholder="https://approved-provider.example/resource"
              />
            </label>
            <label>
              Scheduled date/time
              <input name="scheduledFor" type="datetime-local" />
            </label>
            <label className="span-2">
              Facilitator agenda
              <textarea
                name="leaderAgenda"
                rows={8}
                required
                minLength={10}
                maxLength={10000}
                placeholder="Welcome, confidentiality reminder, teaching flow, discussion prompts, next-step plan, and close."
              />
            </label>
            <label className="span-2">
              Safety and referral notes
              <textarea
                name="safetyNotes"
                rows={5}
                maxLength={5000}
                placeholder="Current emergency boundary, treatment-resource reminders, and issues requiring a private leader follow-up."
              />
            </label>
            <button type="submit">Publish participant guide and leader agenda</button>
          </form>
          <div className="leader-session-plans">
            <h3>Published facilitator plans</h3>
            {sessions
              .filter((session) => session.leaderAgenda)
              .map((session) => (
                <article key={session.id}>
                  <span>Week {session.week}</span>
                  <strong>{session.title}</strong>
                  <p>{session.leaderAgenda}</p>
                  {session.safetyNotes ? <small>{session.safetyNotes}</small> : null}
                </article>
              ))}
          </div>
          <aside className="leader-checklist">
            <h3>Leader release checklist</h3>
            <label>
              <input type="checkbox" /> Approved curriculum or original church content
            </label>
            <label>
              <input type="checkbox" /> Copyright and program-name permission verified
            </label>
            <label>
              <input type="checkbox" /> Crisis and treatment referral resources current
            </label>
            <label>
              <input type="checkbox" /> Confidentiality reminder prepared
            </label>
            <label>
              <input type="checkbox" /> No participant testimony published without written consent
            </label>
            <label>
              <input type="checkbox" /> No private group data sent to Outreach or advertising systems
            </label>
          </aside>
          {mode === "showcase" ? (
            <button type="button" className="module-secondary" onClick={resetShowcase}>
              Reset showcase
            </button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function formatRecoveryTime(value: string): string {
  if (!value) return "Time shared by the leader";
  const [hourText, minuteText = "00"] = value.split(":");
  const hour = Number(hourText);
  if (!Number.isFinite(hour)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minuteText.slice(0, 2)} ${suffix}`;
}
