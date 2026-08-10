"use client";

import Link from "next/link";
import { useState } from "react";

interface NavigatorResponse {
  mode?: "gemini" | "guided";
  safetyNote?: string | null;
  recommendations?: Array<{
    destination: {
      id: string;
      title: string;
      description: string;
      href: string;
    };
    explanation: string;
  }>;
  message?: string;
}

const quickStarts = [
  "I want Scripture for this week",
  "I want fellowship or company",
  "I want to serve",
  "I need family tools",
  "I am new and do not know where to start",
] as const;

export function MinistryNavigator() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<NavigatorResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(value = question) {
    const nextQuestion = value.trim();
    if (!nextQuestion) return;
    setQuestion(nextQuestion);
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/ai/navigation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: nextQuestion }),
      });
      setResult((await response.json()) as NavigatorResponse);
    } catch {
      setResult({ message: "The navigation guide is temporarily unavailable." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={`hub-navigator${open ? " hub-navigator--open" : ""}`}>
      <button
        className="hub-navigator__toggle"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span aria-hidden="true">✦</span>
        <div>
          <strong>Ask Church Hub</strong>
          <small>Find Scripture, fellowship, service, family tools, or your next step</small>
        </div>
        <b aria-hidden="true">{open ? "−" : "+"}</b>
      </button>
      {open ? (
        <div className="hub-navigator__body">
          <p>
            Describe what you need. The guide points only to approved Hub destinations and does not
            score your spirituality, infer vulnerability, or read private messages.
          </p>
          <div className="hub-navigator__quick">
            {quickStarts.map((item) => (
              <button key={item} type="button" onClick={() => void submit(item)}>
                {item}
              </button>
            ))}
          </div>
          <div className="hub-navigator__form">
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void submit();
              }}
              placeholder="Example: I want a small Bible conversation and something to do Saturday"
              maxLength={800}
              aria-label="Describe what you want to find in Church Hub"
            />
            <button
              type="button"
              className="hub-button hub-button--primary"
              onClick={() => void submit()}
              disabled={loading}
            >
              {loading ? "Finding…" : "Guide me"}
            </button>
          </div>
          {result?.safetyNote ? <p className="hub-navigator__safety">{result.safetyNote}</p> : null}
          {result?.message ? <p className="hub-navigator__error">{result.message}</p> : null}
          {result?.recommendations?.length ? (
            <div className="hub-navigator__results" aria-live="polite">
              <small>
                {result.mode === "gemini"
                  ? "Gemini-assisted route selection"
                  : "Approved route guidance"}
              </small>
              {result.recommendations.map(({ destination, explanation }) => (
                <Link key={destination.id} href={destination.href} onClick={() => setOpen(false)}>
                  <strong>{destination.title}</strong>
                  <span>{destination.description}</span>
                  <em>{explanation}</em>
                  <b>Open →</b>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
