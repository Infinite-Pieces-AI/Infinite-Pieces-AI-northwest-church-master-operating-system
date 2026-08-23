"use client";

import { useEffect, useMemo, useState } from "react";

type RecoveryRole = "participant" | "peer_support" | "leader" | "admin";
type SessionStatus = "draft" | "published" | "completed" | "cancelled";
type ProgressStatus = "not_started" | "in_progress" | "completed" | "skipped";
type MembershipRequestStatus = "pending" | "approved" | "declined" | "withdrawn" | "expired";
type RecoveryTab = "week" | "journey" | "group" | "resources" | "access" | "leader";

interface RecoveryProgram {
  id: string;
  displayName: string;
  publicSummary: string;
  meetingDay?: string;
  meetingTime?: string;
  generalLocation?: string;
  programType: "custom" | "celebrate_recovery";
  officialProgramConfirmation: boolean;
  status?: string;
}

interface RequestableProgram {
  id: string;
  displayName: string;
  publicSummary: string;
  programType: string;
  officialProgramConfirmation: boolean;
}

interface RecoveryMembershipRequest {
  id: string;
  programId: string;
  requestedRole: "participant" | "peer_support";
  displayMode: "first_name" | "initials" | "private";
  status: MembershipRequestStatus;
  reason?: string;
  reviewNote?: string;
  createdAt: string;
  reviewedAt?: string;
  expiresAt: string;
}

interface PendingRecoveryMembershipRequest {
  id: string;
  programId: string;
  profileId: string;
  displayName: string;
  email?: string;
  requestedRole: "participant" | "peer_support";
  displayMode: "first_name" | "initials" | "private";
  reason?: string;
  createdAt: string;
  expiresAt: string;
}

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
  program: RecoveryProgram | null;
  membershipRole: RecoveryRole | null;
  sessions: RecoverySession[];
  posts: RecoveryPost[];
  requestablePrograms: RequestableProgram[];
  membershipRequests: RecoveryMembershipRequest[];
  pendingMembershipRequests: PendingRecoveryMembershipRequest[];
}

const previewProgram: RecoveryProgram = {
  id: "recovery-program-preview",
  displayName: "Recovery Ministry",
  publicSummary:
    "A confidential adult church-based peer ministry offering Scripture, honest community, responsible next steps, and connections to appropriate professional care.",
  meetingDay: "Sunday",
  meetingTime: "8:30 AM",
  generalLocation: "Approved participants receive room details privately",
  programType: "custom",
  officialProgramConfirmation: false,
  status: "active",
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
    title: "Surrender and the next responsible step",
    summary:
      "Name what cannot be controlled, identify one responsible action, and practice asking God and safe people for help.",
    scriptureReferences: ["Proverbs 3:5–6", "Matthew 11:28–30"],
    status: "published",
    progress: "in_progress",
    scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60_000).toISOString(),
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
    title: "Daily practices and setback-response planning",
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
    body: "This week, focus on one safe next action rather than trying to solve everything at once. Reach out to an approved support person before isolation grows.",
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

const previewPendingRequests: PendingRecoveryMembershipRequest[] = [
  {
    id: "recovery-request-preview-1",
    programId: previewProgram.id,
    profileId: "preview-member-1",
    displayName: "Taylor Member",
    email: "taylor@example.invalid",
    requestedRole: "participant",
    displayMode: "first_name",
    reason: "I would like a confidential faith community and weekly recovery support.",
    createdAt: new Date(Date.now() - 3 * 60 * 60_000).toISOString(),
    expiresAt: new Date(Date.now() + 27 * 24 * 60 * 60_000).toISOString(),
  },
];

const storageKey = "church-hub-recovery-showcase-v2";

