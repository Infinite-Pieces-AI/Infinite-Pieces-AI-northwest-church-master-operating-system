"use client";

import Link from "next/link";
import { useState } from "react";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  href: string;
  reason: string;
}

const quickPrompts = [
  "Where can I find this week’s Scripture?",
  "I want to meet people or join a meal",
  "Where can I offer a skill or ask for help?",
  "How do I add a prayer request?",
  "Where is private recovery support?",
  "How do I manage Kids Kingdom check-in?",
];

export function MinistryNavigator() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  async function ask(value = question) {
    const normalized = value.trim();
    if (!normalized) return;
    setQuestion(normalized);
    setLoading(true);
    setNotice("");
    try {
      const response = await fetch("/api/ai/navigation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: normalized }),
      });
      const payload = (await response.json()) as {
        recommendations?: Recommendation[];
        notice?: string;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(payload.message ?? "Church Hub could not route that question.");
      }
      setRecommendations(payload.recommendations ?? []);
      setNotice(
        payload.notice ??
          "Suggestions use your question only and do not inspect private ministry content.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Church Hub could not route that question.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={`ministry-navigator ${open ? "ministry-navigator--open" : ""}`}>
      <button
        className="ministry-navigator__toggle"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span aria-hidden="true">✦</span>
        <span>
          <strong>Ask Church Hub</strong>
          <small>
            Find Scripture, fellowship, gifts, prayer, service, recovery, family tools, or your next
            step
          </small>
        </span>
        <b aria-hidden="true">{open ? "−" : "+"}</b>
      </button>
      {open ? (
        <div className="ministry-navigator__panel">
          <div className="ministry-navigator__input">
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void ask();
              }}
              placeholder="What are you looking for inside Church Hub?"
              aria-label="Ask Church Hub where to go"
            />
            <button type="button" disabled={loading || !question.trim()} onClick={() => void ask()}>
              {loading ? "Finding…" : "Guide me"}
            </button>
          </div>
          <div className="ministry-navigator__prompts">
            {quickPrompts.map((prompt) => (
              <button type="button" key={prompt} onClick={() => void ask(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
          {notice ? (
            <p className="ministry-navigator__notice" role="status">
              {notice}
            </p>
          ) : null}
          {recommendations.length ? (
            <div className="ministry-navigator__results">
              {recommendations.map((recommendation) => (
                <Link href={recommendation.href} key={recommendation.id}>
                  <span>∞</span>
                  <div>
                    <strong>{recommendation.title}</strong>
                    <p>{recommendation.description}</p>
                    <small>{recommendation.reason}</small>
                  </div>
                  <b aria-hidden="true">›</b>
                </Link>
              ))}
            </div>
          ) : null}
          <p className="ministry-navigator__boundary">
            Navigation uses the question you type. By default it does not inspect prayer text,
            private messages, children’s records, counseling, recovery participation, or hidden
            engagement scores. Gemini enhancement is allowed only when the church explicitly enables
            private-data AI processing.
          </p>
        </div>
      ) : null}
    </section>
  );
}
