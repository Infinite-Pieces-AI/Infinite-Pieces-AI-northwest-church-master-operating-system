"use client";

import { useEffect, useState } from "react";

interface Program {
  id: string;
  displayName: string;
  programType: "custom" | "celebrate_recovery";
  officialProgramConfirmation: boolean;
  publicSummary: string;
  meetingDay?: string;
  meetingTime?: string;
  generalLocation?: string;
  status: string;
  participantCount: number;
  sessionCount: number;
}

interface AccessRequest {
  id: string;
  programId: string;
  programName: string;
  profileName: string;
  requestMessage?: string;
  status: string;
  createdAt: string;
}

interface AdminPayload {
  programs: Program[];
  accessRequests: AccessRequest[];
}

const previewPayload: AdminPayload = {
  programs: [
    {
      id: "recovery-program-1",
      displayName: "Recovery Ministry",
      programType: "custom",
      officialProgramConfirmation: false,
      publicSummary:
        "A confidential adult church peer ministry centered on Scripture, honest community, responsible next steps, and appropriate professional support.",
      meetingDay: "Sunday",
      meetingTime: "08:30",
      generalLocation: "Lowell · exact room shared privately",
      status: "active",
      participantCount: 12,
      sessionCount: 8,
    },
  ],
  accessRequests: [
    {
      id: "recovery-access-1",
      programId: "recovery-program-1",
      programName: "Recovery Ministry",
      profileName: "Requesting Member",
      requestMessage: "I would like to learn about the group and its confidentiality expectations.",
      status: "pending",
      createdAt: new Date(Date.now() - 90 * 60_000).toISOString(),
    },
  ],
};

const storageKey = "church-hub-recovery-admin-showcase-v1";

