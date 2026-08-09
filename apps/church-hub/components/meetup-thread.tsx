"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { FellowshipMessageView } from "@/lib/fellowship-contract";

export function MeetupThread({
  meetupId,
  meetupTitle,
  onClose,
}: {
  meetupId: string;
  meetupTitle: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<FellowshipMessageView[]>([]);
  const [status, setStatus] = useState("Loading the participant thread…");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let active = true;
    void fetch(`/api/fellowship/meetups/${meetupId}/messages`, { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as {
          messages?: FellowshipMessageView[];
          message?: string;
        };
        if (!response.ok) throw new Error(result.message ?? "The thread could not be opened.");
        if (!active) return;
        setMessages(result.messages ?? []);
        setStatus(result.messages?.length ? "Participant-only meetup thread" : "No messages yet.");
      })
      .catch((error: unknown) => {
        if (active)
          setStatus(error instanceof Error ? error.message : "The thread could not be opened.");
      });
    return () => {
      active = false;
    };
  }, [meetupId]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = String(form.get("message") ?? "").trim();
    if (!body) return;
    setSending(true);
    try {
      const response = await fetch(`/api/fellowship/meetups/${meetupId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body, clientMessageId: crypto.randomUUID() }),
      });
      const result = (await response.json()) as {
        message?: FellowshipMessageView | string;
      };
      if (!response.ok || typeof result.message === "string") {
        throw new Error(
          typeof result.message === "string" ? result.message : "The message could not be sent.",
        );
      }
      if (result.message)
        setMessages((current) => [...current, result.message as FellowshipMessageView]);
      event.currentTarget.reset();
      inputRef.current?.focus();
      setStatus("Message sent to the participant-only thread.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="meetup-thread-panel" aria-label={`${meetupTitle} participant thread`}>
      <header>
        <div>
          <p className="hub-kicker">Participant-only communication</p>
          <h2>{meetupTitle}</h2>
          <p>{status}</p>
        </div>
        <button className="hub-button hub-button--secondary" type="button" onClick={onClose}>
          Close thread
        </button>
      </header>
      <div className="meetup-thread-messages" aria-live="polite">
        {messages.map((message) => (
          <article className={message.mine ? "mine" : ""} key={message.id}>
            <strong>{message.mine ? "You" : message.authorLabel}</strong>
            <p>{message.body}</p>
            <small>
              {new Intl.DateTimeFormat("en-US", {
                weekday: "short",
                hour: "numeric",
                minute: "2-digit",
              }).format(new Date(message.createdAt))}
            </small>
          </article>
        ))}
      </div>
      <form onSubmit={send}>
        <label>
          Message the meetup participants
          <textarea
            ref={inputRef}
            name="message"
            rows={3}
            maxLength={2000}
            placeholder="Share a helpful update or question for the group."
          />
        </label>
        <button className="hub-button hub-button--primary" disabled={sending}>
          {sending ? "Sending…" : "Send to meetup thread"}
        </button>
      </form>
      <p className="privacy-note">
        Do not place child custody, medical, counseling, safeguarding, or emergency information in a
        meetup thread. Use the approved restricted workflow instead.
      </p>
    </section>
  );
}
