import { getApiViewer } from "@/lib/auth/api-viewer";
import type { FellowshipResponse } from "@/lib/fellowship-contract";
import { createClient } from "@/lib/supabase/server";

const responses = ["interested", "going", "waitlisted", "cancelled"] as const;

export async function POST(
  request: Request,
  context: { params: Promise<{ meetupId: string }> },
) {
  try {
    const viewer = await getApiViewer();
    if (!viewer) return Response.json({ message: "Sign in is required." }, { status: 401 });
    const { meetupId } = await context.params;
    const body = (await request.json()) as { response?: unknown; partySize?: unknown };
    const response = String(body.response) as FellowshipResponse;
    if (!responses.includes(response)) throw new Error("Choose a valid response.");
    const partySize = Math.max(1, Math.min(25, Math.round(Number(body.partySize ?? 1))));

    if (viewer.demo) {
      return Response.json({ response, partySize, demo: true });
    }

    const supabase = await createClient();
    const { data: existing, error: existingError } = await supabase
      .from("fellowship_meetup_members")
      .select("id,status")
      .eq("meetup_id", meetupId)
      .eq("profile_id", viewer.id)
      .maybeSingle();
    if (existingError) throw new Error("Your current response could not be verified.");
    if (existing?.status === "host") throw new Error("The host cannot leave their own invitation.");

    const { data, error } = await supabase
      .from("fellowship_meetup_members")
      .upsert(
        {
          meetup_id: meetupId,
          profile_id: viewer.id,
          status: response,
          party_size: partySize,
        },
        { onConflict: "meetup_id,profile_id" },
      )
      .select("status,party_size")
      .single();
    if (error) throw new Error("Your response could not be saved.");

    return Response.json({ response: data.status, partySize: data.party_size });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "The response could not be saved." },
      { status: 400 },
    );
  }
}
