"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

type AdminTab = "opportunities" | "proposals" | "locations" | "impact" | "create";

type ProposalStatus = "pending" | "needs_changes" | "approved" | "declined" | "converted";

type OpportunityStatus = "draft" | "in_review" | "scheduled" | "published" | "archived";

interface AdminOpportunity {
  id: string;
  title: string;
  partnerName: string;
  kind: "church_hosted" | "approved_partner" | "member_led" | "self_guided" | "public_lead";
  category: string;
  generalLocation: string;
  postalCode?: string;
  publicationStatus: OpportunityStatus;
  visibility: "public" | "members";
  churchSponsored: boolean;
  nextShift?: string;
  signupCount: number;
  capacity: number;
}

interface AdminProposal {
  id: string;
  title: string;
  memberName: string;
  needStatement: string;
  impactStatement: string;
  category: string;
  kind: "member_led" | "self_guided" | "approved_partner";
  generalLocation: string;
  postalCode?: string;
  riskLevel: "standard" | "review" | "restricted";
  riskFlags: string[];
  status: ProposalStatus;
  reviewerNote?: string;
  createdAt: string;
}

interface ServiceLocation {
  id: string;
  name: string;
  listingKind: "church_site" | "approved_partner" | "public_lead" | "public_place" | "self_guided_area";
  organizationType: string;
  locality: string;
  postalCode?: string;
  publicUrl?: string;
  reviewStatus: "research" | "public_lead" | "approved" | "paused" | "do_not_use";
  sourceVerifiedAt?: string;
}

interface ImpactUpdate {
  id: string;
  headline: string;
  opportunityTitle: string;
  summary: string;
  peopleServed?: number;
  volunteerCount?: number;
  hoursServed?: number;
  approvedForMembers: boolean;
  approvedForPublic: boolean;
  createdAt: string;
}

interface ServiceAdminPayload {
  opportunities: AdminOpportunity[];
  proposals: AdminProposal[];
  locations: ServiceLocation[];
  impacts: ImpactUpdate[];
}

