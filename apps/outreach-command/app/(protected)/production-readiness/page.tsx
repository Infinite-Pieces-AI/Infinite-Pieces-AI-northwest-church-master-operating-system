import { LiveDataNotice, statusClass } from "@/components/live-data-ui";
import { PageHeading } from "@/components/page-heading";
import { loadOutreachOverview, outreachBackendConfigured } from "@/lib/live-intelligence";

interface ReadinessCheck {
  label: string;
  ready: boolean;
  evidence: string;
  owner: string;
}

export default async function ProductionReadinessPage() {
  const overview = await loadOutreachOverview();
  const checks: ReadinessCheck[] = [
    {
      label: "Production Supabase project",
      ready: outreachBackendConfigured(),
      evidence: outreachBackendConfigured()
        ? "Browser-safe project URL and publishable key are configured."
        : "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are missing.",
      owner: "Technical administrator",
    },
    {
      label: "Local preview disabled by default",
      ready:
        process.env.NEXT_PUBLIC_ENABLE_DEMO !== "true" &&
        process.env.ALLOW_LOCAL_PREVIEW_MODE !== "true",
      evidence:
        process.env.NEXT_PUBLIC_ENABLE_DEMO !== "true" &&
        process.env.ALLOW_LOCAL_PREVIEW_MODE !== "true"
          ? "Runtime preview flags are off."
          : "At least one local preview flag is enabled in this environment.",
      owner: "Technical administrator",
    },
    {
      label: "Gemini server integration",
      ready:
        process.env.AI_PROVIDER === "gemini" &&
        Boolean(process.env.GEMINI_API_KEY || process.env.AI_API_KEY),
      evidence:
        process.env.AI_PROVIDER === "gemini"
          ? "Gemini is selected; server verifies the key at request time."
          : "AI_PROVIDER is not set to gemini.",
      owner: "Privacy, ministry, and technical owners",
    },
    {
      label: "Private-data AI approval",
      ready: process.env.ALLOW_AI_PRIVATE_DATA_ACCESS === "true",
      evidence:
        process.env.ALLOW_AI_PRIVATE_DATA_ACCESS === "true"
          ? "The environment allows approved private-data AI workflows."
          : "Private fellowship, roster, and community text cannot be sent to AI.",
      owner: "Privacy and ministry leadership",
    },
    {
      label: "Kids Kingdom check-in provider",
      ready: Boolean(process.env.PLANNING_CENTER_PRECHECK_URL || process.env.CHMS_CHECKIN_URL),
      evidence:
        process.env.PLANNING_CENTER_PRECHECK_URL || process.env.CHMS_CHECKIN_URL
          ? "A parent pre-check URL is configured."
          : "No approved Planning Center or ChMS parent pre-check URL is configured.",
      owner: "Kids Kingdom and Sunday operations",
    },
    {
      label: "Google Search Console connector",
      ready: Boolean(
        process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY &&
        process.env.SEARCH_CONSOLE_PROXY_URL &&
        process.env.SEARCH_CONSOLE_PROXY_TOKEN,
      ),
      evidence: process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY
        ? "Property is named; proxy and token must also be present."
        : "No Search Console property is configured.",
      owner: "Outreach and technical owners",
    },
    {
      label: "Public analytics",
      ready:
        Boolean(process.env.PUBLIC_ANALYTICS_PROVIDER) &&
        process.env.PUBLIC_ANALYTICS_PROVIDER !== "disabled",
      evidence:
        process.env.PUBLIC_ANALYTICS_PROVIDER &&
        process.env.PUBLIC_ANALYTICS_PROVIDER !== "disabled"
          ? `Provider: ${process.env.PUBLIC_ANALYTICS_PROVIDER}`
          : "Aggregate public analytics is disabled.",
      owner: "Outreach and privacy owners",
    },
    {
      label: "Automatic outreach disabled",
      ready:
        process.env.OUTREACH_AUTO_REPLY_ENABLED !== "true" &&
        process.env.OUTREACH_AUTOMATIC_CONTACT !== "true" &&
        process.env.OUTREACH_AUTOMATIC_PUBLISHING !== "true",
      evidence:
        process.env.OUTREACH_AUTO_REPLY_ENABLED !== "true" &&
        process.env.OUTREACH_AUTOMATIC_CONTACT !== "true" &&
        process.env.OUTREACH_AUTOMATIC_PUBLISHING !== "true"
          ? "Replies, contact, and publication require humans."
          : "At least one prohibited automatic outreach flag is enabled.",
      owner: "Outreach and privacy owners",
    },
  ];
  const readyCount = checks.filter((check) => check.ready).length;

  return (
    <>
      <PageHeading
        eyebrow="Operational truth before launch"
        title="Production Readiness"
        description="A live configuration and governance checklist. A polished interface is not considered production-ready until the backend, providers, policies, recovery owners, and release gates are actually configured."
      />
      <LiveDataNotice
        title={`${readyCount} of ${checks.length} technical checks currently pass`}
        warning={readyCount !== checks.length}
      >
        <p>
          This list never exposes secret values. Database queues currently contain{" "}
          {overview.pendingAccessRequests} pending member-access request(s) and{" "}
          {overview.newVisitorRequests} new visitor request(s).
        </p>
      </LiveDataNotice>
      <section className="panel" style={{ marginTop: 18 }}>
        <div className="search-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Gate</th>
                <th>Status</th>
                <th>Evidence</th>
                <th>Accountable owner</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((check) => (
                <tr key={check.label}>
                  <td>
                    <strong>{check.label}</strong>
                  </td>
                  <td>
                    <span className={statusClass(check.ready ? "ready" : "blocked")}>
                      {check.ready ? "Ready" : "Not ready"}
                    </span>
                  </td>
                  <td>{check.evidence}</td>
                  <td>{check.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="live-boundary-grid">
        <article>
          <strong>Still requires human verification</strong>
          <p>
            Official public name, Sunday schedule, venue wording, parking, entrance, accessibility,
            Kids Kingdom ages, teen information, online ministry offer, and Google Business Profile
            eligibility.
          </p>
        </article>
        <article>
          <strong>Still requires operational testing</strong>
          <p>
            RLS authorization, invitations, MFA, backup restore, media restore, Sunday fallback,
            safeguarding escalation, incident response, accessibility, Core Web Vitals, and provider
            shutoff.
          </p>
        </article>
      </section>
    </>
  );
}
