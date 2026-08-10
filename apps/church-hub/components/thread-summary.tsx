"use client";

import { useState } from "react";

interface SummaryResponse {
  text?: string;
  mode?: "gemini" | "demo";
  message?: string;
}

export function ThreadSummary({ threadId }: { threadId: string }) {
  const [summary, setSummary] = useState("");
  const [mode, setMode] = useState<"gemini" | "demo" | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function generateSummary() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/fellowship/meetups/${threadId}/messages/summary`, {
        method: "POST",
      });
      const data = (await response.json()) as SummaryResponse;
      if (!response.ok || !data.text) {
        throw new Error(data.message ?? "The thread could not be summarized.");
      }
      setSummary(data.text);
      setMode(data.mode ?? "gemini");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The thread could not be summarized.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="thread-summary" aria-live="polite">
      {!summary ? (
        <button
          type="button"
          className="hub-button hub-button--secondary thread-summary__button"
          onClick={generateSummary}
          disabled={loading}
        >
          {loading ? "Summarizing recent messages…" : "✦ Catch me up"}
        </button>
      ) : (
        <div className="thread-summary__result">
          <div className="thread-summary__heading">
            <strong>
              {mode === "demo" ? "Synthetic thread summary" : "Gemini thread summary"}
            </strong>
            <button type="button" onClick={() => setSummary("")}>
              Clear
            </button>
          </div>
          <p>{summary}</p>
          <small>
            Summaries can miss nuance. Check the original participant thread before acting on a
            decision, time, location, or responsibility.
          </small>
        </div>
      )}
      {message ? <p className="gemini-error">{message}</p> : null}
    </div>
  );
}
