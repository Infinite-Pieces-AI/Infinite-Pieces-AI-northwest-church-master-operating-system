"use client";

import { useEffect, useState } from "react";
import { RecoveryMinistry } from "./recovery-ministry";

interface ProgramOption {
  id: string;
  displayName: string;
  publicSummary: string;
  meetingDay?: string;
  programType: "custom" | "celebrate_recovery";
  officialProgramConfirmation: boolean;
  acceptingAccessRequests: boolean;
  requestStatus?: string;
  isCurrentMember: boolean;
}

export function RecoveryMinistryGate({
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
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [loading, setLoading] = useState(mode === "live");
  const [notice, setNotice] = useState("");

  async function load() {
    if (mode === "showcase") return;
    setLoading(true);
    try {
      const response = await fetch("/api/recovery-access", { cache: "no-store" });
      const payload = (await response.json()) as { programs?: ProgramOption[]; message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Recovery access could not be loaded.");
      setPrograms(payload.programs ?? []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Recovery access could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [mode]);

  async function action(
    program: ProgramOption,
    actionName: "request" | "withdraw" | "leave",
    message?: string,
    privacyAgreementAccepted?: boolean,
  ) {
    try {
      const response = await fetch("/api/recovery-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: actionName,
          programId: program.id,
          message,
          privacyAgreementAccepted,
        }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok)
        throw new Error(payload.message ?? "The access action could not be completed.");
      setNotice(payload.message ?? "Recovery access updated.");
      await load();
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "The access action could not be completed.",
      );
    }
  }

  if (mode === "showcase") {
    return (
      <RecoveryMinistry
        mode="showcase"
        canLead={canLead}
        programName={programName}
        officialProgramConfirmed={officialProgramConfirmed}
      />
    );
  }

  if (loading) {
    return <p className="module-empty">Checking private Recovery Ministry access…</p>;
  }

  const currentMembership = programs.find((program) => program.isCurrentMember);
  if (currentMembership) {
    return (
      <>
        {notice ? (
          <p className="module-notice" role="status">
            {notice}
          </p>
        ) : null}
        <RecoveryMinistry
          mode="live"
          canLead={canLead}
          programName={currentMembership.displayName}
          officialProgramConfirmed={currentMembership.officialProgramConfirmation}
        />
        <section className="recovery-membership-controls">
          <strong>Private membership controls</strong>
          <p>
            Leaving ends your Hub access to the program. It does not erase required security or
            audit records, and it does not replace a conversation with a leader or treatment
            provider.
          </p>
          <button type="button" onClick={() => void action(currentMembership, "leave")}>
            Leave private recovery program
          </button>
        </section>
      </>
    );
  }

  return (
    <div className="recovery-access-gate">
      <section className="module-hero module-hero--recovery">
        <div>
          <p className="module-kicker">Private and opt-in</p>
          <h2>Request access without exposing your interest to other members.</h2>
          <p>
            Recovery Ministry participation is not shown in the ordinary member directory, public
            website, prayer feed, Outreach OS, advertising systems, or general Church Hub channels.
          </p>
        </div>
        <div className="module-hero__metric">
          <strong>↺</strong>
          <span>Leader-approved access</span>
        </div>
      </section>
      {notice ? (
        <p className="module-notice" role="status">
          {notice}
        </p>
      ) : null}
      <section className="recovery-access-options">
        {programs.map((program) => (
          <RecoveryAccessOption key={program.id} program={program} onAction={action} />
        ))}
        {!programs.length ? (
          <article className="module-empty-state">
            <h3>No recovery program is accepting Hub access requests.</h3>
            <p>
              Speak privately with an approved church leader or use the public recovery-support page
              for treatment resources and a voluntary conversation request.
            </p>
            <a href="http://localhost:3000/recovery-support-lowell">
              Open public recovery support information ↗
            </a>
          </article>
        ) : null}
      </section>
      <p className="module-boundary">
        Requesting access does not diagnose you, enroll you automatically, reveal your request to
        ordinary members, or authorize the Hub to send recovery information to AI or advertising
        systems.
      </p>
    </div>
  );
}

function RecoveryAccessOption({
  program,
  onAction,
}: {
  program: ProgramOption;
  onAction: (
    program: ProgramOption,
    actionName: "request" | "withdraw" | "leave",
    message?: string,
    privacyAgreementAccepted?: boolean,
  ) => Promise<void>;
}) {
  const [message, setMessage] = useState("");
  const [accepted, setAccepted] = useState(false);
  const pending = program.requestStatus === "pending";
  return (
    <article>
      <header>
        <span>{program.meetingDay ?? "Schedule shared by leader"}</span>
        <b>
          {pending
            ? "Request pending"
            : program.acceptingAccessRequests
              ? "Accepting requests"
              : "Not accepting requests"}
        </b>
      </header>
      <h3>{program.displayName}</h3>
      <p>{program.publicSummary}</p>
      {!program.officialProgramConfirmation && program.programType === "custom" ? (
        <small>This program does not claim official Celebrate Recovery affiliation.</small>
      ) : null}
      {pending ? (
        <button type="button" onClick={() => void onAction(program, "withdraw")}>
          Withdraw pending request
        </button>
      ) : program.acceptingAccessRequests ? (
        <>
          <label>
            Optional note to approved leaders
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              maxLength={1500}
              placeholder="You do not need to share a diagnosis, substance history, sobriety date, medication, treatment record, or detailed personal story."
            />
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
            />{" "}
            I understand the confidentiality expectations and that church peer ministry does not
            replace medical or clinical treatment.
          </label>
          <button
            type="button"
            disabled={!accepted}
            onClick={() => void onAction(program, "request", message, accepted)}
          >
            Send private access request
          </button>
        </>
      ) : null}
    </article>
  );
}
