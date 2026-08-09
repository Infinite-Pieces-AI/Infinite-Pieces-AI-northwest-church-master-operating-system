"use client";

import { useState, type FormEvent } from "react";
import { assertAudiencePlanAllowed } from "@church/outreach";
import { campaigns } from "@/lib/demo-data";

interface PlanPreview {
  objective: string;
  geography: string;
  keywords: string[];
  landingPage: string;
}

export function CampaignCommand() {
  const [preview, setPreview] = useState<PlanPreview | null>(null);
  const [message, setMessage] = useState(
    "Campaigns remain synthetic and spend $0 until church approval and provider connections exist.",
  );

  function simulate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const objective = String(data.get("objective") ?? "").trim();
    const geography = String(data.get("geography") ?? "").trim();
    const keywordText = String(data.get("keywords") ?? "").trim();
    const landingPage = String(data.get("landingPage") ?? "").trim();
    const keywords = keywordText
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    try {
      assertAudiencePlanAllowed({
        audienceDescription: `${objective} ${geography} ${keywords.join(" ")}`,
        sourceData: ["aggregate search performance", "contextual keyword research"],
      });
      if (!objective || !geography || !keywords.length || !landingPage.startsWith("/")) {
        throw new Error(
          "Add an objective, geography, contextual keywords, and an internal landing-page path.",
        );
      }
      setPreview({ objective, geography, keywords, landingPage });
      setMessage(
        "Synthetic plan passed the sensitive-audience guardrail and is ready for human review.",
      );
    } catch (error) {
      setPreview(null);
      setMessage(error instanceof Error ? error.message : "Campaign plan was rejected.");
    }
  }

  return (
    <>
      <div className="section-grid">
        <section className="panel">
          <div className="panel__header">
            <div>
              <h2>Campaign planner</h2>
              <p>
                Context, geography, useful pages, budget controls, and measurable voluntary next
                steps.
              </p>
            </div>
          </div>
          <div className="panel__body">
            <form className="field-grid" onSubmit={simulate}>
              <label className="field">
                Objective
                <select name="objective" defaultValue="Plan a Visit request">
                  <option>Plan a Visit request</option>
                  <option>Online Bible conversation request</option>
                  <option>Public event registration</option>
                  <option>First-time visitor education</option>
                </select>
              </label>
              <label className="field">
                Geography
                <input name="geography" defaultValue="Lowell and approved nearby towns" />
              </label>
              <label className="field field--span2">
                Contextual keywords
                <textarea
                  name="keywords"
                  rows={3}
                  defaultValue="church in Lowell, Sunday service Lowell, family church Lowell"
                />
              </label>
              <label className="field field--span2">
                Public landing page
                <input name="landingPage" defaultValue="/plan-a-visit" />
              </label>
              <button className="primary-button" type="submit">
                Validate synthetic campaign
              </button>
            </form>
            <p className="notice notice--gold" aria-live="polite">
              {message}
            </p>
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <h2>Validated plan</h2>
              <p>No audience is built from membership, prayer, or private spiritual activity.</p>
            </div>
          </div>
          <div className="panel__body">
            {preview ? (
              <div className="generated-document">
                <span className="status-pill status-pill--review">REVIEW REQUIRED</span>
                <h3>{preview.objective}</h3>
                <p>
                  <strong>Geography:</strong> {preview.geography}
                </p>
                <p>
                  <strong>Landing page:</strong> {preview.landingPage}
                </p>
                <p>
                  <strong>Contextual keywords:</strong> {preview.keywords.join(" · ")}
                </p>
                <p>
                  <strong>Allowed data:</strong> aggregate impressions, clicks, page visits, form
                  starts, and completed voluntary actions.
                </p>
                <p>
                  <strong>Disallowed data:</strong> member lists, private prayer questions, child
                  records, counseling, private Hub behavior, or inferred religious beliefs.
                </p>
              </div>
            ) : (
              <div className="empty-state">
                <span aria-hidden="true">◫</span>
                <h3>Validate a campaign plan.</h3>
                <p>
                  Unsafe audience signals are rejected before the plan reaches an advertising
                  account.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel__header">
          <div>
            <h2>Campaign portfolio</h2>
            <p>Synthetic campaign intelligence with no live spend or automatic budget changes.</p>
          </div>
        </div>
        <div className="panel__body campaign-grid">
          {campaigns.map((campaign) => (
            <article className="campaign-card" key={campaign.id}>
              <span className="status-pill status-pill--review">{campaign.status}</span>
              <h3>{campaign.name}</h3>
              <span>
                {campaign.channel} · {campaign.geography}
              </span>
              <div className="campaign-metrics">
                <div>
                  <strong>{campaign.spend}</strong>
                  <small>Spend</small>
                </div>
                <div>
                  <strong>{campaign.conversions}</strong>
                  <small>Conversions</small>
                </div>
                <div>
                  <strong>0</strong>
                  <small>Auto changes</small>
                </div>
              </div>
              <span>{campaign.objective}</span>
              <p className="notice">Guardrail: {campaign.guardrail}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
