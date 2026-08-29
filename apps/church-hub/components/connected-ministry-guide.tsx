"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  ministryDestinations,
  scoreMinistryDestinations,
  type MinistryDestination,
} from "@/lib/ministry-navigation";

const quickPrompts = [
  "Find Scripture for this week",
  "I want to meet people",
  "How can I use my gifts?",
  "I want to pray for someone",
  "Where is the recovery group?",
  "How can I serve?",
  "I need Kids Kingdom help",
];

interface GuideResponse {
  results?: MinistryDestination[];
  source?: string;
  safetyMessage?: string | null;
  aiPrivacy?: string;
  message?: string;
}

export function ConnectedMinistryGuide() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MinistryDestination[]>([]);
  const [source, setSource] = useState("approved-navigation-rules");
  const [safetyMessage, setSafetyMessage] = useState<string | null>(null);
  const [privacyMessage, setPrivacyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function runGuide(input: string) {
    const nextQuery = input.trim();
    if (!nextQuery) return;
    setOpen(true);
    setQuery(nextQuery);
    setLoading(true);
    setError(null);
    setSafetyMessage(null);
    try {
      const response = await fetch("/api/ai/ministry-guide", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: nextQuery }),
      });
      const payload = (await response.json()) as GuideResponse;
      if (!response.ok) throw new Error(payload.message ?? "Unable to guide this request");
      setResults(payload.results?.length ? payload.results : scoreMinistryDestinations(nextQuery));
      setSource(payload.source ?? "approved-navigation-rules");
      setSafetyMessage(payload.safetyMessage ?? null);
      setPrivacyMessage(payload.aiPrivacy ?? null);
    } catch (caught) {
      setResults(scoreMinistryDestinations(nextQuery));
      setSource("approved-navigation-rules");
      setPrivacyMessage("The guide used the local approved route catalog.");
      setError(caught instanceof Error ? caught.message : "AI navigation is unavailable");
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runGuide(query);
  }

  return (
    <section className="hub-navigator">
      <button
        className="hub-navigator__toggle"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span aria-hidden="true">✦</span>
        <span>
          <strong>Ask Church Hub</strong>
          <small>
            Find Scripture, fellowship, gifts, prayer, recovery, service, family tools, or your next step
          </small>
        </span>
        <b aria-hidden="true">{open ? "−" : "+"}</b>
      </button>

      {open ? (
        <div className="hub-navigator__body">
          <p>
            Describe what you are trying to do. The guide chooses from approved Church Hub
            destinations. It does not diagnose, make pastoral decisions, or infer your spiritual
            condition.
          </p>
          <div className="hub-navigator__quick">
            {quickPrompts.map((prompt) => (
              <button key={prompt} type="button" onClick={() => void runGuide(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
          <form className="hub-navigator__form" onSubmit={submit}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              maxLength={500}
              placeholder="Example: I want to help with technology, or I need a prayer group…"
              aria-label="Ask Church Hub where to go"
            />
            <button className="hub-button hub-button--primary" type="submit" disabled={loading}>
              {loading ? "Finding…" : "Guide me"}
            </button>
          </form>

          {safetyMessage ? <p className="hub-navigator__safety">{safetyMessage}</p> : null}
          {error ? <p className="hub-navigator__error">{error}</p> : null}

          {results.length ? (
            <div className="hub-navigator__results">
              <small>{source === "gemini-route-classification" ? "Gemini-assisted route selection" : "Approved route guidance"}</small>
              {results.map((result) => (
                <Link href={result.href} key={result.key}>
                  <strong>{result.title}</strong>
                  <span>{result.description}</span>
                  <em>{result.reason}</em>
                  <b>Open →</b>
                </Link>
              ))}
            </div>
          ) : (
            <div className="hub-navigator__results hub-navigator__results--catalog">
              <small>Popular destinations</small>
              {ministryDestinations.slice(0, 3).map((result) => (
                <Link href={result.href} key={result.key}>
                  <strong>{result.title}</strong>
                  <span>{result.description}</span>
                  <b>Open →</b>
                </Link>
              ))}
            </div>
          )}
          {privacyMessage ? <p className="hub-navigator__privacy">{privacyMessage}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