const demoPayload: ServiceAdminPayload = {
  opportunities: [
    {
      id: "admin-opportunity-1",
      title: "Pack neighborhood care kits after Sunday worship",
      partnerName: "Boston Church Lowell",
      kind: "church_hosted",
      category: "Housing and shelter",
      generalLocation: "Butler Middle School",
      postalCode: "01852",
      publicationStatus: "published",
      visibility: "members",
      churchSponsored: true,
      nextShift: new Date(Date.now() + 6 * 24 * 60 * 60_000).toISOString(),
      signupCount: 19,
      capacity: 32,
    },
    {
      id: "admin-opportunity-2",
      title: "Neighborhood litter pickup and prayer walk",
      partnerName: "Member-led invitation",
      kind: "member_led",
      category: "Environment",
      generalLocation: "Lowell public park area",
      postalCode: "01852",
      publicationStatus: "published",
      visibility: "members",
      churchSponsored: false,
      nextShift: new Date(Date.now() + 5 * 24 * 60 * 60_000).toISOString(),
      signupCount: 11,
      capacity: 18,
    },
    {
      id: "admin-opportunity-3",
      title: "Explore AgeSpan Meals on Wheels volunteering",
      partnerName: "AgeSpan",
      kind: "public_lead",
      category: "Older adults",
      generalLocation: "Lowell service area",
      postalCode: "01852",
      publicationStatus: "in_review",
      visibility: "members",
      churchSponsored: false,
      signupCount: 0,
      capacity: 0,
    },
  ],
  proposals: [
    {
      id: "admin-proposal-1",
      title: "Family-friendly public trail cleanup",
      memberName: "Local Preview Member",
      needStatement: "A public trail area has visible litter and could benefit from a small, supervised cleanup team.",
      impactStatement: "The project could leave the area cleaner while helping families practice neighborhood service together.",
      category: "Environment",
      kind: "member_led",
      generalLocation: "Lowell public trail area",
      postalCode: "01854",
      riskLevel: "review",
      riskFlags: ["Minors may attend", "Public place verification required"],
      status: "pending",
      createdAt: new Date().toISOString(),
    },
    {
      id: "admin-proposal-2",
      title: "Furniture repair inside a member home",
      memberName: "Example Member",
      needStatement: "A member requested help repairing heavy furniture in a private residence.",
      impactStatement: "Skilled volunteers could reduce a practical burden if the safety and home-access plan is approved.",
      category: "Housing",
      kind: "member_led",
      generalLocation: "Private residence · exact location withheld",
      postalCode: "01851",
      riskLevel: "restricted",
      riskFlags: ["Private-home access", "Tools", "Heavy lifting"],
      status: "pending",
      createdAt: new Date(Date.now() - 60 * 60_000).toISOString(),
    },
  ],
  locations: [
    {
      id: "location-1",
      name: "Butler Middle School",
      listingKind: "church_site",
      organizationType: "church",
      locality: "Lowell",
      postalCode: "01852",
      reviewStatus: "approved",
      sourceVerifiedAt: new Date().toISOString(),
    },
    {
      id: "location-2",
      name: "Merrimack Valley Food Bank",
      listingKind: "public_lead",
      organizationType: "food_security",
      locality: "Lowell",
      postalCode: "01851",
      publicUrl: "https://mvfb.org/how-to-help/group-volunteers-2/",
      reviewStatus: "public_lead",
      sourceVerifiedAt: new Date().toISOString(),
    },
    {
      id: "location-3",
      name: "AgeSpan",
      listingKind: "public_lead",
      organizationType: "older_adults",
      locality: "Lowell service area",
      postalCode: "01852",
      publicUrl: "https://agespan.org/volunteer/meals-on-wheels/",
      reviewStatus: "research",
    },
  ],
  impacts: [
    {
      id: "impact-1",
      headline: "Care-kit team completed the packing goal",
      opportunityTitle: "Pack neighborhood care kits after Sunday worship",
      summary: "The team packed and quality-checked kits for delivery through an approved partner pathway. No recipient names or photographs were collected.",
      peopleServed: 48,
      volunteerCount: 21,
      hoursServed: 26.25,
      approvedForMembers: true,
      approvedForPublic: false,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60_000).toISOString(),
    },
  ],
};

const storageKey = "church-hub-service-admin-showcase-v1";

