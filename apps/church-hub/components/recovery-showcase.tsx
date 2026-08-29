"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useShowcaseStore } from "./use-showcase-store";

type RecoveryTab = "home" | "curriculum" | "group" | "leader" | "resources";

interface RecoveryWeek {
  number: number;
  title: string;
  theme: string;
  scriptures: string[];
  leaderFocus: string;
  reflection: string[];
  practice: string;
}

interface RecoveryPost {
  id: string;
  type: "announcement" | "encouragement" | "reflection" | "resource" | "question";
  label: string;
  body: string;
  createdAt: string;
}

interface RecoveryState {
  currentWeek: number;
  joined: boolean;
  attendance: Record<number, "registered" | "present" | "excused">;
  journal: Record<number, string>;
  posts: RecoveryPost[];
  leaderChecklist: Record<string, boolean>;
  confidentialFollowupRequested: boolean;
}

const weeks: RecoveryWeek[] = [
  {
    number: 1,
    title: "Welcome, safety, and hope",
    theme: "A recovery community begins with honesty, dignity, confidentiality, and hope.",
    scriptures: ["Psalm 34:17–18", "Matthew 11:28–30", "Romans 15:13"],
    leaderFocus:
      "Establish group agreements, explain confidentiality limits, describe emergency and safeguarding pathways, and invite participation without pressure.",
    reflection: [
      "What would make this group feel safe enough for honest participation?",
      "What kind of support are you willing to receive this week?",
      "Where do you notice even a small reason for hope?",
    ],
    practice: "Identify one safe person or approved resource you can contact before the next meeting.",
  },
  {
    number: 2,
    title: "Honesty and supportive connection",
    theme: "Change grows when secrecy loses power and support becomes consistent.",
    scriptures: ["James 5:16", "Ecclesiastes 4:9–10", "Galatians 6:2"],
    leaderFocus:
      "Model non-shaming language, distinguish peer support from clinical treatment, and help members build a practical support plan.",
    reflection: [
      "What makes it difficult to ask for support?",
      "Which situations increase risk or isolation?",
      "What is one honest sentence you can practice saying to a safe person?",
    ],
    practice: "Add two approved support contacts and one backup resource to a private plan.",
  },
  {
    number: 3,
    title: "Surrender and daily choices",
    theme: "Recovery is strengthened by repeated choices, spiritual dependence, and practical support.",
    scriptures: ["Proverbs 3:5–6", "Luke 9:23", "Philippians 2:13"],
    leaderFocus:
      "Keep the discussion practical and avoid implying that faith removes the need for treatment, medication, or professional care.",
    reflection: [
      "What do you need to stop trying to control alone?",
      "What daily decision would support recovery today?",
      "What spiritual practice helps you become more present and honest?",
    ],
    practice: "Choose one morning and one evening recovery-supporting routine.",
  },
  {
    number: 4,
    title: "Personal inventory without condemnation",
    theme: "Clear reflection can name patterns, harms, strengths, and needs without turning shame into identity.",
    scriptures: ["Psalm 139:23–24", "Romans 8:1", "Lamentations 3:40"],
    leaderFocus:
      "Offer structure for private reflection. Do not require public disclosure, trauma detail, or information that belongs with a licensed professional.",
    reflection: [
      "What patterns do you want to understand more clearly?",
      "Which strengths have helped you survive and seek change?",
      "What should remain private or be discussed with a professional?",
    ],
    practice: "Complete a private, limited inventory focused on patterns and next actions—not graphic detail.",
  },
  {
    number: 5,
    title: "Confession, grace, and accountability",
    theme: "Grace and accountability can exist together in truthful, safe relationships.",
    scriptures: ["1 John 1:9", "Psalm 32:5", "Ephesians 4:25"],
    leaderFocus:
      "Explain safe disclosure boundaries and mandatory-reporting limits. Never pressure members to confess publicly.",
    reflection: [
      "What is the difference between accountability and humiliation?",
      "Who has earned the right to hear more of your story?",
      "What concrete accountability would be useful this week?",
    ],
    practice: "Choose one specific accountability check-in with a safe, approved person.",
  },
  {
    number: 6,
    title: "Changing patterns and building supports",
    theme: "Recovery plans become stronger when triggers, environments, routines, and supports are addressed together.",
    scriptures: ["Romans 12:2", "2 Timothy 2:22", "1 Corinthians 10:13"],
    leaderFocus:
      "Use non-clinical planning language. Encourage professional relapse-prevention support when appropriate.",
    reflection: [
      "Which environments or routines need to change?",
      "What healthy replacement can be prepared before a difficult moment?",
      "What support should be contacted earlier next time?",
    ],
    practice: "Write a private if-then plan for one predictable high-risk situation.",
  },
  {
    number: 7,
    title: "Repairing harm wisely",
    theme: "Repair should be truthful, safe, appropriately timed, and never create additional harm.",
    scriptures: ["Matthew 5:23–24", "Romans 12:18", "Micah 6:8"],
    leaderFocus:
      "Do not direct members toward unsafe contact. Encourage consultation with treatment, legal, pastoral, or safeguarding professionals when needed.",
    reflection: [
      "What repair is mine to consider?",
      "What contact would be unsafe or unwise right now?",
      "How can changed behavior become part of repair?",
    ],
    practice: "Identify one safe repair action that does not require direct contact with another person.",
  },
  {
    number: 8,
    title: "Forgiveness, grief, and boundaries",
    theme: "Forgiveness is not denial, forced reconciliation, or permission for continued harm.",
    scriptures: ["Colossians 3:13", "Psalm 147:3", "Proverbs 4:23"],
    leaderFocus:
      "Protect members from pressure to reconcile with unsafe people. Normalize grief, boundaries, and professional support.",
    reflection: [
      "What are you grieving as recovery changes your life?",
      "Which boundary protects health and honesty?",
      "What does forgiveness not require of you?",
    ],
    practice: "Write one boundary and the support needed to maintain it.",
  },
  {
    number: 9,
    title: "Daily spiritual and recovery practices",
    theme: "Small repeated practices can support connection, honesty, and readiness to ask for help.",
    scriptures: ["Psalm 5:3", "John 15:4–5", "1 Thessalonians 5:16–18"],
    leaderFocus:
      "Help members create flexible practices rather than perfectionistic streaks or public performance scores.",
    reflection: [
      "Which practice is realistic on a difficult day?",
      "How can Scripture, prayer, meetings, and treatment supports work together?",
      "What is a compassionate way to restart after disruption?",
    ],
    practice: "Build a minimum daily plan that can still be used on a hard day.",
  },
  {
    number: 10,
    title: "Responding early to risk",
    theme: "A strong plan notices warning signs early and makes support easier to reach.",
    scriptures: ["Proverbs 27:12", "Hebrews 3:13", "Psalm 46:1"],
    leaderFocus:
      "Review crisis, overdose, treatment, and emergency pathways. Do not ask members to rely on the app or group as their only support.",
    reflection: [
      "What are your earliest warning signs?",
      "Who should be contacted before a crisis grows?",
      "What barriers make support harder to access?",
    ],
    practice: "Update a private support plan with warning signs, contacts, transportation, and emergency options.",
  },
  {
    number: 11,
    title: "Service without overextension",
    theme: "Healthy service can strengthen purpose when it is voluntary, boundaried, and appropriate to recovery.",
    scriptures: ["1 Peter 4:10", "Galatians 5:13", "Mark 10:45"],
    leaderFocus:
      "Avoid using service as proof of recovery or spiritual maturity. Match opportunities to capacity and safety.",
    reflection: [
      "What kind of service gives life rather than depleting you?",
      "What boundaries would keep service healthy?",
      "How can your experience support compassion without making you responsible for another person’s recovery?",
    ],
    practice: "Choose one small, optional act of service with a clear time boundary.",
  },
  {
    number: 12,
    title: "Continuing the journey",
    theme: "Recovery is supported by ongoing community, treatment when needed, spiritual practices, and honest planning.",
    scriptures: ["Philippians 1:6", "Hebrews 12:1–2", "Isaiah 40:31"],
    leaderFocus:
      "Review continuing-care options, group feedback, leadership boundaries, and how members can remain connected without becoming dependent on one ministry.",
    reflection: [
      "Which supports need to continue?",
      "What have you learned about asking for help?",
      "What is your next honest and realistic step?",
    ],
    practice: "Create a continuing-support plan for the next thirty days.",
  },
];

