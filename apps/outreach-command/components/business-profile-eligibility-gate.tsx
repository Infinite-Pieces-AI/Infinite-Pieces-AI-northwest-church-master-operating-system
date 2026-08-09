"use client";

import { useEffect, useState, type FormEvent } from "react";

interface ReviewState {
  venueName: string;
  venueRelationship: "owned" | "leased" | "rented_event_space" | "other";
  addressAuthorized: boolean;
  representativesPresentDuringHours: boolean;
  signageVerified: boolean;
  centralIdentityApproved: boolean;
  recoveryOwnersDocumented: boolean;
  decision?: string;
}

const initialReview: ReviewState = {
  venueName: "Butler Middle School",
  venueRelationship: "rented_event_space",
  addressAuthorized: false,
  representativesPresentDuringHours: true,
  signageVerified: false,
  centralIdentityApproved: false,
  recoveryOwnersDocumented: false,
  decision: "pending",
};

export function BusinessProfileEligibilityGate() {
  const [review, setReview] = useState<ReviewState>(initialReview);
  const [message, setMessage] = useState(
    "Loading the latest church-controlled eligibility review…",
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch("/api/local-presence/business-profile-review", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as {
          review?: Record<string, unknown> | null;
          message?: string;
        };
        if (!response.ok) throw new Error(result.message ?? "The review could not be loaded.");
        if (!active || !result.review) return;
        const value = result.review;
        setReview({
          venueName: String(value.venueName ?? value.venue_name ?? "Butler Middle School"),
          venueRelationship: String(
            value.venueRelationship ?? value.venue_relationship ?? "rented_event_space",
          ) as ReviewState["venueRelationship"],
          addressAuthorized: Boolean(value.addressAuthorized ?? value.address_authorized),
          representativesPresentDuringHours: Boolean(
            value.representativesPresentDuringHours ?? value.representatives_present_during_hours,
          ),
          signageVerified: Boolean(value.signageVerified ?? value.signage_verified),
          centralIdentityApproved: Boolean(
            value.centralIdentityApproved ?? value.central_identity_approved,
          ),
          recoveryOwnersDocumented: Boolean(
            value.recoveryOwnersDocumented ?? value.recovery_owners_documented,
          ),
          decision: String(value.decision ?? "pending"),
        });
        setMessage(
          "A rented or shared venue remains blocked until authority, representation, signage, identity, and recovery ownership are documented.",
        );
      })
      .catch((error: unknown) => {
        if (active) setMessage(error instanceof Error ? error.message : "The review could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, []);

  function setCheck(key: keyof ReviewState, value: boolean) {
    setReview((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("Evaluating the current evidence…");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/local-presence/business-profile-review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...review,
          evidenceNote: form.get("evidenceNote"),
        }),
      });
      const result = (await response.json()) as {
        evaluation?: { eligible: boolean; missing: string[]; explanation: string };
        decision?: string;
        message?: string;
      };
      if (!response.ok || !result.evaluation) {
        throw new Error(result.message ?? "The review could not be evaluated.");
      }
      setReview((current) => ({ ...current, decision: result.decision }));
      setMessage(
        `${result.evaluation.eligible ? "Eligibility gates passed." : "Eligibility remains blocked."} ${result.evaluation.explanation}`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The review could not be evaluated.");
    } finally {
      setBusy(false);
    }
  }

  const checks: Array<[keyof ReviewState, string, string]> = [
    ["addressAuthorized", "Address representation is authorized", "The church has written authority to represent its Sunday presence at this address."],
    ["representativesPresentDuringHours", "Representatives are present during listed hours", "Public hours match the times when church representatives actually meet visitors."],
    ["signageVerified", "Sunday signage is verifiable", "The approved entrance and church signage are documented."],
    ["centralIdentityApproved", "Central identity is approved", "Boston Church leadership approves the public name, location relationship, and account ownership."],
    ["recoveryOwnersDocumented", "Two recovery owners are documented", "At least two authorized church leaders control account recovery."],
  ];

  return (
    <section className="panel business-profile-gate">
      <div className="panel__header">
        <div>
          <h2>Google Business Profile eligibility gate</h2>
          <p>
            Butler Middle School is represented as a rented Sunday venue. The OS must not offer an
            automatic “create profile” action until leadership documents eligibility and current
            platform-policy review.
          </p>
        </div>
        <span className={`status-pill status-pill--${review.decision === "eligible" ? "ready" : "blocked"}`}>
          {review.decision ?? "pending"}
        </span>
      </div>
      <form className="panel__body" onSubmit={submit}>
        <div className="field-grid">
          <label className="field">
            Venue name
            <input
              value={review.venueName}
              onChange={(event) => setReview((current) => ({ ...current, venueName: event.target.value }))}
              maxLength={160}
            />
          </label>
          <label className="field">
            Venue relationship
            <select
              value={review.venueRelationship}
              onChange={(event) =>
                setReview((current) => ({
                  ...current,
                  venueRelationship: event.target.value as ReviewState["venueRelationship"],
                }))
              }
            >
              <option value="owned">Owned</option>
              <option value="leased">Leased</option>
              <option value="rented_event_space">Rented event space</option>
              <option value="other">Other shared arrangement</option>
            </select>
          </label>
        </div>
        <div className="eligibility-check-grid">
          {checks.map(([key, label, detail]) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={Boolean(review[key])}
                onChange={(event) => setCheck(key, event.target.checked)}
              />
              <span><strong>{label}</strong><small>{detail}</small></span>
            </label>
          ))}
        </div>
        <label className="field">
          Evidence and policy-review note
          <textarea
            name="evidenceNote"
            rows={5}
            placeholder="Record the authorization source, Sunday operating evidence, signage evidence, current policy review, and accountable owners."
            maxLength={2000}
          />
        </label>
        <div className="detail-actions">
          <button className="primary-button" disabled={busy}>
            {busy ? "Evaluating…" : "Evaluate current evidence"}
          </button>
          <button className="ghost-button" type="button" onClick={() => setReview(initialReview)}>
            Reset review
          </button>
        </div>
        <p className="notice notice--gold" role="status" aria-live="polite">
          {message}
        </p>
      </form>
    </section>
  );
}