function formatDate(value?: string): string {
  if (!value) return "No shift scheduled";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ServiceAdmin({
  mode,
  canPublish,
}: {
  mode: "showcase" | "live";
  canPublish: boolean;
}) {
  const [activeTab, setActiveTab] = useState<AdminTab>("opportunities");
  const [payload, setPayload] = useState<ServiceAdminPayload>(demoPayload);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(mode === "live");
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "showcase") {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        try {
          setPayload(JSON.parse(stored) as ServiceAdminPayload);
        } catch {
          window.localStorage.removeItem(storageKey);
        }
      }
      return;
    }
    void refreshLive();
  }, [mode]);

  useEffect(() => {
    if (mode !== "showcase") return;
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [mode, payload]);

  async function refreshLive() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/service", { cache: "no-store" });
      const result = (await response.json()) as ServiceAdminPayload & { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Unable to load service administration.");
      setPayload(result);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load service administration.");
    } finally {
      setLoading(false);
    }
  }

  async function sendLive(action: string, values: Record<string, unknown>) {
    const response = await fetch("/api/admin/service", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, ...values }),
    });
    const result = (await response.json()) as { message?: string };
    if (!response.ok) throw new Error(result.message ?? "The service administration action failed.");
    await refreshLive();
  }

  const metrics = useMemo(
    () => ({
      published: payload.opportunities.filter((item) => item.publicationStatus === "published").length,
      openCapacity: payload.opportunities.reduce(
        (total, item) => total + Math.max(0, item.capacity - item.signupCount),
        0,
      ),
      pendingProposals: payload.proposals.filter((item) => item.status === "pending").length,
      locationsToReview: payload.locations.filter((item) => item.reviewStatus === "research").length,
    }),
    [payload],
  );

  async function reviewProposal(proposal: AdminProposal, decision: "approved" | "needs_changes" | "declined") {
    const reviewerNote = window.prompt(
      decision === "approved"
        ? "Add the publication/safety conditions for this approved draft:"
        : decision === "needs_changes"
          ? "Explain what must change before approval:"
          : "Record a concise reason for declining:",
      proposal.riskLevel === "restricted"
        ? "Restricted-risk proposals require a complete qualified-leader and safety plan before publication."
        : "",
    );
    if (reviewerNote == null) return;
    try {
      if (mode === "showcase") {
        setPayload((current) => {
          const updatedProposal: AdminProposal = {
            ...proposal,
            status: decision === "approved" ? "converted" : decision,
            reviewerNote,
          };
          const newOpportunity: AdminOpportunity | null =
            decision === "approved"
              ? {
                  id: crypto.randomUUID(),
                  title: proposal.title,
                  partnerName:
                    proposal.kind === "approved_partner"
                      ? "Proposed community partner"
                      : "Member-led invitation",
                  kind:
                    proposal.kind === "approved_partner"
                      ? "public_lead"
                      : proposal.kind,
                  category: proposal.category,
                  generalLocation: proposal.generalLocation,
                  postalCode: proposal.postalCode,
                  publicationStatus: "draft",
                  visibility: "members",
                  churchSponsored: false,
                  signupCount: 0,
                  capacity: 0,
                }
              : null;
          return {
            ...current,
            proposals: current.proposals.map((item) =>
              item.id === proposal.id ? updatedProposal : item,
            ),
            opportunities: newOpportunity
              ? [newOpportunity, ...current.opportunities]
              : current.opportunities,
          };
        });
      } else {
        await sendLive("review_proposal", {
          proposalId: proposal.id,
          decision,
          reviewerNote,
        });
      }
      setSelectedProposal(null);
      setNotice(
        decision === "approved"
          ? "The proposal became a draft opportunity. It is not visible until publication review is complete."
          : "The proposal review was saved.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The proposal could not be reviewed.");
    }
  }

  async function publishOpportunity(opportunity: AdminOpportunity) {
    if (!canPublish) {
      setNotice("Your role can prepare service records but cannot publish them.");
      return;
    }
    try {
      if (mode === "showcase") {
        setPayload((current) => ({
          ...current,
          opportunities: current.opportunities.map((item) =>
            item.id === opportunity.id ? { ...item, publicationStatus: "published" } : item,
          ),
        }));
      } else {
        await sendLive("publish_opportunity", { opportunityId: opportunity.id });
      }
      setNotice("The service opportunity is published to its approved audience.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The opportunity could not be published.");
    }
  }

  async function createOpportunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const kind = String(data.get("kind")) as AdminOpportunity["kind"];
    const opportunity: AdminOpportunity = {
      id: crypto.randomUUID(),
      title: String(data.get("title") ?? "").trim(),
      partnerName: String(data.get("partnerName") ?? "").trim(),
      kind,
      category: String(data.get("category") ?? "Other"),
      generalLocation: String(data.get("generalLocation") ?? "").trim(),
      postalCode: String(data.get("postalCode") ?? "").trim() || undefined,
      publicationStatus: "draft",
      visibility: String(data.get("visibility")) as "public" | "members",
      churchSponsored: kind === "church_hosted",
      nextShift: String(data.get("startsAt") ?? "") || undefined,
      signupCount: 0,
      capacity: Number(data.get("capacity") ?? 0),
    };
    try {
      if (mode === "showcase") {
        setPayload((current) => ({
          ...current,
          opportunities: [opportunity, ...current.opportunities],
        }));
      } else {
        await sendLive("create_opportunity", {
          ...opportunity,
          needStatement: String(data.get("needStatement") ?? "").trim(),
          impactStatement: String(data.get("impactStatement") ?? "").trim(),
          ageRequirements: String(data.get("ageRequirements") ?? "").trim(),
          accessibilityNotes: String(data.get("accessibilityNotes") ?? "").trim(),
          safetySummary: String(data.get("safetySummary") ?? "").trim(),
          endsAt: String(data.get("endsAt") ?? "") || null,
        });
      }
      form.reset();
      setActiveTab("opportunities");
      setNotice("Draft opportunity created. Review sponsorship, safety, location, and shift details before publishing.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The opportunity could not be created.");
    }
  }

  async function createLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const location: ServiceLocation = {
      id: crypto.randomUUID(),
      name: String(data.get("name") ?? "").trim(),
      listingKind: String(data.get("listingKind")) as ServiceLocation["listingKind"],
      organizationType: String(data.get("organizationType") ?? "other"),
      locality: String(data.get("locality") ?? "").trim(),
      postalCode: String(data.get("postalCode") ?? "").trim() || undefined,
      publicUrl: String(data.get("publicUrl") ?? "").trim() || undefined,
      reviewStatus: "research",
    };
    try {
      if (mode === "showcase") {
        setPayload((current) => ({ ...current, locations: [location, ...current.locations] }));
      } else {
        await sendLive("create_location", location as unknown as Record<string, unknown>);
      }
      form.reset();
      setNotice("Location added to research. It is not yet an approved church partner or confirmed opening.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The location could not be added.");
    }
  }

  async function updateLocation(location: ServiceLocation, reviewStatus: ServiceLocation["reviewStatus"]) {
    try {
      if (mode === "showcase") {
        setPayload((current) => ({
          ...current,
          locations: current.locations.map((item) =>
            item.id === location.id
              ? { ...item, reviewStatus, sourceVerifiedAt: new Date().toISOString() }
              : item,
          ),
        }));
      } else {
        await sendLive("review_location", { locationId: location.id, reviewStatus });
      }
      setNotice(
        reviewStatus === "approved"
          ? "Location approved for the church-maintained catalog. This does not create a volunteer shift by itself."
          : "Location review status updated.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The location could not be updated.");
    }
  }

  function resetShowcase() {
    setPayload(demoPayload);
    window.localStorage.removeItem(storageKey);
    setNotice("Service administration showcase restored.");
  }

  return (
    <div className="service-admin">
      <section className="service-admin__metrics">
        <article><strong>{metrics.published}</strong><span>published opportunities</span></article>
        <article><strong>{metrics.openCapacity}</strong><span>open volunteer spaces</span></article>
        <article><strong>{metrics.pendingProposals}</strong><span>member ideas awaiting review</span></article>
        <article><strong>{metrics.locationsToReview}</strong><span>locations needing verification</span></article>
      </section>

      <nav className="module-tabs" aria-label="Service administration sections">
        {([
          ["opportunities", "Opportunities"],
          ["proposals", "Proposal review"],
          ["locations", "Partners and places"],
          ["impact", "Impact review"],
          ["create", "Create opportunity"],
        ] as const).map(([value, label]) => (
          <button type="button" key={value} className={activeTab === value ? "active" : ""} onClick={() => setActiveTab(value)}>{label}</button>
        ))}
      </nav>

      {notice ? <p className="module-notice" role="status">{notice}</p> : null}
      {loading ? <p className="module-empty">Loading service administration…</p> : null}

      {!loading && activeTab === "opportunities" ? (
        <section className="module-workspace">
          <div className="section-heading"><div><p>Source of truth</p><h3>Service opportunity publishing pipeline</h3></div></div>
          <div className="service-admin-table">
            <header><span>Opportunity</span><span>Ownership</span><span>Shift</span><span>Status</span><span>Action</span></header>
            {payload.opportunities.map((opportunity) => (
              <article key={opportunity.id}>
                <div><strong>{opportunity.title}</strong><small>{opportunity.generalLocation}{opportunity.postalCode ? ` · ${opportunity.postalCode}` : ""}</small></div>
                <div><span>{opportunity.kind.replaceAll("_", " ")}</span><small>{opportunity.churchSponsored ? "Church-sponsored" : "Not church-sponsored"}</small></div>
                <div><span>{formatDate(opportunity.nextShift)}</span><small>{opportunity.capacity ? `${opportunity.signupCount}/${opportunity.capacity} registered` : "External or unscheduled"}</small></div>
                <div><b className={`admin-status admin-status--${opportunity.publicationStatus}`}>{opportunity.publicationStatus.replaceAll("_", " ")}</b><small>{opportunity.visibility}</small></div>
                <div>{opportunity.publicationStatus !== "published" ? <button type="button" onClick={() => void publishOpportunity(opportunity)}>Publish</button> : <a href={`/serve?opportunity=${opportunity.id}`}>View →</a>}</div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {!loading && activeTab === "proposals" ? (
        <section className="service-admin-proposals">
          <div className="service-admin-proposal-list">
            {payload.proposals.map((proposal) => (
              <button type="button" key={proposal.id} className={selectedProposal === proposal.id ? "active" : ""} onClick={() => setSelectedProposal(proposal.id)}>
                <span className={`risk-badge risk-badge--${proposal.riskLevel}`}>{proposal.riskLevel}</span>
                <strong>{proposal.title}</strong>
                <small>{proposal.memberName} · {proposal.status.replaceAll("_", " ")}</small>
              </button>
            ))}
          </div>
          <article className="service-admin-proposal-detail">
            {payload.proposals.find((proposal) => proposal.id === selectedProposal) ? (() => {
              const proposal = payload.proposals.find((item) => item.id === selectedProposal)!;
              return <>
                <span className={`risk-badge risk-badge--${proposal.riskLevel}`}>{proposal.riskLevel} review</span>
                <h3>{proposal.title}</h3>
                <p><strong>Submitted by:</strong> {proposal.memberName}</p>
                <p><strong>Location:</strong> {proposal.generalLocation}{proposal.postalCode ? ` · ${proposal.postalCode}` : ""}</p>
                <h4>Need</h4><p>{proposal.needStatement}</p>
                <h4>Expected impact</h4><p>{proposal.impactStatement}</p>
                <h4>Risk flags</h4><div className="tag-row">{proposal.riskFlags.map((flag) => <span key={flag}>{flag}</span>)}</div>
                {proposal.reviewerNote ? <div className="module-boundary">{proposal.reviewerNote}</div> : null}
                {proposal.status === "pending" || proposal.status === "needs_changes" ? <div className="service-admin-review-actions"><button type="button" className="success" onClick={() => void reviewProposal(proposal, "approved")}>Approve to draft</button><button type="button" onClick={() => void reviewProposal(proposal, "needs_changes")}>Request changes</button><button type="button" className="danger" onClick={() => void reviewProposal(proposal, "declined")}>Decline</button></div> : null}
              </>;
            })() : <p className="module-empty">Choose a member proposal to review its need, impact, location, and safety flags.</p>}
          </article>
        </section>
      ) : null}

      {!loading && activeTab === "locations" ? (
        <section className="service-location-layout">
          <div className="service-location-list">
            {payload.locations.map((location) => (
              <article key={location.id}>
                <header><span>{location.listingKind.replaceAll("_", " ")}</span><b>{location.reviewStatus.replaceAll("_", " ")}</b></header>
                <h3>{location.name}</h3>
                <p>{location.locality}{location.postalCode ? ` · ${location.postalCode}` : ""}</p>
                {location.publicUrl ? <a href={location.publicUrl} target="_blank" rel="noreferrer">Open public source ↗</a> : null}
                <small>{location.sourceVerifiedAt ? `Source reviewed ${new Date(location.sourceVerifiedAt).toLocaleDateString()}` : "Source has not been verified"}</small>
                <footer><button type="button" onClick={() => void updateLocation(location, "public_lead")}>Keep as public lead</button><button type="button" className="success" onClick={() => void updateLocation(location, "approved")}>Approve location</button><button type="button" className="danger" onClick={() => void updateLocation(location, "do_not_use")}>Do not use</button></footer>
              </article>
            ))}
          </div>
          <form className="module-form service-location-form" onSubmit={(event) => void createLocation(event)}>
            <h3>Add a service place or public lead</h3>
            <label>Name<input name="name" required maxLength={180} /></label>
            <label>Listing type<select name="listingKind" defaultValue="public_lead"><option value="public_lead">Public lead</option><option value="approved_partner">Possible partner</option><option value="public_place">Public place</option><option value="church_site">Church site</option><option value="self_guided_area">Self-guided area</option></select></label>
            <label>Organization type<select name="organizationType" defaultValue="other"><option value="food_security">Food security</option><option value="housing">Housing</option><option value="older_adults">Older adults</option><option value="environment">Environment</option><option value="public_agency">Public agency</option><option value="church">Church</option><option value="other">Other</option></select></label>
            <label>Locality<input name="locality" required placeholder="Lowell" /></label>
            <label>ZIP code<input name="postalCode" inputMode="numeric" maxLength={5} /></label>
            <label>Official public URL<input name="publicUrl" type="url" placeholder="https://…" /></label>
            <button type="submit">Add to research</button>
            <small>A public listing is not automatically a church partner or current volunteer opening.</small>
          </form>
        </section>
      ) : null}

      {!loading && activeTab === "impact" ? (
        <section className="module-workspace">
          <div className="section-heading"><div><p>Dignity before publicity</p><h3>Review service impact without exposing people receiving support</h3></div></div>
          <div className="service-impact-grid">
            {payload.impacts.map((impact) => (
              <article key={impact.id}>
                <span>{impact.opportunityTitle}</span><h3>{impact.headline}</h3><p>{impact.summary}</p>
                <dl><div><dt>People served</dt><dd>{impact.peopleServed ?? "Not recorded"}</dd></div><div><dt>Volunteers</dt><dd>{impact.volunteerCount ?? "Not recorded"}</dd></div><div><dt>Hours</dt><dd>{impact.hoursServed ?? "Not recorded"}</dd></div></dl>
                <footer><b>{impact.approvedForMembers ? "Approved for members" : "Member approval pending"}</b><b>{impact.approvedForPublic ? "Approved for public" : "Not public"}</b></footer>
              </article>
            ))}
          </div>
          <p className="module-boundary">Do not publish recipient names, faces, exact private addresses, immigration information, medical details, recovery participation, prayer content, or hardship narratives without the appropriate written consent and ministry review.</p>
        </section>
      ) : null}

      {!loading && activeTab === "create" ? (
        <section className="module-workspace">
          <form className="module-form" onSubmit={(event) => void createOpportunity(event)}>
            <div className="section-heading span-2"><div><p>Draft first</p><h3>Create an official service opportunity</h3></div></div>
            <label>Title<input name="title" required minLength={3} maxLength={160} /></label>
            <label>Partner or host<input name="partnerName" required minLength={2} maxLength={160} /></label>
            <label>Ownership<select name="kind" defaultValue="church_hosted"><option value="church_hosted">Church-hosted</option><option value="approved_partner">Approved partner</option><option value="member_led">Member-led · not church-sponsored</option><option value="self_guided">Self-guided</option><option value="public_lead">Public lead · verification required</option></select></label>
            <label>Audience<select name="visibility" defaultValue="members"><option value="members">Approved members</option><option value="public">Public website and members</option></select></label>
            <label className="span-2">Need statement<textarea name="needStatement" rows={4} required minLength={20} maxLength={2000} /></label>
            <label className="span-2">Impact statement<textarea name="impactStatement" rows={4} required minLength={20} maxLength={2000} /></label>
            <label>Category<input name="category" required placeholder="Hunger and food access" /></label>
            <label>General location<input name="generalLocation" required maxLength={200} /></label>
            <label>ZIP code<input name="postalCode" inputMode="numeric" maxLength={5} /></label>
            <label>Age requirements<input name="ageRequirements" required defaultValue="Adults" /></label>
            <label className="span-2">Accessibility notes<textarea name="accessibilityNotes" rows={3} /></label>
            <label className="span-2">Safety and safeguarding summary<textarea name="safetySummary" rows={4} required /></label>
            <label>First shift begins<input name="startsAt" type="datetime-local" /></label>
            <label>First shift ends<input name="endsAt" type="datetime-local" /></label>
            <label>Capacity<input name="capacity" type="number" min={1} max={1000} defaultValue={20} /></label>
            <button type="submit">Create draft opportunity</button>
          </form>
        </section>
      ) : null}

      {mode === "showcase" ? <button type="button" className="module-secondary" onClick={resetShowcase}>Reset service administration showcase</button> : null}
    </div>
  );
}
