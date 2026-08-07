"use client";

import { useMemo, useState } from "react";
import { bibleJourney, bibleJourneyWeeks, type BibleJourneyWeek } from "@/lib/demo-data";

const tracks = ["Personal", "Couple", "Family", "Teen", "Group"] as const;
type Track = (typeof tracks)[number];

const rhythmSteps = [
  ["read", "Read", "Open the approved passage in the licensed Bible reader."],
  ["notice", "Notice", "Write one thing the story reveals about God and people."],
  ["pray", "Pray", "Respond to God with one honest sentence."],
  ["practice", "Practice", "Choose one concrete act of faith or love."],
  ["share", "Share", "Bring one insight or question to another person."]
] as const;

type RhythmKey = (typeof rhythmSteps)[number][0];

const currentWeekDetails = {
  movements: [
    "God speaks order, beauty, and life into what is unformed.",
    "Human beings receive dignity as image-bearers, not as a reward for performance.",
    "People receive purpose through stewardship, work, worship, rest, and relationship.",
    "The first human community is designed around belonging rather than isolation."
  ],
  practices: [
    "Name one person whose dignity you can intentionally honor this week.",
    "Create one small rhythm of rest that remembers God is the source of life.",
    "Care for one place, responsibility, or relationship entrusted to you."
  ]
};

function trackPrompt(track: Track, week: BibleJourneyWeek) {
  const prompts: Record<Track, string> = {
    Personal: `Where does “${week.bigIdea}” challenge the way you see yourself, God, or another person?`,
    Couple: `What shared rhythm could help your relationship live out this week’s big idea together?`,
    Family: `What simple object lesson, meal conversation, or outdoor activity could help children remember ${week.references.join(", ")}?`,
    Teen: `Where does this story confront pressure, identity, comparison, fear, or the need to belong?`,
    Group: `What would change in our group if we practiced this week’s truth visibly and together?`
  };
  return prompts[track];
}

function buildAiAnswer(prompt: string, week: BibleJourneyWeek, track: Track) {
  if (prompt === "jesus") {
    return {
      title: "Place the week inside the whole Bible story",
      body:
        week.week === 1
          ? "Genesis begins with life, image, presence, and shared purpose. The rest of Scripture traces how God restores what sin fractures, reaching fulfillment in Jesus and the renewed creation described at the Bible’s end."
          : `This week belongs to the same story moving from creation, through covenant and Israel, toward Jesus, the Spirit-formed church, and new creation. Leadership-approved notes would make the specific connection for “${week.title}.”`,
      citations: [...week.references, "John 1:1-18", "Colossians 1:15-20", "Revelation 21-22"]
    };
  }
  if (prompt === "pray") {
    return {
      title: "A short prayer framework",
      body: `Praise God for what “${week.title}” reveals. Confess where trust or practice has been missing. Ask for help to live the big idea—${week.bigIdea.toLowerCase()}—and name one person or situation where you want to respond faithfully.`,
      citations: week.references
    };
  }
  if (prompt === "discuss") {
    return {
      title: `${track} discussion starter`,
      body: trackPrompt(track, week),
      citations: week.references
    };
  }
  return {
    title: "One small next step",
    body: `Read ${week.references.join(", ")}, write one sentence about God, one sentence about people, and one action that would make “${week.bigIdea}” visible before the week ends.`,
    citations: week.references
  };
}

