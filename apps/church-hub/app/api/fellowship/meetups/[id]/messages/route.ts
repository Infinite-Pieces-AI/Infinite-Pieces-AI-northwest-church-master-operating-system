import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getApiViewer } from "@/lib/auth/api-viewer";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  body: z.string().trim().min(1).max(2000),
  clientMessageId: z.string().trim().max(200).optional(),
});

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const viewer = await getApiViewer();
  if (!viewer) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ message: "Message is empty or too long." }, { status: 400 });
  if (viewer.demo)
    return NextResponse.json(
      { id: `message-${Date.now()}`, createdAt: new Date().toISOString(), mode: "demo" },
      { status: 201 },
    );
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fellowship_meetup_messages")
    .insert({
      meetup_id: id,
      author_profile_id: viewer.id,
      body: parsed.data.body,
      client_message_id: parsed.data.clientMessageId ?? crypto.randomUUID(),
    })
    .select("id,created_at")
    .single();
  if (error || !data)
    return NextResponse.json(
      { message: "Join the meetup before posting in its thread." },
      { status: 403 },
    );
  return NextResponse.json(
    { id: data.id, createdAt: data.created_at, mode: "database" },
    { status: 201 },
  );
}
