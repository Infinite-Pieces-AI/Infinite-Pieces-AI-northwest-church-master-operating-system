import { getApiViewer } from "@/lib/auth/api-viewer";
import type { ServiceSignupStatus } from "@/lib/service-contract";
import { createClient } from "@/lib/supabase/server";

const allowedResponses = ["interested", "going", "waitlisted", "cancelled"] as const;

export async function POST(
  request: Request,
  context: { params: Promise<{ opportunityId: string }> },
) {
  try {
    const viewer = await getApiViewer();
    if (!viewer) return Response.json({ message: "Sign in is required." }, { status: 401 });
    const { opportunityId } = await context.params;
    const body = (await request.json()) as {
      response?: unknown;
      partySize?: unknown;
      transportationHelpRequested?: unknown;
      accessibilityNote?: unknown;
    };
    const response = String(body.response) as ServiceSignupStatus;
    if (!allowedResponses.includes(response as (typeof allowedResponses)[number])) {
      throw new Error("Choose a valid service response.");
    }
    const partySize = Math.max(1, Math.min(25, Math.round(Number(body.partySize ?? 1))));
    const accessibilityNote =
      typeof body.accessibilityNote === "string"
        ? body.accessibilityNote.replace(/\s+/g, " ").trim().slice(0, 1000) || null
        : null;

    if (viewer.demo) {
      return Response.json({ response, partySize, demo: true });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("service_opportunity_signups")
      .upsert(
        {
          opportunity_id: opportunityId,
          profile_id: viewer.id,
          status: response,
          party_size: partySize,
          transportation_help_requested: body.transportationHelpRequested === true,
          accessibility_note: accessibilityNote,
        },
        { onConflict: "opportunity_id,profile_id" },
      )
      .select("status,party_size")
      .single();
    if (error) throw new Error("Your service response could not be saved.");

    return Response.json({ response: data.status, partySize: data.party_size });
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error ? error.message : "The service response could not be saved.",
      },
      { status: 400 },
    );
  }
}