export function RecoveryAdminConsole({ mode }: { mode: "showcase" | "live" }) {
  const [payload, setPayload] = useState<AdminPayload>(previewPayload);
  const [loading, setLoading] = useState(mode === "live");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<"programs" | "access" | "create">("programs");

  useEffect(() => {
    if (mode === "showcase") {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as AdminPayload;
          if (Array.isArray(parsed.programs) && Array.isArray(parsed.accessRequests))
            setPayload(parsed);
        } catch {
          window.localStorage.removeItem(storageKey);
        }
      }
      return;
    }
    void load();
  }, [mode]);

  useEffect(() => {
    if (mode !== "showcase") return;
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [mode, payload]);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/recovery", { cache: "no-store" });
      const result = (await response.json()) as AdminPayload & { message?: string };
      if (!response.ok)
        throw new Error(result.message ?? "Recovery administration could not be loaded.");
      setPayload(result);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Recovery administration could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function sendLive(action: string, values: Record<string, unknown>) {
    const response = await fetch("/api/admin/recovery", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, ...values }),
    });
    const result = (await response.json()) as { message?: string };
    if (!response.ok) throw new Error(result.message ?? "The action could not be completed.");
    await load();
  }

  async function createProgram(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const official = data.get("officialProgramConfirmation") === "on";
    const program: Program = {
      id: crypto.randomUUID(),
      displayName: String(data.get("displayName") ?? "Recovery Ministry").trim(),
      programType: official ? "celebrate_recovery" : "custom",
      officialProgramConfirmation: official,
      publicSummary: String(data.get("publicSummary") ?? "").trim(),
      meetingDay: String(data.get("meetingDay") ?? "").trim() || undefined,
      meetingTime: String(data.get("meetingTime") ?? "").trim() || undefined,
      generalLocation: String(data.get("generalLocation") ?? "").trim() || undefined,
      status: "active",
      participantCount: 1,
      sessionCount: 0,
    };
    try {
      if (mode === "showcase") {
        setPayload((current) => ({ ...current, programs: [program, ...current.programs] }));
      } else {
        await sendLive("create_program", program as unknown as Record<string, unknown>);
      }
      event.currentTarget.reset();
      setTab("programs");
      setNotice("The recovery program and leader membership were created.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The program could not be created.");
    }
  }

  async function review(request: AccessRequest, decision: "approved" | "declined") {
    const note = window.prompt(
      decision === "approved"
        ? "Optional private approval note:"
        : "Record a private reason or alternative next step:",
    );
    try {
      if (mode === "showcase") {
        setPayload((current) => ({
          ...current,
          accessRequests: current.accessRequests.map((row) =>
            row.id === request.id ? { ...row, status: decision } : row,
          ),
          programs:
            decision === "approved"
              ? current.programs.map((program) =>
                  program.id === request.programId
                    ? { ...program, participantCount: program.participantCount + 1 }
                    : program,
                )
              : current.programs,
        }));
      } else {
        await sendLive("review_access", {
          requestId: request.id,
          decision,
          decisionNote: note ?? "",
        });
      }
      setNotice(`Access request ${decision}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The access decision could not be saved.");
    }
  }

  async function changeProgramStatus(program: Program, status: string) {
    try {
      if (mode === "showcase") {
        setPayload((current) => ({
          ...current,
          programs: current.programs.map((row) =>
            row.id === program.id ? { ...row, status } : row,
          ),
        }));
      } else {
        await sendLive("update_program", { programId: program.id, status });
      }
      setNotice("Program status updated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The program could not be updated.");
    }
  }

  function resetShowcase() {
    setPayload(previewPayload);
    window.localStorage.removeItem(storageKey);
    setNotice("Recovery administration showcase restored.");
  }

  return (
    <div className="recovery-admin-console">
      <nav className="module-tabs" aria-label="Recovery administration sections">
        <button
          type="button"
          className={tab === "programs" ? "active" : ""}
          onClick={() => setTab("programs")}
        >
          Programs
        </button>
        <button
          type="button"
          className={tab === "access" ? "active" : ""}
          onClick={() => setTab("access")}
        >
          Access requests
        </button>
        <button
          type="button"
          className={tab === "create" ? "active" : ""}
          onClick={() => setTab("create")}
        >
          Create program
        </button>
      </nav>
      {notice ? (
        <p className="module-notice" role="status">
          {notice}
        </p>
      ) : null}
      {loading ? <p className="module-empty">Loading recovery administration…</p> : null}

      {!loading && tab === "programs" ? (
        <section className="recovery-admin-programs">
          {payload.programs.map((program) => (
            <article key={program.id}>
              <header>
                <span>{program.programType.replaceAll("_", " ")}</span>
                <b>{program.status}</b>
              </header>
              <h3>{program.displayName}</h3>
              <p>{program.publicSummary}</p>
              <dl>
                <div>
                  <dt>Meeting</dt>
                  <dd>
                    {program.meetingDay ?? "Not published"} ·{" "}
                    {program.meetingTime ?? "Time private"}
                  </dd>
                </div>
                <div>
                  <dt>Participants</dt>
                  <dd>{program.participantCount}</dd>
                </div>
                <div>
                  <dt>Published weeks</dt>
                  <dd>{program.sessionCount}</dd>
                </div>
                <div>
                  <dt>Official program confirmation</dt>
                  <dd>{program.officialProgramConfirmation ? "Recorded" : "Not claimed"}</dd>
                </div>
              </dl>
              <select
                value={program.status}
                onChange={(event) => void changeProgramStatus(program, event.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="retired">Retired</option>
              </select>
            </article>
          ))}
          {!payload.programs.length ? (
            <p className="module-empty">No private recovery program is configured.</p>
          ) : null}
        </section>
      ) : null}

      {!loading && tab === "access" ? (
        <section className="recovery-access-queue">
          {payload.accessRequests.map((request) => (
            <article key={request.id}>
              <header>
                <strong>{request.profileName}</strong>
                <span>{request.status}</span>
              </header>
              <p>
                {request.programName} · {new Date(request.createdAt).toLocaleString()}
              </p>
              {request.requestMessage ? <blockquote>{request.requestMessage}</blockquote> : null}
              {request.status === "pending" ? (
                <div>
                  <button type="button" onClick={() => void review(request, "approved")}>
                    Approve private access
                  </button>
                  <button type="button" onClick={() => void review(request, "declined")}>
                    Decline or redirect
                  </button>
                </div>
              ) : null}
            </article>
          ))}
          {!payload.accessRequests.length ? (
            <p className="module-empty">No recovery access requests are waiting.</p>
          ) : null}
          <p className="module-boundary">
            Approval creates a private participant membership. Ordinary members cannot enroll
            themselves, see the roster, or discover another member’s request.
          </p>
        </section>
      ) : null}

      {!loading && tab === "create" ? (
        <section className="module-workspace">
          <form className="module-form" onSubmit={(event) => void createProgram(event)}>
            <h3>Create a private recovery program</h3>
            <label>
              Public ministry name
              <input name="displayName" defaultValue="Recovery Ministry" required maxLength={160} />
            </label>
            <label>
              Meeting day
              <input name="meetingDay" placeholder="Sunday" maxLength={40} />
            </label>
            <label>
              Meeting time
              <input name="meetingTime" type="time" />
            </label>
            <label>
              General location
              <input
                name="generalLocation"
                placeholder="Lowell · exact room private"
                maxLength={200}
              />
            </label>
            <label className="span-2">
              Public summary
              <textarea name="publicSummary" rows={5} required minLength={20} maxLength={3000} />
            </label>
            <label className="check-label span-2">
              <input name="officialProgramConfirmation" type="checkbox" /> Leadership has confirmed
              an official Celebrate Recovery relationship and permission to use its name and
              curriculum.
            </label>
            <button type="submit">Create program and leader access</button>
          </form>
          <p className="module-boundary">
            Do not select official program confirmation merely because the church discusses
            recovery. Confirm the program relationship, curriculum permission, branding, and
            testimony/copyright rules first.
          </p>
        </section>
      ) : null}
      {mode === "showcase" ? (
        <button type="button" className="module-secondary" onClick={resetShowcase}>
          Reset admin showcase
        </button>
      ) : null}
    </div>
  );
}
