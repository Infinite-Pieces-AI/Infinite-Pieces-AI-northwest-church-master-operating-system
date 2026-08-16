"use client";

import Link from "next/link";
import { useState } from "react";

interface GuideResponse {
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
  "I want to know Jesus",
  "I am looking for community",
  "I need a church for my family",
  "I want to study Scripture",
  "I want to serve Lowell",
  "I need an online option",
] as const;

export function MinistryNavigator() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<GuideResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function navigate(value = question) {
    const nextQuestion = value.trim();
    if (!nextQuestion) return;
    setQuestion(nextQuestion);
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/guide", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: nextQuestion }),
      });
      const data = (await response.json()) as GuideResponse;
      setResult(data);
    } catch {
      setResult({ message: "The guide is temporarily unavailable. Use the page links below." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="public-guide" aria-labelledby="public-guide-title">
      <div className="public-guide__intro">
        <span aria-hidden="true">✦</span>
        <div>
          <p className="eyebrow">Church guide</p>
          <h2 id="public-guide-title">Tell us what you are looking for.</h2>
          <p>
            The guide points only to approved church pages. It does not diagnose, profile, or
            silently save what you type.
          </p>
        </div>
      </div>
      <div className="public-guide__quick">
        {quickStarts.map((item) => (
          <button key={item} type="button" onClick={() => void navigate(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="public-guide__form">
        <label htmlFor="public-guide-question">What would help you take a next step?</label>
        <div>
          <input
            id="public-guide-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void navigate();
            }}
            placeholder="Example: I want Scripture and a small group where I can ask questions"
            maxLength={600}
          />
          <button
            type="button"
            className="button button--gold"
            onClick={() => void navigate()}
            disabled={loading}
          >
            {loading ? "Finding the right place…" : "Guide me"}
          </button>
        </div>
      </div>
      {result?.safetyNote ? <p className="public-guide__safety">{result.safetyNote}</p> : null}
      {result?.message ? <p className="public-guide__error">{result.message}</p> : null}
      {result?.recommendations?.length ? (
        <div className="public-guide__results" aria-live="polite">
          <div className="public-guide__mode">
            {result.mode === "gemini"
              ? "Gemini-assisted route selection"
              : "Approved route guidance"}
          </div>
          {result.recommendations.map(({ destination, explanation }) => (
            <Link href={destination.href} key={destination.id}>
              <strong>{destination.title}</strong>
              <span>{destination.description}</span>
              <small>{explanation}</small>
              <b>Open →</b>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
