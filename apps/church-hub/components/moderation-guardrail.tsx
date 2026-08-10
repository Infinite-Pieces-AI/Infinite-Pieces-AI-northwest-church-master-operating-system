"use client";

import { useState } from "react";

interface ModerationResult {
  status?: "safe" | "review";
  categories?: string[];
  reason?: string;
  confidence?: number;
  mode?: "gemini" | "demo";
  message?: string;
}

export function ModerationGuardrail() {
  const [content, setContent] = useState("");
  const [result, setResult] = useState<ModerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function review() {
    setLoading(true);
    setMessage("");
    setResult(null);
    try {
      const response = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: content, contentType: "community_post" }),
      });
      const data = (await response.json()) as ModerationResult;
      if (!response.ok || !data.status) {
        throw new Error(data.message ?? "Moderation preflight could not be completed.");
      }
      setResult(data);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Moderation preflight could not be completed.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="hub-panel moderation-guardrail">
      <div className="panel-heading">
        <div>
          <p className="hub-kicker">AI-assisted preflight · advisory only</p>
          <h2>Community Post Guardrail</h2>
        </div>
        <span className="gemini-chip">✦ Gemini moderation</span>
      </div>
      <p>
        This tool can flag profanity, spam, or hostile language before a community post is reviewed.
        It never makes a safeguarding, emergency, mandated-reporting, or final moderation decision.
      </p>
      <label className="moderation-guardrail__field">
        <span>Draft community post</span>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={6}
          maxLength={4000}
          placeholder="Paste a draft post for an advisory preflight…"
        />
      </label>
      <div className="row-actions">
        <button
          className="hub-button hub-button--primary"
          type="button"
          onClick={review}
          disabled={loading || !content.trim()}
        >
          {loading ? "Checking language…" : "Run moderation preflight"}
        </button>
      </div>
      {result ? (
        <div className={`moderation-result moderation-result--${result.status}`} aria-live="polite">
          <div>
            <strong>
              {result.status === "safe" ? "No immediate language flag" : "Send for human review"}
            </strong>
            <span>
              {result.mode === "demo" ? "Synthetic demo analysis" : "Gemini-assisted analysis"}
            </span>
          </div>
          <p>{result.reason}</p>
          {result.categories?.length ? (
            <div className="meetup-tags">
              {result.categories.map((category) => (
                <span key={category}>{category}</span>
              ))}
            </div>
          ) : null}
          <small>
            Confidence: {Math.round((result.confidence ?? 0) * 100)}%. Human moderators remain
            responsible for context and action.
          </small>
        </div>
      ) : null}
      {message ? <p className="gemini-error">{message}</p> : null}
    </section>
  );
}
