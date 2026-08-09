"use client";

import { useState, type FormEvent } from "react";
import { assertPublicSourceAllowed } from "@church/outreach";
import { connectorStatuses, workerHealth } from "@/lib/demo-data";

interface AllowedSource {
  url: string;
  label: string;
}

export function SourceControl() {
  const [allowedSources, setAllowedSources] = useState<AllowedSource[]>([
    { url: "https://example.invalid/approved-public-feed", label: "Synthetic approved RSS feed" },
  ]);
  const [message, setMessage] = useState("No live public-listening connector is enabled.");

  function addSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const url = String(data.get("url") ?? "").trim();
    const label = String(data.get("label") ?? "").trim();
    const publiclyAccessible = data.get("publiclyAccessible") === "on";
    const privateGroup = data.get("privateGroup") === "on";
    const requiresBypass = data.get("requiresBypass") === "on";
    const containsRestrictedData = data.get("containsRestrictedData") === "on";
    try {
      assertPublicSourceAllowed({
        url,
        publiclyAccessible,
        privateGroup,
        requiresBypass,
        containsRestrictedData,
      });
      if (!label) throw new Error("Add a source label and accountable owner description.");
      setAllowedSources((current) => [{ url, label }, ...current]);
      setMessage(
        "Source passed local validation. Production still requires platform terms, privacy, security, and leadership review.",
      );
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Source was rejected.");
    }
  }

  return (
    <>
      <div className="source-layout">
        <section className="panel">
          <div className="panel__header">
            <div>
              <h2>Approved-source allowlist</h2>
              <p>Only explicit, reviewed sources may enter listening workers.</p>
            </div>
          </div>
          <div className="panel__body">
            <form className="field-grid" onSubmit={addSource}>
              <label className="field field--span2">
                Public HTTPS URL
                <input name="url" placeholder="https://public.example.org/feed" />
              </label>
              <label className="field field--span2">
                Source label and purpose
                <input name="label" placeholder="Lowell public events RSS" />
              </label>
              <label className="field">
                <span>
                  <input name="publiclyAccessible" type="checkbox" style={{ width: 18 }} /> Publicly
                  accessible without login
                </span>
              </label>
              <label className="field">
                <span>
                  <input name="privateGroup" type="checkbox" style={{ width: 18 }} /> Private or
                  membership-only group
                </span>
              </label>
              <label className="field">
                <span>
                  <input name="requiresBypass" type="checkbox" style={{ width: 18 }} /> Requires
                  paywall, anti-bot, or access bypass
                </span>
              </label>
              <label className="field">
                <span>
                  <input name="containsRestrictedData" type="checkbox" style={{ width: 18 }} />{" "}
                  Contains member, child, pastoral, or restricted data
                </span>
              </label>
              <button className="primary-button" type="submit">
                Validate source
              </button>
            </form>
            <p className="notice notice--gold" aria-live="polite">
              {message}
            </p>
            <div className="allowlist">
              {allowedSources.map((source) => (
                <article key={`${source.url}-${source.label}`}>
                  <div>
                    <strong>{source.label}</strong>
                    <small>{source.url}</small>
                  </div>
                  <span className="status-pill status-pill--review">REVIEWED DEMO</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <h2>Connector control plane</h2>
              <p>Credentials remain server-only; every integration starts disabled.</p>
            </div>
          </div>
          <div className="panel__body connector-grid">
            {connectorStatuses.map((connector) => (
              <article className="connector-card" key={connector.name}>
                <div className="connector-card__header">
                  <strong>{connector.name}</strong>
                  <span
                    className={`status-pill status-pill--${connector.status.includes("Not") || connector.status === "Disabled" ? "disabled" : connector.status.includes("Needs") || connector.status.includes("review") || connector.status === "Demo data" ? "review" : "ready"}`}
                  >
                    {connector.status}
                  </span>
                </div>
                <span>
                  {connector.kind} · last run: {connector.lastRun}
                </span>
                <span>{connector.boundary}</span>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel__header">
          <div>
            <h2>Worker health</h2>
            <p>Workers are server-side, dry-run by default, and never run through the browser.</p>
          </div>
        </div>
        <div className="search-table-wrap">
          <table className="data-table worker-table">
            <thead>
              <tr>
                <th>Worker</th>
                <th>State</th>
                <th>Queue</th>
                <th>Boundary</th>
              </tr>
            </thead>
            <tbody>
              {workerHealth.map((worker) => (
                <tr key={worker.name}>
                  <td>{worker.name}</td>
                  <td>
                    <span
                      className={`status-pill status-pill--${worker.state === "disabled" ? "disabled" : worker.state === "configured" ? "ready" : "demo"}`}
                    >
                      {worker.state}
                    </span>
                  </td>
                  <td>{worker.queue}</td>
                  <td>{worker.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="section-grid" style={{ marginTop: 18 }}>
        <section className="notice notice--green">
          <strong>Allowed:</strong> official APIs, approved RSS feeds, publicly accessible pages,
          aggregate Search Console, public website analytics, and church-owned publishing accounts.
        </section>
        <section className="notice notice--gold">
          <strong>Prohibited:</strong> private Facebook groups, private chats, login bypass, paywall
          bypass, scraped member lists, private search histories, or automatic personal outreach.
        </section>
      </div>
    </>
  );
}
