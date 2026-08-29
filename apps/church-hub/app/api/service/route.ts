import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

const categories = new Set([
  "hunger",
  "housing",
  "children_youth",
  "older_adults",
  "disability_support",
  "environment",
  "public_health",
  "recovery_support",
  "neighborhood",
  "church_operations",
  "hospitality",
  "mentoring",
  "transportation",
  "other",
]);
const proposalKinds = new Set(["member_led", "self_guided", "approved_partner"]);

function dynamicClient(client: Awaited<ReturnType<typeof createClient>>): SupabaseClient {
  return client as unknown as SupabaseClient;
}

function text(value: unknown, maximum: number, required = false): string | null {
  const normalized = typeof value === "string" ? value.trim().slice(0, maximum) : "";
  if (required && !normalized) throw new Error("Complete the required service information.");
  return normalized || null;
}

function boolean(value: unknown): boolean {
  return value === true;
}

function postalCode(value: unknown): string | null {
  const normalized = typeof value === "string" ? value.trim().slice(0, 10) : "";
  if (!normalized) return null;
  if (!/^\d{5}(?:-\d{4})?$/.test(normalized)) throw new Error("Enter a valid ZIP code.");
  return normalized;
}

function dateOrNull(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error("Enter a valid date and time.");
  return parsed.toISOString();
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

async function loadServicePayload(
  client: SupabaseClient,
  viewerId: string,
  requestedPostalCode: string,
  radius: number,
) {
  const { data: nearbyData, error: nearbyError } = await client.rpc(
    "list_nearby_service_opportunities",
    {
      p_postal_code: requestedPostalCode,
      p_radius_miles: radius,
      p_limit: 200,
    },
  );
  if (nearbyError) throw nearbyError;

  const nearbyRows = (nearbyData ?? []) as Row[];
  const opportunityIds = nearbyRows.map((row) => String(row.opportunity_id ?? "")).filter(Boolean);

  const [shiftResult, bookmarkResult, proposalResult, extraResult] = await Promise.all([
    opportunityIds.length
      ? client.rpc("list_service_shift_summaries", { p_opportunity_ids: opportunityIds })
      : Promise.resolve({ data: [], error: null }),
    client
      .from("service_opportunity_bookmarks")
      .select("opportunity_id")
      .eq("profile_id", viewerId),
    client
      .from("service_proposals")
      .select(
        "id,title,service_category,general_location,postal_code,proposed_kind,status,risk_level,reviewer_note,created_at",
      )
      .eq("created_by", viewerId)
      .order("created_at", { ascending: false })
      .limit(100),
    opportunityIds.length
      ? client
          .from("service_opportunities")
          .select(
            "id,safety_summary,transportation_available,background_check_required,source_verified_at,safeguarding_requirements",
          )
          .in("id", opportunityIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (shiftResult.error) throw shiftResult.error;
  if (bookmarkResult.error) throw bookmarkResult.error;
  if (proposalResult.error) throw proposalResult.error;
  if (extraResult.error) throw extraResult.error;

  const shiftRows = (shiftResult.data ?? []) as Row[];
  const bookmarks = new Set(
    ((bookmarkResult.data ?? []) as Row[]).map((row) => String(row.opportunity_id)),
  );
  const extraMap = new Map(((extraResult.data ?? []) as Row[]).map((row) => [String(row.id), row]));

  return {
    opportunities: nearbyRows.map((row) => {
      const id = String(row.opportunity_id);
      const extra = extraMap.get(id);
      return {
        id,
        title: String(row.title ?? "Service opportunity"),
        needStatement: String(row.need_statement ?? ""),
        impactStatement: String(row.impact_statement ?? ""),
        partnerName: String(row.partner_name ?? "Community partner"),
        kind: String(row.opportunity_kind ?? "church_hosted"),
        category: String(row.service_category ?? "other"),
        generalLocation: String(row.general_location ?? "General location shared by host"),
        locality: String(row.locality ?? "Lowell"),
        region: String(row.region ?? "MA"),
        postalCode: typeof row.postal_code === "string" ? row.postal_code : undefined,
        familyFriendly: row.family_friendly === true,
        ageRequirements: String(row.age_requirements ?? "Confirm with the host"),
        physicalRequirements:
          typeof row.physical_requirements === "string" ? row.physical_requirements : undefined,
        skills: stringList(row.skills),
        accessibilityNotes:
          typeof row.accessibility_notes === "string" ? row.accessibility_notes : undefined,
        safeguardingRequirements:
          typeof extra?.safeguarding_requirements === "string"
            ? extra.safeguarding_requirements
            : undefined,
        whatToBring: typeof row.what_to_bring === "string" ? row.what_to_bring : undefined,
        indoorOutdoor: String(row.indoor_outdoor ?? "either"),
        commitmentLevel: String(row.commitment_level ?? "one_time"),
        registrationMode: String(row.registration_mode ?? "hub_signup"),
        sourceUrl: typeof row.source_url === "string" ? row.source_url : undefined,
        sourceVerifiedAt:
          typeof extra?.source_verified_at === "string" ? extra.source_verified_at : undefined,
        churchSponsored: row.church_sponsored === true,
        safetySummary: typeof extra?.safety_summary === "string" ? extra.safety_summary : undefined,
        transportationAvailable: extra?.transportation_available === true,
        backgroundCheckRequired: extra?.background_check_required === true,
        bookmarked: bookmarks.has(id),
        distanceMiles:
          typeof row.distance_miles === "number"
            ? row.distance_miles
            : typeof row.distance_miles === "string"
              ? Number(row.distance_miles)
              : null,
        shifts: shiftRows
          .filter((shift) => String(shift.opportunity_id) === id)
          .map((shift) => ({
            id: String(shift.id),
            startsAt: String(shift.starts_at),
            endsAt: String(shift.ends_at),
            capacity: Number(shift.capacity ?? 0),
            signedUpCount: Number(shift.signed_up_count ?? 0),
            allowWaitlist: shift.allow_waitlist === true,
            status: String(shift.status ?? "open"),
            minimumAge: typeof shift.minimum_age === "number" ? shift.minimum_age : undefined,
            weatherStatus:
              typeof shift.weather_status === "string" ? shift.weather_status : undefined,
            meetingInstructions:
              typeof shift.meeting_instructions === "string"
                ? shift.meeting_instructions
                : undefined,
            userStatus: typeof shift.user_status === "string" ? shift.user_status : null,
            partySize:
              typeof shift.user_party_size === "number" ? shift.user_party_size : undefined,
          })),
      };
    }),
    proposals: ((proposalResult.data ?? []) as Row[]).map((proposal) => ({
      id: String(proposal.id),
      title: String(proposal.title),
      category: String(proposal.service_category),
      generalLocation: String(proposal.general_location),
      postalCode: typeof proposal.postal_code === "string" ? proposal.postal_code : undefined,
      proposedKind: String(proposal.proposed_kind),
      status: String(proposal.status),
      riskLevel: String(proposal.risk_level),
      reviewerNote: typeof proposal.reviewer_note === "string" ? proposal.reviewer_note : undefined,
      createdAt: String(proposal.created_at),
    })),
  };
}

export async function GET(request: Request) {
  const viewer = await getViewer();
  if (!viewer || viewer.demo) {
    return NextResponse.json(
      { message: "A real signed-in member account is required for live service records." },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const requestedPostalCode = (url.searchParams.get("postalCode") ?? "01852")
    .replace(/\D/g, "")
    .slice(0, 5);
  const radius = Math.max(
    1,
    Math.min(100, Number.parseInt(url.searchParams.get("radius") ?? "15", 10) || 15),
  );

  try {
    const client = dynamicClient(await createClient());
    return NextResponse.json(
      await loadServicePayload(client, viewer.id, requestedPostalCode || "01852", radius),
    );
  } catch {
    return NextResponse.json(
      { message: "Service Hub could not load the approved service records." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer || viewer.demo) {
    return NextResponse.json(
      { message: "A real signed-in member account is required for live service actions." },
      { status: 401 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Invalid service request." }, { status: 400 });
  }

  const row = body as Row;
  const action = text(row.action, 80, true);
  const client = dynamicClient(await createClient());

  try {
    if (action === "bookmark") {
      const { error } = await client.from("service_opportunity_bookmarks").upsert(
        {
          opportunity_id: text(row.opportunityId, 80, true),
          profile_id: viewer.id,
        },
        { onConflict: "opportunity_id,profile_id" },
      );
      if (error) throw error;
    } else if (action === "remove_bookmark") {
      const { error } = await client
        .from("service_opportunity_bookmarks")
        .delete()
        .eq("opportunity_id", text(row.opportunityId, 80, true))
        .eq("profile_id", viewer.id);
      if (error) throw error;
    } else if (action === "join_shift") {
      const partySize = Math.max(1, Math.min(20, Math.round(Number(row.partySize ?? 1))));
      const { data, error } = await client
        .from("service_shift_signups")
        .upsert(
          {
            shift_id: text(row.shiftId, 80, true),
            profile_id: viewer.id,
            status: "going",
            party_size: partySize,
          },
          { onConflict: "shift_id,profile_id" },
        )
        .select("status")
        .single();
      if (error) throw error;
      return NextResponse.json({ ok: true, signupStatus: (data as Row).status });
    } else if (action === "cancel_signup") {
      const { error } = await client
        .from("service_shift_signups")
        .update({ status: "cancelled" })
        .eq("shift_id", text(row.shiftId, 80, true))
        .eq("profile_id", viewer.id);
      if (error) throw error;
    } else if (action === "create_proposal") {
      const category = text(row.category, 60, true);
      const proposedKind = text(row.proposedKind, 40, true);
      if (!categories.has(category) || !proposalKinds.has(proposedKind)) {
        throw new Error("Unsupported service proposal type.");
      }
      const proposedStartsAt = dateOrNull(row.proposedStartsAt);
      const proposedEndsAt = dateOrNull(row.proposedEndsAt);
      if (
        proposedStartsAt &&
        proposedEndsAt &&
        new Date(proposedEndsAt).getTime() <= new Date(proposedStartsAt).getTime()
      ) {
        throw new Error("The proposed end must be after the start.");
      }
      const { error } = await client.from("service_proposals").insert({
        created_by: viewer.id,
        title: text(row.title, 180, true),
        need_statement: text(row.needStatement, 2500, true),
        impact_statement: text(row.impactStatement, 2500, true),
        service_category: category,
        proposed_kind: proposedKind,
        general_location: text(row.generalLocation, 200, true),
        postal_code: postalCode(row.postalCode),
        proposed_starts_at: proposedStartsAt,
        proposed_ends_at: proposedEndsAt,
        family_friendly: boolean(row.familyFriendly),
        public_place_confirmed: boolean(row.publicPlaceConfirmed),
        home_access_involved: boolean(row.homeAccessInvolved),
        transportation_involved: boolean(row.transportationInvolved),
        minors_involved: boolean(row.minorsInvolved),
        hazardous_work: boolean(row.hazardousWork),
        cash_handling: boolean(row.cashHandling),
        professional_service: boolean(row.professionalService),
        status: "pending",
      });
      if (error) throw error;
    } else {
      return NextResponse.json({ message: "Unsupported service action." }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "The service action could not be completed.",
      },
      { status: 400 },
    );
  }
}
