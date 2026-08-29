import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasPermission } from "@church/authorization";
import { getViewer, type Viewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

const opportunityKinds = new Set([
  "church_hosted",
  "approved_partner",
  "member_led",
  "self_guided",
  "public_lead",
]);
const locationKinds = new Set([
  "church_site",
  "approved_partner",
  "public_lead",
  "public_place",
  "self_guided_area",
]);
const locationStatuses = new Set(["research", "public_lead", "approved", "paused", "do_not_use"]);
const visibilities = new Set(["public", "members"]);

function dynamicClient(client: Awaited<ReturnType<typeof createClient>>): SupabaseClient {
  return client as unknown as SupabaseClient;
}

function text(value: unknown, maximum: number, required = false): string | null {
  const normalized = typeof value === "string" ? value.trim().slice(0, maximum) : "";
  if (required && !normalized) throw new Error("Complete the required service information.");
  return normalized || null;
}

function dateOrNull(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Enter a valid date and time.");
  return date.toISOString();
}

function postalCode(value: unknown): string | null {
  const normalized = typeof value === "string" ? value.trim().slice(0, 10) : "";
  if (!normalized) return null;
  if (!/^\d{5}(?:-\d{4})?$/.test(normalized)) throw new Error("Enter a valid ZIP code.");
  return normalized;
}

function categoryKey(value: unknown): string {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_");
  if (normalized.includes("hunger") || normalized.includes("food")) return "hunger";
  if (normalized.includes("housing") || normalized.includes("shelter")) return "housing";
  if (normalized.includes("child") || normalized.includes("youth")) return "children_youth";
  if (normalized.includes("older") || normalized.includes("senior") || normalized.includes("elder"))
    return "older_adults";
  if (normalized.includes("disability")) return "disability_support";
  if (normalized.includes("environment") || normalized.includes("cleanup")) return "environment";
  if (normalized.includes("health")) return "public_health";
  if (normalized.includes("recovery")) return "recovery_support";
  if (normalized.includes("neighborhood") || normalized.includes("community"))
    return "neighborhood";
  if (normalized.includes("church") || normalized.includes("setup")) return "church_operations";
  if (normalized.includes("hospitality") || normalized.includes("welcome")) return "hospitality";
  if (normalized.includes("mentor") || normalized.includes("tutor")) return "mentoring";
  if (normalized.includes("transport") || normalized.includes("ride")) return "transportation";
  return "other";
}

function ensureServiceAdministrator(viewer: Viewer | null): asserts viewer is Viewer {
  if (!viewer || viewer.demo) throw new Error("A real privileged account is required.");
  const allowed =
    hasPermission(viewer.roles, "content.draft") ||
    hasPermission(viewer.roles, "moderation.review") ||
    hasPermission(viewer.roles, "group.manage_assigned");
  if (!allowed) throw new Error("Service administration permission is required.");
  if (viewer.aal !== "aal2") throw new Error("Multifactor authentication is required.");
}

async function loadPayload(client: SupabaseClient) {
  const [opportunityResult, proposalResult, locationResult, impactResult] = await Promise.all([
    client
      .from("service_opportunities")
      .select(
        "id,title,partner_name,opportunity_kind,service_category,general_location,postal_code,publication_status,visibility,church_sponsored,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(250),
    client
      .from("service_proposals")
      .select(
        "id,created_by,title,need_statement,impact_statement,service_category,proposed_kind,general_location,postal_code,risk_level,status,reviewer_note,created_at,home_access_involved,transportation_involved,minors_involved,hazardous_work,cash_handling,professional_service,public_place_confirmed",
      )
      .order("created_at", { ascending: false })
      .limit(250),
    client
      .from("service_location_catalog")
      .select(
        "id,name,listing_kind,organization_type,locality,postal_code,public_url,church_review_status,source_verified_at",
      )
      .order("updated_at", { ascending: false })
      .limit(250),
    client
      .from("service_impact_updates")
      .select(
        "id,opportunity_id,headline,summary,people_served,volunteer_count,hours_served,approved_for_members,approved_for_public,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(150),
  ]);
  if (opportunityResult.error) throw opportunityResult.error;
  if (proposalResult.error) throw proposalResult.error;
  if (locationResult.error) throw locationResult.error;
  if (impactResult.error) throw impactResult.error;

  const opportunityRows = (opportunityResult.data ?? []) as Row[];
  const opportunityIds = opportunityRows.map((row) => String(row.id));
  const proposalRows = (proposalResult.data ?? []) as Row[];
  const profileIds = Array.from(
    new Set(proposalRows.map((row) => String(row.created_by ?? "")).filter(Boolean)),
  );

  const [shiftResult, profileResult] = await Promise.all([
    opportunityIds.length
      ? client.rpc("list_service_shift_summaries", { p_opportunity_ids: opportunityIds })
      : Promise.resolve({ data: [], error: null }),
    profileIds.length
      ? client.from("profiles").select("id,display_name").in("id", profileIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (shiftResult.error) throw shiftResult.error;
  if (profileResult.error) throw profileResult.error;

  const shiftRows = (shiftResult.data ?? []) as Row[];
  const profileMap = new Map(
    ((profileResult.data ?? []) as Row[]).map((profile) => [
      String(profile.id),
      String(profile.display_name ?? "Member"),
    ]),
  );
  const opportunityTitleMap = new Map(
    opportunityRows.map((opportunity) => [String(opportunity.id), String(opportunity.title)]),
  );

  return {
    opportunities: opportunityRows.map((opportunity) => {
      const shifts = shiftRows
        .filter((shift) => String(shift.opportunity_id) === String(opportunity.id))
        .sort((a, b) => String(a.starts_at).localeCompare(String(b.starts_at)));
      const nextShift = shifts.find(
        (shift) => new Date(String(shift.starts_at)).getTime() >= Date.now(),
      );
      return {
        id: String(opportunity.id),
        title: String(opportunity.title),
        partnerName: String(opportunity.partner_name),
        kind: String(opportunity.opportunity_kind),
        category: String(opportunity.service_category).replaceAll("_", " "),
        generalLocation: String(opportunity.general_location),
        postalCode:
          typeof opportunity.postal_code === "string" ? opportunity.postal_code : undefined,
        publicationStatus: String(opportunity.publication_status),
        visibility: String(opportunity.visibility),
        churchSponsored: opportunity.church_sponsored === true,
        nextShift: nextShift ? String(nextShift.starts_at) : undefined,
        signupCount: nextShift ? Number(nextShift.signed_up_count ?? 0) : 0,
        capacity: nextShift ? Number(nextShift.capacity ?? 0) : 0,
      };
    }),
    proposals: proposalRows.map((proposal) => {
      const riskFlags: string[] = [];
      if (proposal.home_access_involved === true) riskFlags.push("Private-home access");
      if (proposal.transportation_involved === true) riskFlags.push("Transportation");
      if (proposal.minors_involved === true) riskFlags.push("Minors involved");
      if (proposal.hazardous_work === true) riskFlags.push("Hazardous work");
      if (proposal.cash_handling === true) riskFlags.push("Cash handling");
      if (proposal.professional_service === true) riskFlags.push("Professional service");
      if (proposal.public_place_confirmed !== true)
        riskFlags.push("Public/approved place not confirmed");
      return {
        id: String(proposal.id),
        title: String(proposal.title),
        memberName: profileMap.get(String(proposal.created_by)) ?? "Church member",
        needStatement: String(proposal.need_statement),
        impactStatement: String(proposal.impact_statement),
        category: String(proposal.service_category).replaceAll("_", " "),
        kind: String(proposal.proposed_kind),
        generalLocation: String(proposal.general_location),
        postalCode: typeof proposal.postal_code === "string" ? proposal.postal_code : undefined,
        riskLevel: String(proposal.risk_level),
        riskFlags,
        status: String(proposal.status),
        reviewerNote:
          typeof proposal.reviewer_note === "string" ? proposal.reviewer_note : undefined,
        createdAt: String(proposal.created_at),
      };
    }),
    locations: ((locationResult.data ?? []) as Row[]).map((location) => ({
      id: String(location.id),
      name: String(location.name),
      listingKind: String(location.listing_kind),
      organizationType: String(location.organization_type),
      locality: String(location.locality),
      postalCode: typeof location.postal_code === "string" ? location.postal_code : undefined,
      publicUrl: typeof location.public_url === "string" ? location.public_url : undefined,
      reviewStatus: String(location.church_review_status),
      sourceVerifiedAt:
        typeof location.source_verified_at === "string" ? location.source_verified_at : undefined,
    })),
    impacts: ((impactResult.data ?? []) as Row[]).map((impact) => ({
      id: String(impact.id),
      headline: String(impact.headline),
      opportunityTitle:
        opportunityTitleMap.get(String(impact.opportunity_id)) ?? "Service opportunity",
      summary: String(impact.summary),
      peopleServed: typeof impact.people_served === "number" ? impact.people_served : undefined,
      volunteerCount:
        typeof impact.volunteer_count === "number" ? impact.volunteer_count : undefined,
      hoursServed:
        typeof impact.hours_served === "number"
          ? impact.hours_served
          : typeof impact.hours_served === "string"
            ? Number(impact.hours_served)
            : undefined,
      approvedForMembers: impact.approved_for_members === true,
      approvedForPublic: impact.approved_for_public === true,
      createdAt: String(impact.created_at),
    })),
  };
}

export async function GET() {
  const viewer = await getViewer();
  try {
    ensureServiceAdministrator(viewer);
    const client = dynamicClient(await createClient());
    return NextResponse.json(await loadPayload(client));
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Service administration is unavailable.",
      },
      { status: viewer ? 403 : 401 },
    );
  }
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  try {
    ensureServiceAdministrator(viewer);
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { message: "Invalid service administration request." },
        { status: 400 },
      );
    }
    const row = body as Row;
    const action = text(row.action, 80, true);
    const client = dynamicClient(await createClient());

    if (action === "review_proposal") {
      const decision = text(row.decision, 40, true);
      if (!new Set(["approved", "needs_changes", "declined"]).has(decision)) {
        throw new Error("Unsupported proposal decision.");
      }
      const { error } = await client.rpc("review_service_proposal", {
        p_proposal_id: text(row.proposalId, 80, true),
        p_decision: decision,
        p_reviewer_note: text(row.reviewerNote, 2500),
      });
      if (error) throw error;
    } else if (action === "publish_opportunity") {
      if (!hasPermission(viewer.roles, "content.publish")) {
        throw new Error("Content publishing permission is required.");
      }
      const opportunityId = text(row.opportunityId, 80, true);
      const { data: opportunity, error: readError } = await client
        .from("service_opportunities")
        .select("id,opportunity_kind,church_sponsored,visibility,source_url,safety_summary")
        .eq("id", opportunityId)
        .single();
      if (readError) throw readError;
      const opportunityRow = opportunity as Row;
      const kind = String(opportunityRow.opportunity_kind);
      if ((kind === "church_hosted") !== (opportunityRow.church_sponsored === true)) {
        throw new Error(
          "The sponsorship label is inconsistent and must be corrected before publication.",
        );
      }
      if (kind === "public_lead" && typeof opportunityRow.source_url !== "string") {
        throw new Error("A public lead requires an official source URL before publication.");
      }
      if (
        typeof opportunityRow.safety_summary !== "string" ||
        opportunityRow.safety_summary.length < 10
      ) {
        throw new Error("A reviewed safety summary is required before publication.");
      }
      const { error } = await client
        .from("service_opportunities")
        .update({
          publication_status: "published",
          published_by: viewer.id,
          published_at: new Date().toISOString(),
        })
        .eq("id", opportunityId);
      if (error) throw error;
      const { error: shiftError } = await client
        .from("service_shifts")
        .update({ status: "open" })
        .eq("opportunity_id", opportunityId)
        .eq("status", "draft");
      if (shiftError) throw shiftError;
    } else if (action === "create_opportunity") {
      if (!hasPermission(viewer.roles, "content.draft")) {
        throw new Error("Content drafting permission is required.");
      }
      const kind = text(row.kind, 40, true);
      const visibility = text(row.visibility, 20, true);
      if (!opportunityKinds.has(kind) || !visibilities.has(visibility)) {
        throw new Error("Unsupported service opportunity settings.");
      }
      const startsAt = dateOrNull(row.nextShift ?? row.startsAt);
      const endsAt = dateOrNull(row.endsAt);
      if ((startsAt && !endsAt) || (!startsAt && endsAt)) {
        throw new Error("Both shift start and end are required when scheduling a shift.");
      }
      if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
        throw new Error("The shift end must be after the start.");
      }
      const { data: created, error } = await client
        .from("service_opportunities")
        .insert({
          title: text(row.title, 160, true),
          need_statement: text(row.needStatement, 2000, true),
          impact_statement: text(row.impactStatement, 2000, true),
          partner_name: text(row.partnerName, 160, true),
          general_location: text(row.generalLocation, 200, true),
          postal_code: postalCode(row.postalCode),
          locality: "Lowell",
          region: "MA",
          age_requirements: text(row.ageRequirements, 500, true),
          accessibility_notes: text(row.accessibilityNotes, 1500),
          safety_summary: text(row.safetySummary, 1500, true),
          skills: [],
          family_friendly: false,
          visibility,
          publication_status: "draft",
          created_by: viewer.id,
          opportunity_kind: kind,
          service_category: categoryKey(row.category),
          location_visibility: visibility === "public" ? "general" : "after_signup",
          indoor_outdoor: "either",
          commitment_level: startsAt
            ? "one_time"
            : kind === "self_guided"
              ? "self_guided"
              : "flexible",
          registration_mode:
            kind === "public_lead"
              ? "external_link"
              : kind === "self_guided"
                ? "self_guided"
                : "hub_signup",
          church_sponsored: kind === "church_hosted",
        })
        .select("id")
        .single();
      if (error) throw error;
      if (startsAt && endsAt) {
        const { error: shiftError } = await client.from("service_shifts").insert({
          opportunity_id: String((created as Row).id),
          starts_at: startsAt,
          ends_at: endsAt,
          capacity: Math.max(1, Math.min(1000, Math.round(Number(row.capacity ?? 20)))),
          allow_waitlist: true,
          status: "draft",
        });
        if (shiftError) throw shiftError;
      }
    } else if (action === "create_location") {
      if (!hasPermission(viewer.roles, "content.draft")) {
        throw new Error("Content drafting permission is required.");
      }
      const listingKind = text(row.listingKind, 40, true);
      if (!locationKinds.has(listingKind)) throw new Error("Unsupported location type.");
      const { error } = await client.from("service_location_catalog").insert({
        name: text(row.name, 180, true),
        listing_kind: listingKind,
        organization_type: text(row.organizationType, 60) ?? "other",
        locality: text(row.locality, 120, true),
        region: "MA",
        postal_code: postalCode(row.postalCode),
        public_url: text(row.publicUrl, 2000),
        church_review_status: "research",
        created_by: viewer.id,
      });
      if (error) throw error;
    } else if (action === "review_location") {
      if (!hasPermission(viewer.roles, "content.publish")) {
        throw new Error("Content publishing permission is required.");
      }
      const reviewStatus = text(row.reviewStatus, 40, true);
      if (!locationStatuses.has(reviewStatus))
        throw new Error("Unsupported location review status.");
      const approved = reviewStatus === "approved";
      const { error } = await client
        .from("service_location_catalog")
        .update({
          church_review_status: reviewStatus,
          source_verified_at: new Date().toISOString(),
          reviewed_by: approved ? viewer.id : null,
          reviewed_at: approved ? new Date().toISOString() : null,
        })
        .eq("id", text(row.locationId, 80, true));
      if (error) throw error;
    } else {
      return NextResponse.json(
        { message: "Unsupported service administration action." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "The service administration action failed.",
      },
      { status: viewer ? 400 : 401 },
    );
  }
}
