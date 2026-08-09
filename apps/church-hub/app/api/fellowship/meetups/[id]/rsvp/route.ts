import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getApiViewer } from "@/lib/auth/api-viewer";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  status: z.enum(["interested", "going", "cancelled"]),
  partySize: z.number().int().min(1).max(25).default(1),
});

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const viewer = await getApiViewer();
  if (!viewer) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Invalid response." }, { status: 400 });
  if (viewer.demo)
    return NextResponse.json({ status: parsed.data.status, attendeeCount: null, mode: "demo" });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fellowship_meetup_members")
    .upsert(
      {
        meetup_id: id,
        profile_id: viewer.id,
        status: parsed.data.status,
        party_size: parsed.data.partySize,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "meetup_id,profile_id" },
    )
    .select("status")
    .single();
  if (error || !data)
    return NextResponse.json({ message: "Your response could not be saved." }, { status: 403 });
  const { data: count } = await supabase.rpc("fellowship_meetup_attendee_count", {
    requested_meetup_id: id,
  });
  return NextResponse.json({
    status: data.status,
    attendeeCount: Number(count ?? 0),
    mode: "database",
  });
}
