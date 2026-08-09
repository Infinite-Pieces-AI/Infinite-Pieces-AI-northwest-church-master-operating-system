import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/viewer";

const channelIdSchema = z.string().uuid();
const messageSchema = z.object({
  body: z.string().trim().min(1).max(5000),
  clientId: z.string().uuid(),
});

type RouteContext = { params: Promise<{ channelId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const parsedChannelId = channelIdSchema.safeParse((await params).channelId);
  if (!parsedChannelId.success) {
    return NextResponse.json({ message: "Invalid channel" }, { status: 400 });
  }

  if (viewer.demo) return NextResponse.json({ data: [] });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id,client_id,body,created_at,author_id")
    .eq("channel_id", parsedChannelId.data)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    return NextResponse.json({ message: "Unable to load messages" }, { status: 403 });
  }
  return NextResponse.json({ data });
}

export async function POST(request: Request, { params }: RouteContext) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const [parsedChannelId, parsedBody] = await Promise.all([
    params.then(({ channelId }) => channelIdSchema.safeParse(channelId)),
    request
      .json()
      .catch(() => null)
      .then((body) => messageSchema.safeParse(body)),
  ]);

  if (!parsedChannelId.success || !parsedBody.success) {
    return NextResponse.json({ message: "Invalid message" }, { status: 400 });
  }

  if (viewer.demo) {
    return NextResponse.json(
      {
        data: {
          id: parsedBody.data.clientId,
          client_id: parsedBody.data.clientId,
          body: parsedBody.data.body,
          synthetic: true,
        },
      },
      { status: 201 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      channel_id: parsedChannelId.data,
      author_id: viewer.id,
      body: parsedBody.data.body,
      client_id: parsedBody.data.clientId,
    })
    .select("id,client_id,body,created_at,author_id")
    .single();

  if (!error) return NextResponse.json({ data }, { status: 201 });

  // A retried mobile request may race the first insert. Return the existing row
  // only when RLS still permits the caller to read that channel.
  if (error.code === "23505") {
    const { data: existing, error: existingError } = await supabase
      .from("messages")
      .select("id,client_id,body,created_at,author_id")
      .eq("author_id", viewer.id)
      .eq("client_id", parsedBody.data.clientId)
      .maybeSingle();
    if (!existingError && existing) {
      return NextResponse.json({ data: existing, idempotentReplay: true }, { status: 200 });
    }
  }

  return NextResponse.json({ message: "Not permitted to post in this channel" }, { status: 403 });
}