export function RecoveryMinistry({
  mode,
  canLead,
  programName,
  officialProgramConfirmed,
}: {
  mode: "showcase" | "live";
  canLead: boolean;
  programName: string;
  officialProgramConfirmed: boolean;
}) {
  const previewRole: RecoveryRole = canLead ? "leader" : "participant";
  const [activeTab, setActiveTab] = useState<RecoveryTab>("week");
  const [program, setProgram] = useState<RecoveryProgram | null>(previewProgram);
  const [sessions, setSessions] = useState<RecoverySession[]>(previewSessions);
  const [posts, setPosts] = useState<RecoveryPost[]>(previewPosts);
  const [membershipRole, setMembershipRole] = useState<RecoveryRole | null>(previewRole);
  const [requestablePrograms, setRequestablePrograms] = useState<RequestableProgram[]>([
    previewProgram,
  ]);
  const [membershipRequests, setMembershipRequests] = useState<RecoveryMembershipRequest[]>([]);
  const [pendingMembershipRequests, setPendingMembershipRequests] = useState<
    PendingRecoveryMembershipRequest[]
  >(canLead ? previewPendingRequests : []);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(mode === "live");
  const [guideQuestion, setGuideQuestion] = useState("");
  const effectiveCanLead =
    canLead || membershipRole === "leader" || membershipRole === "admin";

  useEffect(() => {
    if (mode === "showcase") {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        try {
          const payload = JSON.parse(stored) as RecoveryPayload;
          setProgram(payload.program ?? previewProgram);
          setSessions(payload.sessions ?? previewSessions);
          setPosts(payload.posts ?? previewPosts);
          setMembershipRole(payload.membershipRole ?? previewRole);
          setRequestablePrograms(payload.requestablePrograms ?? [previewProgram]);
          setMembershipRequests(payload.membershipRequests ?? []);
          setPendingMembershipRequests(
            payload.pendingMembershipRequests ?? (canLead ? previewPendingRequests : []),
          );
        } catch {
          window.localStorage.removeItem(storageKey);
        }
      }
      return;
    }
    void refreshLive();
  }, [canLead, mode, previewRole]);

  useEffect(() => {
    if (mode !== "showcase") return;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        program,
        sessions,
        posts,
        membershipRole,
        requestablePrograms,
        membershipRequests,
        pendingMembershipRequests,
      } satisfies RecoveryPayload),
    );
  }, [
    membershipRequests,
    membershipRole,
    mode,
    pendingMembershipRequests,
    posts,
    program,
    requestablePrograms,
    sessions,
  ]);

  async function refreshLive() {
    setLoading(true);
    try {
      const response = await fetch("/api/recovery", { cache: "no-store" });
      const payload = (await response.json()) as RecoveryPayload & { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Unable to load Recovery Ministry.");
      setProgram(payload.program ?? null);
      setSessions(payload.sessions ?? []);
      setPosts(payload.posts ?? []);
      setMembershipRole(payload.membershipRole ?? null);
      setRequestablePrograms(payload.requestablePrograms ?? []);
      setMembershipRequests(payload.membershipRequests ?? []);
      setPendingMembershipRequests(payload.pendingMembershipRequests ?? []);
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
      body: JSON.stringify({ action, ...payload }),
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
  const pendingOwnRequest = membershipRequests.find((request) => request.status === "pending");

  function guide() {
    const question = guideQuestion.toLowerCase();
    if (/access|join|request|privacy|confidential/.test(question)) {
      setActiveTab("access");
      setNotice("Opened private access and confidentiality settings.");
    } else if (/lesson|week|curriculum|scripture|step|journey/.test(question)) {
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
    } else if (/lead|agenda|teach|session|facilitate|approve/.test(question) && effectiveCanLead) {
      setActiveTab("leader");
      setNotice("Opened the restricted leader planner and access review queue.");
    } else {
      setActiveTab("week");
      setNotice("Opened this week’s approved next steps.");
    }
  }

  async function requestMembership(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const programId = String(data.get("programId") ?? "");
    const request: RecoveryMembershipRequest = {
      id: crypto.randomUUID(),
      programId,
      requestedRole: String(data.get("requestedRole")) as RecoveryMembershipRequest["requestedRole"],
      displayMode: String(data.get("displayMode")) as RecoveryMembershipRequest["displayMode"],
      status: "pending",
      reason: String(data.get("reason") ?? "").trim() || undefined,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString(),
    };
    try {
      if (mode === "showcase") {
        setMembershipRequests((current) => [request, ...current]);
      } else {
        await sendLive("request_membership", {
          programId: request.programId,
          requestedRole: request.requestedRole,
          displayMode: request.displayMode,
          reason: request.reason,
        });
      }
      form.reset();
      setNotice(
        "Your private request was sent to an authorized recovery leader. It does not enroll you automatically.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The access request could not be sent.");
    }
  }

  async function withdrawRequest(request: RecoveryMembershipRequest) {
    try {
      if (mode === "showcase") {
        setMembershipRequests((current) =>
          current.map((row) =>
            row.id === request.id ? { ...row, status: "withdrawn" } : row,
          ),
        );
      } else {
        await sendLive("withdraw_membership_request", { requestId: request.id });
      }
      setNotice("Your pending access request was withdrawn.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The request could not be withdrawn.");
    }
  }

  async function reviewRequest(
    request: PendingRecoveryMembershipRequest,
    decision: "approved" | "declined",
  ) {
    const reviewNote = window
      .prompt(
        decision === "approved"
          ? "Optional private leader note for this approval:"
          : "Add a private reason or next step for the member:",
      )
      ?.trim();
    try {
      if (mode === "showcase") {
        setPendingMembershipRequests((current) =>
          current.filter((row) => row.id !== request.id),
        );
      } else {
        await sendLive("review_membership_request", {
          requestId: request.id,
          decision,
          reviewNote,
        });
      }
      setNotice(
        decision === "approved"
          ? "The member was granted private program access."
          : "The request was declined and remains outside the private program.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The access decision failed.");
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
    const form = event.currentTarget;
    const data = new FormData(form);
    const post: RecoveryPost = {
      id: crypto.randomUUID(),
      type: String(data.get("type")) as RecoveryPost["type"],
      title: String(data.get("title") ?? "").trim(),
      body: String(data.get("body") ?? "").trim(),
      authorName: effectiveCanLead ? "You · Leader" : "You",
      createdAt: new Date().toISOString(),
      leaderOnly: data.get("leaderOnly") === "on",
      comments: [],
    };
    try {
      if (mode === "showcase") {
        setPosts((current) => [post, ...current]);
      } else {
        await sendLive("create_post", post as unknown as Record<string, unknown>);
      }
      form.reset();
      setNotice("The post was added to the private recovery group.");
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
    const form = event.currentTarget;
    const data = new FormData(form);
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
      status: "published",
      progress: "not_started",
    };
    try {
      if (mode === "showcase") {
        setSessions((current) => [...current, session].sort((a, b) => a.week - b.week));
      } else {
        await sendLive("create_session", session as unknown as Record<string, unknown>);
      }
      form.reset();
      setNotice(
        "The participant guide was published. Licensed lesson text remains with the approved curriculum provider.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The session could not be created.");
    }
  }

  function resetShowcase() {
    setProgram(previewProgram);
    setSessions(previewSessions);
    setPosts(previewPosts);
    setMembershipRole(previewRole);
    setRequestablePrograms([previewProgram]);
    setMembershipRequests([]);
    setPendingMembershipRequests(canLead ? previewPendingRequests : []);
    window.localStorage.removeItem(storageKey);
    setNotice("Recovery Ministry showcase restored.");
  }

  if (loading) return <p className="module-empty">Loading the private ministry workspace…</p>;

  if (!membershipRole || !program) {
    return (
      <div className="ministry-module recovery-module">
        <section className="module-hero module-hero--recovery">
          <div>
            <p className="module-kicker">Private, voluntary, adult peer ministry</p>
            <h2>Request recovery-ministry access</h2>
            <p>
              The private journey, meeting logistics, group discussion, and participant list are
              visible only after an authorized leader reviews a voluntary request.
            </p>
          </div>
          <div className="module-hero__metric">
            <strong>{membershipRequests.filter((request) => request.status === "pending").length}</strong>
            <span>pending access requests</span>
          </div>
        </section>
        <section className="prayer-safety">
          <strong>This is church peer support—not detoxification, treatment, or emergency care.</strong>
          <span>
            Call 911 for immediate danger or overdose. In the United States, call or text 988 for
            crisis support. Use licensed treatment providers for medical and clinical care.
          </span>
        </section>
        {notice ? <p className="module-notice">{notice}</p> : null}
        <section className="recovery-access-grid">
          {requestablePrograms.map((availableProgram) => {
            const existing = membershipRequests.find(
              (request) =>
                request.programId === availableProgram.id && request.status === "pending",
            );
            return (
              <article className="recovery-access-card" key={availableProgram.id}>
                <span>Adult recovery peer ministry</span>
                <h3>{availableProgram.displayName}</h3>
                <p>{availableProgram.publicSummary}</p>
                {availableProgram.programType === "celebrate_recovery" &&
                availableProgram.officialProgramConfirmation ? (
                  <small>Official program configuration confirmed by church leadership.</small>
                ) : (
                  <small>
                    Church-created or independently licensed curriculum. No official Celebrate
                    Recovery affiliation is claimed.
                  </small>
                )}
                {existing ? (
                  <div className="recovery-request-status">
                    <strong>Leader review pending</strong>
                    <span>Submitted {new Date(existing.createdAt).toLocaleString()}</span>
                    <button type="button" onClick={() => void withdrawRequest(existing)}>
                      Withdraw request
                    </button>
                  </div>
                ) : (
                  <form className="module-form" onSubmit={(event) => void requestMembership(event)}>
                    <input type="hidden" name="programId" value={availableProgram.id} />
                    <label>
                      Requested role
                      <select name="requestedRole" defaultValue="participant">
                        <option value="participant">Participant</option>
                        <option value="peer_support">Peer-support volunteer</option>
                      </select>
                    </label>
                    <label>
                      Group display
                      <select name="displayMode" defaultValue="first_name">
                        <option value="first_name">First name</option>
                        <option value="initials">Initials</option>
                        <option value="private">Private in participant lists</option>
                      </select>
                    </label>
                    <label className="span-2">
                      Optional note to authorized leaders
                      <textarea
                        name="reason"
                        rows={4}
                        maxLength={2000}
                        placeholder="Share only what leaders need to understand your request. Do not enter medical records or another person’s private information."
                      />
                    </label>
                    <label className="check-label span-2">
                      <input type="checkbox" required /> I understand this is a confidential adult
                      peer-ministry request and does not replace professional treatment.
                    </label>
                    <button type="submit">Request private access</button>
                  </form>
                )}
              </article>
            );
          })}
          {!requestablePrograms.length ? (
            <section className="module-empty-state">
              <h3>No recovery ministry is currently accepting access requests.</h3>
              <p>Use the public recovery-support page for official resources or a private inquiry.</p>
              <a href="/recovery-support-lowell">Open recovery-support information</a>
            </section>
          ) : null}
        </section>
      </div>
    );
  }

  const confirmed = program.officialProgramConfirmation || officialProgramConfirmed;
  const tabs: Array<[RecoveryTab, string]> = [
    ["week", "This week"],
    ["journey", "Weekly journey"],
    ["group", "Private group"],
    ["resources", "Get support"],
    ["access", "Access & privacy"],
  ];
  if (effectiveCanLead) tabs.push(["leader", `Leader tools (${pendingMembershipRequests.length})`]);

  return (
    <div className="ministry-module recovery-module">
      <section className="module-hero module-hero--recovery">
        <div>
          <p className="module-kicker">Private peer ministry · approved adult participants</p>
          <h2>{program.displayName || programName}</h2>
          <p>{program.publicSummary}</p>
        </div>
        <div
          className="recovery-progress-ring"
          style={{ "--progress": completion } as React.CSSProperties}
        >
          <strong>{completion}%</strong>
          <span>journey complete</span>
        </div>
      </section>

      {!confirmed ? (
        <section className="curriculum-boundary">
          <strong>Recovery Ministry configuration</strong>
          <span>
            The app does not claim official Celebrate Recovery affiliation or reproduce its licensed
            curriculum until church leadership confirms the program relationship and permissions.
          </span>
        </section>
      ) : null}

      <section className="module-guide">
        <div>
          <strong>✦ Recovery Guide</strong>
          <span>
            Find this week’s lesson, the private group, access settings, leader tools, or professional
            resources.
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

      {activeTab === "week" ? (
        <section className="recovery-week-layout">
          <article className="recovery-current-card">
            <span>Week {currentSession?.week ?? "—"}</span>
            <h3>{currentSession?.title ?? "No published session"}</h3>
            <p>
              {currentSession?.summary ?? "A leader has not published this week’s participant guide."}
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
            <p>Private gathering</p>
            <h3>
              {program.meetingDay ?? "Approved day"} · {program.meetingTime ?? "Time shared privately"}
            </h3>
            <span>{program.generalLocation ?? "Approved participants receive room directions privately."}</span>
            <ul>
              <li>Welcome and confidentiality reminder</li>
              <li>Approved teaching or testimony</li>
              <li>Small-group discussion</li>
              <li>Next-step and support plan</li>
            </ul>
          </aside>
        </section>
      ) : null}

      {activeTab === "journey" ? (
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
            diagnosis, substance history, setback narrative, medication record, or private journal.
          </p>
        </section>
      ) : null}

      {activeTab === "group" ? (
        <section className="recovery-group-layout">
          <div className="recovery-posts">
            {posts.map((post) => (
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
          <form className="module-form recovery-post-form" onSubmit={(event) => void createPost(event)}>
            <h3>Share with the group</h3>
            <label>
              Type
              <select name="type" defaultValue="encouragement">
                <option value="encouragement">Encouragement</option>
                <option value="discussion">Discussion</option>
                <option value="resource">Resource</option>
                {effectiveCanLead ? <option value="announcement">Announcement</option> : null}
                {effectiveCanLead ? <option value="meeting_update">Meeting update</option> : null}
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
            {effectiveCanLead ? (
              <label className="check-label">
                <input name="leaderOnly" type="checkbox" /> Leader-only planning note
              </label>
            ) : null}
            <button type="submit">Post privately</button>
            <small>
              Do not post another person’s identity, treatment history, medication, legal matter, or
              confidential share.
            </small>
          </form>
        </section>
      ) : null}

      {activeTab === "resources" ? (
        <section className="module-workspace recovery-resources">
          <div className="section-heading">
            <div>
              <p>Peer ministry plus appropriate care</p>
              <h3>Recovery and treatment resources</h3>
            </div>
          </div>
          <div className="resource-card-grid">
            <a
              href="https://www.samhsa.gov/find-help/helplines/national-helpline"
              target="_blank"
              rel="noreferrer"
            >
              <strong>SAMHSA National Helpline</strong>
              <span>Official information and treatment referral resources.</span>
              <b>Open official resource ↗</b>
            </a>
            <a href="https://findtreatment.gov" target="_blank" rel="noreferrer">
              <strong>FindTreatment.gov</strong>
              <span>Search for licensed mental-health and substance-use treatment.</span>
              <b>Search providers ↗</b>
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
            <a
              href="https://celebraterecovery.com/find-help-2/"
              target="_blank"
              rel="noreferrer"
            >
              <strong>Celebrate Recovery official group finder</strong>
              <span>Official group-finder and online-resource information.</span>
              <b>Open official site ↗</b>
            </a>
          </div>
          <p className="module-boundary">
            This church ministry offers spiritual community and peer support. It does not diagnose,
            detox, prescribe medication, replace treatment, or promise recovery outcomes.
          </p>
        </section>
      ) : null}

      {activeTab === "access" ? (
        <section className="module-workspace recovery-access-settings">
          <div className="section-heading">
            <div>
              <p>Confidentiality and access</p>
              <h3>Your private ministry access</h3>
            </div>
          </div>
          <dl>
            <div>
              <dt>Current role</dt>
              <dd>{membershipRole.replaceAll("_", " ")}</dd>
            </div>
            <div>
              <dt>Program</dt>
              <dd>{program.displayName}</dd>
            </div>
            <div>
              <dt>Participant directory</dt>
              <dd>Visible only inside the approved program and according to each member’s display setting.</dd>
            </div>
            <div>
              <dt>Outreach and advertising</dt>
              <dd>Recovery membership, posts, progress, and private discussion are excluded.</dd>
            </div>
            <div>
              <dt>AI use</dt>
              <dd>Private recovery content is unavailable to AI unless a separate approved policy explicitly permits a narrowly defined function.</dd>
            </div>
          </dl>
          <p className="module-boundary">
            Ask an authorized leader to change your display preference, end access, or address a
            privacy concern. Leaving the group must revoke private-program access promptly.
          </p>
        </section>
      ) : null}

      {activeTab === "leader" && effectiveCanLead ? (
        <section className="recovery-leader-stack">
          <div className="recovery-leader-layout">
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
                <textarea name="summary" rows={5} required minLength={20} maxLength={3000} />
              </label>
              <label>
                Scripture references
                <input name="scriptureReferences" placeholder="Psalm 34:18, Galatians 6:2" />
              </label>
              <label>
                Licensed resource URL
                <input name="resourceUrl" type="url" placeholder="https://approved-provider.example/resource" />
              </label>
              <label>
                Scheduled date/time
                <input name="scheduledFor" type="datetime-local" />
              </label>
              <button type="submit">Publish participant guide</button>
            </form>
            <aside className="leader-checklist">
              <h3>Leader release checklist</h3>
              <label><input type="checkbox" /> Approved curriculum or original church content</label>
              <label><input type="checkbox" /> Copyright and program-name permission verified</label>
              <label><input type="checkbox" /> Crisis and treatment referral resources current</label>
              <label><input type="checkbox" /> Confidentiality reminder prepared</label>
              <label><input type="checkbox" /> No testimony published without written consent</label>
              <label><input type="checkbox" /> No private data sent to Outreach or advertising</label>
            </aside>
          </div>

          <section className="module-workspace recovery-access-review">
            <div className="section-heading">
              <div>
                <p>Leader-reviewed admission</p>
                <h3>Pending recovery access requests</h3>
              </div>
            </div>
            <div className="recovery-request-list">
              {pendingMembershipRequests.map((request) => (
                <article key={request.id}>
                  <div>
                    <strong>{request.displayName}</strong>
                    <span>
                      {request.requestedRole.replaceAll("_", " ")} · display: {request.displayMode.replaceAll("_", " ")}
                    </span>
                    {request.reason ? <p>{request.reason}</p> : null}
                    <small>Requested {new Date(request.createdAt).toLocaleString()}</small>
                  </div>
                  <div>
                    <button type="button" onClick={() => void reviewRequest(request, "approved")}>
                      Approve access
                    </button>
                    <button type="button" onClick={() => void reviewRequest(request, "declined")}>
                      Decline
                    </button>
                  </div>
                </article>
              ))}
              {!pendingMembershipRequests.length ? (
                <p className="module-empty">No access requests are waiting for review.</p>
              ) : null}
            </div>
          </section>
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
