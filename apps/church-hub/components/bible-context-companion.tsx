"use client";

import { useState } from "react";

interface BibleContextResponse {
  text?: string;
  mode?: "gemini";
  model?: string;
  message?: string;
}

export function BibleContextCompanion({ verseRef }: { verseRef: string }) {
  const [contextData, setContextData] = useState("");
  const [responseFor, setResponseFor] = useState("");
  const [model, setModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const visibleContext = responseFor === verseRef ? contextData : "";

  async function fetchContext() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/ai/bible", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ verse: verseRef }),
      });
      const data = (await response.json()) as BibleContextResponse;
      if (!response.ok || !data.text) {
        throw new Error(data.message ?? "Bible context could not be generated.");
      }
      setContextData(data.text);
      setResponseFor(verseRef);
      setModel(data.model ?? "Gemini");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bible context could not be generated.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="gemini-card gemini-card--bible" aria-live="polite">
      <div className="gemini-card__heading">
        <div>
          <p className="hub-kicker">Historical & cultural context</p>
          <h3>Deep Dive: {verseRef}</h3>
        </div>
        <span className="gemini-chip">✦ Gemini companion</span>
      </div>
      <p className="gemini-card__intro">
        Ask for a concise background note about the selected passage. Generated context is a study
        aid, not Scripture, doctrine, or a replacement for a minister or trusted commentary.
      </p>
      <button
        type="button"
        className="hub-button hub-button--primary"
        onClick={fetchContext}
        disabled={loading}
      >
        {loading ? "Analyzing context…" : "Ask Gemini for context"}
      </button>
      {visibleContext ? (
        <div className="gemini-output">
          <div className="gemini-output__label">
            <strong>Gemini-generated context</strong>
            <span>{model} · Verify important details with approved sources.</span>
          </div>
          <p>{visibleContext}</p>
        </div>
      ) : null}
      {message ? <p className="gemini-error">{message}</p> : null}
    </section>
  );
}
