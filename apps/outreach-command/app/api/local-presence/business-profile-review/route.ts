import { evaluateBusinessProfileEligibility } from "@church/outreach";
import { requireOutreachViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const viewer = await requireOutreachViewer();
  if (viewer.demo) {
    return Response.json({
      review: {
        venueName: "Butler Middle School",
        venueRelationship: "rented_event_space",
        addressAuthorized: false,
        representativesPresentDuringHours: true,
        signageVerified: false,
        centralIdentityApproved: false,
        recoveryOwnersDocumented: false,
        decision: "legal_review",
      },
      demo: true,
    });
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("google_business_profile_eligibility_reviews")
    .select(
      "venue_name,venue_relationship,address_authorized,representatives_present_during_hours,signage_verified,central_identity_approved,recovery_owners_documented,decision,reviewed_at,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error)
    return Response.json({ message: "Eligibility review could not be loaded." }, { status: 400 });
  return Response.json({ review: data });
}

export async function POST(request: Request) {
  try {
    const viewer = await requireOutreachViewer();
    const body = (await request.json()) as Record<string, unknown>;
    const venueRelationship = ["owned", "leased", "rented_event_space", "other"].includes(
      String(body.venueRelationship),
    )
      ? (String(body.venueRelationship) as "owned" | "leased" | "rented_event_space" | "other")
      : "rented_event_space";
    const input = {
      venueRelationship,
      addressAuthorized: body.addressAuthorized === true,
      representativesPresentDuringHours: body.representativesPresentDuringHours === true,
      signageVerified: body.signageVerified === true,
      centralIdentityApproved: body.centralIdentityApproved === true,
      recoveryOwnersDocumented: body.recoveryOwnersDocumented === true,
    };
    const evaluation = evaluateBusinessProfileEligibility(input);
    const decision = evaluation.eligible
      ? "eligible"
      : evaluation.requiresLegalOrPolicyReview
        ? "legal_review"
        : "pending";
    const record = {
      venue_name:
        typeof body.venueName === "string"
          ? body.venueName.trim().slice(0, 160)
          : "Butler Middle School",
      venue_relationship: input.venueRelationship,
      address_authorized: input.addressAuthorized,
      representatives_present_during_hours: input.representativesPresentDuringHours,
      signage_verified: input.signageVerified,
      central_identity_approved: input.centralIdentityApproved,
      recovery_owners_documented: input.recoveryOwnersDocumented,
      evidence: {
        note: typeof body.evidenceNote === "string" ? body.evidenceNote.trim().slice(0, 2000) : "",
        evaluation: evaluation.explanation,
        missing: evaluation.missing,
      },
      decision,
      reviewed_by: decision === "pending" ? null : viewer.id,
      reviewed_at: decision === "pending" ? null : new Date().toISOString(),
    };

    if (viewer.demo) return Response.json({ evaluation, decision, demo: true });
    const supabase = await createClient();
    const { error } = await supabase
      .from("google_business_profile_eligibility_reviews")
      .insert(record);
    if (error) throw new Error("The eligibility review could not be saved.");
    return Response.json({ evaluation, decision }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error ? error.message : "The eligibility review could not be saved.",
      },
      { status: 400 },
    );
  }
}
