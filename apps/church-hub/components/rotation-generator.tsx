"use client";

import { useState } from "react";

interface RotationAssignment {
  date: string;
  role: string;
  assignedName: string;
}

interface RotationResponse {
  schedule?: RotationAssignment[];
  mode?: "gemini" | "demo";
  model?: string;
  message?: string;
  requiresHumanApproval?: boolean;
}

const syntheticRoster = [
  "Jordan Member | Welcome, Setup | 2x/month | blackout: none",
  "Casey Member | Kids check-in, Welcome | 1x/month | blackout: second Sunday",
  "Morgan Member | Setup, Hospitality | 2x/month | blackout: last Sunday",
  "Avery Member | Welcome, Hospitality | 1x/month | blackout: none",
].join("\n");

export function RotationGenerator({ month }: { month: string }) {
  const [targetMonth, setTargetMonth] = useState(month);
  const [rosterText, setRosterText] = useState(syntheticRoster);
  const [schedule, setSchedule] = useState<RotationAssignment[]>([]);
  const [mode, setMode] = useState<"gemini" | "demo" | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    "Generate a draft only. A ministry leader must review every assignment before activation.",
  );

  async function generateRotation() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/rotations/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetMonth, rosterText }),
      });
      const data = (await response.json()) as RotationResponse;
      if (!response.ok || !data.schedule) {
        throw new Error(data.message ?? "Rotation proposal could not be generated.");
      }
      setSchedule(data.schedule);
      setMode(data.mode ?? "gemini");
      setMessage(
        data.requiresHumanApproval
          ? "Draft generated. Review availability, fairness, safeguarding, and pastoral exceptions before using it."
          : "Draft generated.",
      );
    } catch (error) {
      setSchedule([]);
      setMessage(
        error instanceof Error ? error.message : "Rotation proposal could not be generated.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="hub-panel rotation-generator">
      <div className="panel-heading">
        <div>
          <p className="hub-kicker">Gemini-assisted scheduling proposal</p>
          <h2>Volunteer Rotation Draft</h2>
        </div>
        <span className="gemini-chip">✦ Draft only</span>
      </div>
      <p>
        Use a reviewed roster with roles, preferred serving frequency, and blackout dates. Gemini
        may propose a schedule, but it cannot activate assignments or notify volunteers.
      </p>
      <div className="rotation-generator__controls">
        <label>
          <span>Target month</span>
          <input
            type="month"
            value={targetMonth}
            onChange={(event) => setTargetMonth(event.target.value)}
          />
        </label>
        <label>
          <span>Roster and constraints</span>
          <textarea
            rows={7}
            value={rosterText}
            onChange={(event) => setRosterText(event.target.value)}
            maxLength={8000}
          />
        </label>
      </div>
      <div className="row-actions">
        <button
          className="hub-button hub-button--primary"
          type="button"
          onClick={generateRotation}
          disabled={loading || !targetMonth || !rosterText.trim()}
        >
          {loading ? "Calculating proposal…" : "Generate schedule proposal"}
        </button>
      </div>
      <p className="fellowship-notice" role="status">
        {message}
      </p>
      {schedule.length ? (
        <div className="rotation-proposal">
          <div className="rotation-proposal__heading">
            <strong>{mode === "demo" ? "Synthetic demo proposal" : "Gemini proposal"}</strong>
            <span>{schedule.length} assignments</span>
          </div>
          <div
            className="rotation-proposal__table"
            role="table"
            aria-label="Volunteer rotation proposal"
          >
            <div className="rotation-proposal__row rotation-proposal__row--header" role="row">
              <span role="columnheader">Date</span>
              <span role="columnheader">Role</span>
              <span role="columnheader">Proposed person</span>
            </div>
            {schedule.map((assignment, index) => (
              <div
                className="rotation-proposal__row"
                role="row"
                key={`${assignment.date}-${assignment.role}-${index}`}
              >
                <span role="cell">{assignment.date}</span>
                <span role="cell">{assignment.role}</span>
                <span role="cell">{assignment.assignedName}</span>
              </div>
            ))}
          </div>
          <p className="privacy-note">
            AI must not override safeguarding restrictions, pastoral judgment, household needs,
            accessibility, or a volunteer’s explicit availability.
          </p>
        </div>
      ) : null}
    </section>
  );
}