const initialState: RecoveryState = {
  currentWeek: 1,
  joined: true,
  attendance: { 1: "registered" },
  journal: {},
  posts: [
    {
      id: "recovery-announcement",
      type: "announcement",
      label: "Group leader",
      body:
        "This Sunday we will review the group agreements, discuss hope, and make sure everyone knows how to reach professional and crisis resources outside meeting hours.",
      createdAt: "Yesterday",
    },
    {
      id: "recovery-encouragement",
      type: "encouragement",
      label: "Group participant",
      body: "Grateful for a place where progress can be honest and nobody has to pretend.",
      createdAt: "Today",
    },
  ],
  leaderChecklist: {
    room: true,
    agreements: true,
    resources: true,
    attendance: false,
    followup: false,
  },
  confidentialFollowupRequested: false,
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function RecoveryShowcase({ canLead = true }: { canLead?: boolean }) {
  const [state, setState, reset, hydrated] = useShowcaseStore(
    "church-hub-recovery-showcase-v1",
    initialState,
  );
  const [tab, setTab] = useState<RecoveryTab>("home");
  const [selectedWeek, setSelectedWeek] = useState(state.currentWeek);
  const [guideQuestion, setGuideQuestion] = useState("");
  const [guideAnswer, setGuideAnswer] = useState<string | null>(null);
  const week = weeks.find((item) => item.number === selectedWeek) ?? weeks[0];
  const currentWeek = weeks.find((item) => item.number === state.currentWeek) ?? weeks[0];

  const completedWeeks = useMemo(
    () => Object.keys(state.journal).filter((key) => state.journal[Number(key)]?.trim()).length,
    [state.journal],
  );

  function askGuide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = guideQuestion.trim().toLowerCase();
    if (!query) return;
    if (/overdose|suicide|kill myself|immediate danger|can.?t stay safe|medical emergency/.test(query)) {
      setGuideAnswer(
        "This sounds urgent. The Church Hub is not emergency care. Call 911 for immediate danger, call or text 988 for crisis support in the United States, and use an approved medical or treatment resource now.",
      );
      return;
    }
    if (/leader|facilitat|lesson|curriculum|run the group/.test(query)) {
      setTab("leader");
      setGuideAnswer("I opened the Leader Console for meeting preparation, boundaries, and weekly facilitation.");
    } else if (/treatment|detox|professional|counsel|resource|help line/.test(query)) {
      setTab("resources");
      setGuideAnswer("I opened verified support resources. This ministry complements—not replaces—treatment and emergency care.");
    } else if (/talk|post|group|connect|encourag|question/.test(query)) {
      setTab("group");
      setGuideAnswer("I opened the private group connection area for participant discussion and leader announcements.");
    } else if (/week|lesson|scripture|read|study|step/.test(query)) {
      setTab("curriculum");
      setGuideAnswer("I opened the weekly curriculum and Scripture-reference path.");
    } else {
      setTab("home");
      setGuideAnswer("Start with the next meeting, current week, and support plan on the Recovery home screen.");
    }
  }

  function saveJournal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = String(form.get("journal") ?? "").trim();
    setState((current) => ({
      ...current,
      journal: { ...current.journal, [selectedWeek]: text },
    }));
  }

  function postToGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = String(form.get("body") ?? "").trim();
    if (!body) return;
    const type = String(form.get("type") ?? "encouragement") as RecoveryPost["type"];
    setState((current) => ({
      ...current,
      posts: [
        ...current.posts,
        { id: makeId("recovery-post"), type, label: "My post", body, createdAt: "Just now" },
      ],
    }));
    event.currentTarget.reset();
  }

  function toggleLeaderItem(key: string) {
    setState((current) => ({
      ...current,
      leaderChecklist: {
        ...current.leaderChecklist,
        [key]: !current.leaderChecklist[key],
      },
    }));
  }

  return (
    <div className="ministry-showcase recovery-showcase" aria-busy={!hydrated}>
      <section className="space-hero space-hero--recovery">
        <div>
          <p className="space-eyebrow">Christ-centered community for an ongoing recovery journey</p>
          <h2>Recovery Ministry</h2>
          <p>
            Follow the current weekly series, prepare for Sunday’s group, connect with approved
            participants, and reach professional or crisis resources when ministry support is not
            enough.
          </p>
          <div className="space-hero__actions">
            <button className="hub-button hub-button--light" type="button" onClick={() => setTab("curriculum")}>
              Continue week {state.currentWeek}
            </button>
            <button className="hub-button hub-button--ghost-light" type="button" onClick={() => setTab("resources")}>
              Find immediate resources
            </button>
          </div>
        </div>
        <div className="recovery-next-meeting">
          <small>Next group</small>
          <strong>Sunday · 8:30 AM</strong>
          <span>Before worship · approved room</span>
          <b>{state.joined ? "Joined" : "Request to join"}</b>
        </div>
      </section>

      <section className="recovery-safety-note">
        <strong>Peer and spiritual support—not detox, treatment, medical care, or emergency response.</strong>
        <span>
          Call 911 for immediate danger or suspected overdose. In the United States, call or text
          988 for crisis support. Use verified treatment resources for clinical assessment and care.
        </span>
      </section>

      <section className="recovery-guide">
        <div><span aria-hidden="true">✦</span><div><strong>Recovery Guide</strong><small>Navigation and resource guidance—not diagnosis or counseling</small></div></div>
        <form onSubmit={askGuide}>
          <input value={guideQuestion} onChange={(event) => setGuideQuestion(event.target.value)} placeholder="Ask where to find this week’s lesson, group support, leader tools, or resources…" />
          <button className="hub-button hub-button--primary" type="submit">Guide me</button>
        </form>
        {guideAnswer ? <p role="status">{guideAnswer}</p> : null}
      </section>

      <nav className="space-tabs" aria-label="Recovery Ministry workspace">
        {(["home", "curriculum", "group", "leader", "resources"] as const).map((value) =>
          value === "leader" && !canLead ? null : (
            <button key={value} className={tab === value ? "active" : ""} type="button" onClick={() => setTab(value)}>
              {value === "group" ? "Private Group" : value[0].toUpperCase() + value.slice(1)}
            </button>
          ),
        )}
        <button className="space-tabs__reset" type="button" onClick={reset}>Reset preview</button>
      </nav>

      {tab === "home" ? (
        <div className="recovery-home-grid">
          <section className="space-form-card recovery-current-week">
            <p className="hub-kicker">Current week</p>
            <span className="recovery-week-number">{currentWeek.number}</span>
            <h2>{currentWeek.title}</h2>
            <p>{currentWeek.theme}</p>
            <div className="scripture-pills">{currentWeek.scriptures.map((reference) => <span key={reference}>{reference}</span>)}</div>
            <button className="hub-button hub-button--primary" type="button" onClick={() => { setSelectedWeek(currentWeek.number); setTab("curriculum"); }}>
              Open this week’s guide
            </button>
          </section>
          <section className="space-form-card">
            <p className="hub-kicker">My connection</p>
            <h2>{state.joined ? "You are connected to the group" : "Request group access"}</h2>
            <p>
              Membership controls private discussion access. Participation is never shown in a
              public church directory or advertising system.
            </p>
            <button className="hub-button hub-button--secondary" type="button" onClick={() => setState((current) => ({ ...current, joined: !current.joined }))}>
              {state.joined ? "Pause group access" : "Request to join"}
            </button>
            <button className="hub-button hub-button--secondary" type="button" onClick={() => setState((current) => ({ ...current, confidentialFollowupRequested: true }))}>
              Request confidential leader follow-up
            </button>
            {state.confidentialFollowupRequested ? <p className="space-success">✓ A private follow-up request is queued in this browser preview.</p> : null}
          </section>
          <section className="space-form-card">
            <p className="hub-kicker">My weekly progress</p>
            <h2>{completedWeeks} reflections saved</h2>
            <div className="recovery-progress"><span style={{ width: `${(completedWeeks / weeks.length) * 100}%` }} /></div>
            <p>
              Progress is private and is not a sobriety score, spiritual ranking, streak, or leader
              performance measure.
            </p>
            <button className="hub-button hub-button--secondary" type="button" onClick={() => setTab("curriculum")}>View all weeks</button>
          </section>
          <section className="space-form-card recovery-program-boundary">
            <p className="hub-kicker">Curriculum governance</p>
            <h2>Church-created framework</h2>
            <p>
              This preview uses original ministry outlines and Scripture references. Official
              Celebrate Recovery branding or lesson content should be connected only after church
              leadership confirms authorized materials, leader training, and any required license
              or program agreement.
            </p>
          </section>
        </div>
      ) : null}

      {tab === "curriculum" ? (
        <div className="curriculum-layout">
          <aside className="curriculum-week-list">
            <h2>12-week path</h2>
            {weeks.map((item) => (
              <button key={item.number} type="button" className={selectedWeek === item.number ? "active" : ""} onClick={() => setSelectedWeek(item.number)}>
                <span>{item.number}</span><div><strong>{item.title}</strong><small>{state.journal[item.number]?.trim() ? "Reflection saved" : item.number === state.currentWeek ? "Current week" : "Open week"}</small></div>
              </button>
            ))}
          </aside>
          <section className="space-form-card curriculum-detail">
            <p className="hub-kicker">Week {week.number}</p>
            <h2>{week.title}</h2>
            <p className="curriculum-theme">{week.theme}</p>
            <h3>Scripture references</h3>
            <div className="scripture-pills">{week.scriptures.map((reference) => <span key={reference}>{reference}</span>)}</div>
            <h3>Reflection questions</h3>
            <ol>{week.reflection.map((question) => <li key={question}>{question}</li>)}</ol>
            <div className="space-callout"><strong>Practice for the week</strong><p>{week.practice}</p></div>
            <form className="recovery-journal" onSubmit={saveJournal}>
              <label>
                Private reflection
                <textarea name="journal" rows={7} maxLength={6000} defaultValue={state.journal[week.number] ?? ""} placeholder="Saved only inside this browser during preview. Production uses the approved private-data policy." />
              </label>
              <button className="hub-button hub-button--primary" type="submit">Save private reflection</button>
            </form>
          </section>
        </div>
      ) : null}

      {tab === "group" ? (
        <div className="space-two-column recovery-group-layout">
          <section className="space-form-card">
            <p className="hub-kicker">Approved participants only</p>
            <h2>Sunday Recovery Group</h2>
            <p>
              Posts stay within this group. Do not share another person’s story, screenshots, medical
              information, or identifying details outside the approved space.
            </p>
            <form className="space-form" onSubmit={postToGroup}>
              <label>Post type<select name="type" defaultValue="encouragement"><option value="encouragement">Encouragement</option><option value="question">Question</option><option value="reflection">Reflection</option><option value="resource">Resource</option>{canLead ? <option value="announcement">Leader announcement</option> : null}</select></label>
              <label className="space-form__wide">Message<textarea name="body" rows={5} maxLength={5000} required /></label>
              <button className="hub-button hub-button--primary" type="submit">Post to private group</button>
            </form>
          </section>
          <section className="recovery-post-list">
            {state.posts.map((post) => (
              <article key={post.id}>
                <header><span>{post.type}</span><small>{post.createdAt}</small></header>
                <strong>{post.label}</strong>
                <p>{post.body}</p>
              </article>
            ))}
          </section>
        </div>
      ) : null}

      {tab === "leader" && canLead ? (
        <div className="leader-console">
          <section className="space-form-card">
            <p className="hub-kicker">Meeting preparation</p>
            <h2>Week {currentWeek.number}: {currentWeek.title}</h2>
            <p>{currentWeek.leaderFocus}</p>
            <div className="leader-checklist">
              {Object.entries(state.leaderChecklist).map(([key, checked]) => (
                <label key={key}><input type="checkbox" checked={checked} onChange={() => toggleLeaderItem(key)} /><span>{({ room: "Room and privacy setup confirmed", agreements: "Group agreements ready", resources: "Crisis and treatment resources available", attendance: "Private attendance process ready", followup: "Follow-up responsibilities assigned" } as Record<string, string>)[key]}</span></label>
              ))}
            </div>
          </section>
          <section className="space-form-card">
            <p className="hub-kicker">Facilitation flow</p>
            <h2>Suggested 60-minute meeting</h2>
            <ol className="meeting-agenda">
              <li><strong>0–10 min</strong><span>Welcome, agreements, and voluntary check-in</span></li>
              <li><strong>10–20 min</strong><span>Scripture references and weekly theme</span></li>
              <li><strong>20–45 min</strong><span>Facilitated discussion with no forced disclosure</span></li>
              <li><strong>45–55 min</strong><span>Practice, resources, and support planning</span></li>
              <li><strong>55–60 min</strong><span>Prayer, reminders, and safe dismissal</span></li>
            </ol>
          </section>
          <section className="space-form-card leader-boundaries">
            <p className="hub-kicker">Leader boundaries</p>
            <h2>What the ministry does not do</h2>
            <ul><li>Diagnose substance use or mental-health conditions</li><li>Direct detoxification or medication changes</li><li>Promise confidentiality when immediate safety or mandated reporting applies</li><li>Pressure public disclosure, amends, reconciliation, or testimony</li><li>Replace licensed treatment or emergency response</li></ul>
          </section>
          <section className="space-form-card">
            <p className="hub-kicker">Attendance</p>
            <h2>Private meeting check-in</h2>
            <p>Attendance is restricted to the participant and approved group leaders.</p>
            <div className="attendance-actions">
              {(["registered", "present", "excused"] as const).map((value) => <button className={state.attendance[currentWeek.number] === value ? "active" : ""} key={value} type="button" onClick={() => setState((current) => ({ ...current, attendance: { ...current.attendance, [currentWeek.number]: value } }))}>{value}</button>)}
            </div>
          </section>
        </div>
      ) : null}

      {tab === "resources" ? (
        <section className="resource-grid">
          <article className="resource-card resource-card--urgent"><span>911</span><h2>Immediate danger or suspected overdose</h2><p>Call 911 in the United States. Do not wait for an app message or church reply.</p></article>
          <article className="resource-card"><span>988</span><h2>Crisis support</h2><p>Call or text 988 in the United States for immediate crisis support.</p><a href="https://988lifeline.org/" target="_blank" rel="noreferrer">Open 988 Lifeline ↗</a></article>
          <article className="resource-card"><span>24/7</span><h2>Substance-use treatment information</h2><p>Use SAMHSA’s official treatment information and locator resources.</p><a href="https://www.samhsa.gov/find-help/helplines/national-helpline" target="_blank" rel="noreferrer">Open SAMHSA National Helpline ↗</a></article>
          <article className="resource-card"><span>⌕</span><h2>Find treatment</h2><p>Search the official U.S. treatment locator rather than relying on unverified listings.</p><a href="https://findtreatment.gov/" target="_blank" rel="noreferrer">Open FindTreatment.gov ↗</a></article>
          <article className="resource-card"><span>∞</span><h2>Church group connection</h2><p>Request an approved conversation with a Recovery Ministry leader. The request remains separate from advertising and public analytics.</p><button className="hub-button hub-button--primary" type="button" onClick={() => setState((current) => ({ ...current, confidentialFollowupRequested: true }))}>Request leader follow-up</button></article>
          <article className="resource-card"><span>✓</span><h2>My private support plan</h2><p>Record trusted contacts, treatment resources, transportation, and emergency options in an approved private workflow.</p><button className="hub-button hub-button--secondary" type="button" onClick={() => setGuideAnswer("Support-plan editing is represented in the production data model and should receive clinical/privacy review before launch.")}>Review support-plan boundary</button></article>
        </section>
      ) : null}
    </div>
  );
}