export function BibleJourneyExperience() {
  const [selectedWeekNumber, setSelectedWeekNumber] = useState(1);
  const [track, setTrack] = useState<Track>("Personal");
  const [completed, setCompleted] = useState<Set<RhythmKey>>(() => new Set());
  const [aiPrompt, setAiPrompt] = useState("jesus");

  const selectedWeek = useMemo(
    () => bibleJourneyWeeks.find((week) => week.week === selectedWeekNumber) ?? bibleJourneyWeeks[0],
    [selectedWeekNumber]
  );
  const aiAnswer = useMemo(
    () => buildAiAnswer(aiPrompt, selectedWeek, track),
    [aiPrompt, selectedWeek, track]
  );
  const rhythmProgress = Math.round((completed.size / rhythmSteps.length) * 100);
  const journeyProgress = Math.round((selectedWeek.week / bibleJourneyWeeks.length) * 100);

  function toggleRhythm(key: RhythmKey) {
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="bible-journey">
      <section className="journey-hero">
        <div className="journey-hero__copy">
          <p className="hub-kicker">Whole-Bible formation path</p>
          <span className="journey-week-label">Week {selectedWeek.week} of {bibleJourneyWeeks.length}</span>
          <h2>{selectedWeek.title}</h2>
          <p>{selectedWeek.summary}</p>
          <div className="journey-reference-row">
            {selectedWeek.references.map((reference) => <span key={reference}>{reference}</span>)}
          </div>
          <div className="journey-progress" aria-label={`${journeyProgress}% through the Bible journey`}>
            <div><span style={{ width: `${journeyProgress}%` }} /></div>
            <small>{journeyProgress}% through the journey · creation to new creation</small>
          </div>
        </div>
        <div className="journey-orbit" aria-hidden="true">
          <span>GENESIS</span>
          <strong>∞</strong>
          <span>REVELATION</span>
        </div>
      </section>

      <section className="era-rail" aria-label="Bible journey eras">
        {bibleJourney.eras.map((era, index) => (
          <button
            key={era.label}
            type="button"
            className={selectedWeek.era === era.label || (selectedWeek.week === 1 && index === 0) ? "active" : ""}
            onClick={() => {
              const firstWeek = Number(era.weeks.split("-")[0]);
              setSelectedWeekNumber(firstWeek);
            }}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{era.label}</strong>
            <small>Weeks {era.weeks}</small>
          </button>
        ))}
      </section>

      <div className="journey-layout">
        <section className="hub-panel story-panel">
          <div className="panel-heading">
            <div>
              <p className="hub-kicker">This week’s story</p>
              <h2>{selectedWeek.bigIdea}</h2>
            </div>
            <span className="pill">Leadership review framework</span>
          </div>
          {selectedWeek.week === 1 ? (
            <>
              <h3>Story movements</h3>
              <div className="story-movements">
                {currentWeekDetails.movements.map((movement, index) => (
                  <article key={movement}>
                    <span>{index + 1}</span>
                    <p>{movement}</p>
                  </article>
                ))}
              </div>
              <h3>Practice the story</h3>
              <ul className="practice-list">
                {currentWeekDetails.practices.map((practice) => <li key={practice}>{practice}</li>)}
              </ul>
            </>
          ) : (
            <div className="selected-week-summary">
              <p>{selectedWeek.summary}</p>
              <h3>Core movement</h3>
              <p>{selectedWeek.bigIdea}</p>
              <p className="privacy-note">
                The minister-approved outline, licensed passage links, media, and local application
                would be attached before publication.
              </p>
            </div>
          )}

          <div className="track-switch" aria-label="Choose a discussion track">
            {tracks.map((item) => (
              <button
                key={item}
                type="button"
                className={track === item ? "active" : ""}
                onClick={() => setTrack(item)}
                aria-pressed={track === item}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="track-prompt">
            <small>{track} track</small>
            <strong>{trackPrompt(track, selectedWeek)}</strong>
          </div>
        </section>

        <aside className="hub-panel rhythm-panel">
          <p className="hub-kicker">Five-movement weekly rhythm</p>
          <h2>Read. Notice. Pray. Practice. Share.</h2>
          <div className="rhythm-meter"><span style={{ width: `${rhythmProgress}%` }} /></div>
          <small>{completed.size} of {rhythmSteps.length} movements completed in this demo</small>
          <div className="rhythm-list">
            {rhythmSteps.map(([key, label, description]) => (
              <label key={key} className={completed.has(key) ? "complete" : ""}>
                <input
                  type="checkbox"
                  checked={completed.has(key)}
                  onChange={() => toggleRhythm(key)}
                />
                <span><strong>{label}</strong><small>{description}</small></span>
              </label>
            ))}
          </div>
          <button className="hub-button hub-button--secondary" type="button">
            Open licensed Scripture reader
          </button>
          <p className="privacy-note">
            Passage text is not bundled in source control. The production reader requires an approved
            licensed Bible provider.
          </p>
        </aside>
      </div>

      <section className="ai-story-guide">
        <div className="ai-story-guide__header">
          <span className="connection-spark" aria-hidden="true">✦</span>
          <div>
            <p className="hub-kicker">Approved-source Bible companion</p>
            <h2>Explore the story without replacing Scripture, leaders, or community.</h2>
            <p>
              The future assistant answers from licensed Scripture references and minister-approved
              resources, separates generated explanation from church teaching, and displays citations.
            </p>
          </div>
        </div>
        <div className="ai-prompt-row">
          <button type="button" className={aiPrompt === "jesus" ? "active" : ""} onClick={() => setAiPrompt("jesus")}>How does this connect to Jesus?</button>
          <button type="button" className={aiPrompt === "pray" ? "active" : ""} onClick={() => setAiPrompt("pray")}>Help me pray this story</button>
          <button type="button" className={aiPrompt === "discuss" ? "active" : ""} onClick={() => setAiPrompt("discuss")}>Give my track a question</button>
          <button type="button" className={aiPrompt === "practice" ? "active" : ""} onClick={() => setAiPrompt("practice")}>Give me one next step</button>
        </div>
        <div className="ai-answer-card" aria-live="polite">
          <div className="ai-answer-labels">
            <span>SCRIPTURE REFERENCES</span>
            <span>CHURCH TEACHING</span>
            <span>AI EXPLANATION · DEMO</span>
          </div>
          <h3>{aiAnswer.title}</h3>
          <p>{aiAnswer.body}</p>
          <div className="citation-row">
            {aiAnswer.citations.map((citation) => <span key={citation}>{citation}</span>)}
          </div>
        </div>
      </section>

      <section className="journey-next hub-panel">
        <div className="panel-heading">
          <div>
            <p className="hub-kicker">The complete path</p>
            <h2>Every week builds toward the next.</h2>
          </div>
          <span className="pill">52 weeks · Genesis to Revelation</span>
        </div>
        <div className="upcoming-week-grid">
          {bibleJourney.upcoming.map((week) => (
            <button key={week.week} type="button" onClick={() => setSelectedWeekNumber(week.week)}>
              <span>Week {week.week}</span>
              <strong>{week.title}</strong>
              <small>{week.references.join(" · ")}</small>
            </button>
          ))}
        </div>
        <details className="journey-library">
          <summary>Browse all 52 weeks</summary>
          <div className="journey-library__grid">
            {bibleJourneyWeeks.map((week) => (
              <button
                type="button"
                key={week.week}
                className={selectedWeek.week === week.week ? "active" : ""}
                onClick={() => setSelectedWeekNumber(week.week)}
              >
                <span>{week.week}</span>
                <div><strong>{week.title}</strong><small>{week.era} · {week.references.join(", ")}</small></div>
              </button>
            ))}
          </div>
        </details>
      </section>
    </div>
  );
}
