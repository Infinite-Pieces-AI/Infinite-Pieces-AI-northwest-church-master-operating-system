"use client";

import { useMemo, useState } from "react";
import { evaluateBusinessProfileEligibility } from "@church/outreach";

const checks = [
  ["officialIdentityApproved", "Official public name approved by central leadership"],
  ["venueRepresentationAuthorized", "Authority to represent the rented school venue documented"],
  [
    "representativesPresentDuringHours",
    "Church representatives are present during every stated public hour",
  ],
  ["serviceHoursVerified", "Published hours match the actual Sunday operation"],
  ["signageEvidenceAvailable", "Directional signage and welcome presence can be evidenced"],
  ["churchOwnedRecoveryAccess", "At least two church-controlled recovery owners are assigned"],
  ["centralLeadershipApproved", "Central Boston Church leadership approved the profile strategy"],
] as const;

type CheckKey = (typeof checks)[number][0];

export function BusinessProfileGate() {
  const [values, setValues] = useState<Record<CheckKey, boolean>>({
    officialIdentityApproved: false,
    venueRepresentationAuthorized: false,
    representativesPresentDuringHours: true,
    serviceHoursVerified: true,
    signageEvidenceAvailable: false,
    churchOwnedRecoveryAccess: false,
    centralLeadershipApproved: false,
  });
  const result = useMemo(() => evaluateBusinessProfileEligibility(values), [values]);
  return (
    <section className="panel business-profile-gate">
      <div className="panel__header">
        <div>
          <h2>Google Business Profile eligibility gate</h2>
          <p>
            A rented school venue is not automatically eligible. Evidence and church authority come
            before creation or promotion.
          </p>
        </div>
        <span
          className={`status-pill status-pill--${result.status === "eligible_for_submission_review" ? "ready" : result.status === "review_required" ? "review" : "blocked"}`}
        >
          {result.status.replaceAll("_", " ")}
        </span>
      </div>
      <div className="panel__body">
        <div className="eligibility-meter">
          <span style={{ width: `${result.completionPercent}%` }} />
        </div>
        <small>
          {result.completionPercent}% of required governance evidence marked complete in this demo
        </small>
        <div className="eligibility-check-grid">
          {checks.map(([key, label]) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={values[key]}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [key]: event.target.checked }))
                }
              />
              <span>
                <strong>{label}</strong>
                <small>
                  {values[key] ? "Evidence marked available" : "Blocks or requires review"}
                </small>
              </span>
            </label>
          ))}
        </div>
        <p className="notice notice--gold">
          This gate never creates a profile. A named leader must review Google’s current eligibility
          rules, the venue relationship, public hours, signage, category, and ownership before
          submission.
        </p>
      </div>
    </section>
  );
}
