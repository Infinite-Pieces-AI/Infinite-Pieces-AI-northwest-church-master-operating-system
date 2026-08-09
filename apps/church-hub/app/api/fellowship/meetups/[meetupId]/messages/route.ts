import { getApiViewer } from "@/lib/auth/api-viewer";
import type { FellowshipMessageView } from "@/lib/fellowship-contract";
import { createClient } from "@/lib/supabase/server";

interface MessageRow {
  id: string;
  author_profile_id: string;
  body: string;
  created_at: string;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
}

export async function GET(_request: Request, context: { params: Promise<{ meetupId: string }> }) {
  try {
    const viewer = await getApiViewer();
    if (!viewer) return Response.json({ message: "Sign in is required." }, { status: 401 });
    const { meetupId } = await context.params;

    if (viewer.demo) {
      const messages: FellowshipMessageView[] = [
        {
          id: "demo-message-1",
          body: "Looking forward to seeing everyone. Come late or leave early if that makes joining easier.",
          authorProfileId: "demo-host",
          authorLabel: "Synthetic Host",
          createdAt: new Date(Date.now() - 60 * 60_000).toISOString(),
          mine: false,
        },
      ];
      return Response.json({ messages, demo: true });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("fellowship_meetup_messages")
      .select("id,author_profile_id,body,created_at")
      .eq("meetup_id", meetupId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw new Error("The meetup thread is not available to this account.");
    const rows = (data ?? []) as MessageRow[];
    const profileIds = [...new Set(rows.map((row) => row.author_profile_id))];
    const profiles = profileIds.length
      ? await supabase.from("profiles").select("id,display_name").in("id", profileIds)
      : { data: [] as ProfileRow[], error: null };
    if (profiles.error) throw new Error("Message authors could not be loaded.");
    const labels = new Map(
      ((profiles.data ?? []) as ProfileRow[]).map((profile) => [
        profile.id,
        profile.display_name?.trim() || "Member",
      ]),
    );
    const messages: FellowshipMessageView[] = rows.map((row) => ({
      id: row.id,
      body: row.body,
      authorProfileId: row.author_profile_id,
      authorLabel: labels.get(row.author_profile_id) ?? "Member",
      createdAt: row.created_at,
      mine: row.author_profile_id === viewer.id,
    }));
    return Response.json({ messages });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "The thread could not be loaded." },
      { status: 403 },
    );
  }
}

export async function POST(request: Request, context: { params: Promise<{ meetupId: string }> }) {
  try {
    const viewer = await getApiViewer();
    if (!viewer) return Response.json({ message: "Sign in is required." }, { status: 401 });
    const { meetupId } = await context.params;
    const body = (await request.json()) as { body?: unknown; clientMessageId?: unknown };
    const messageBody =
      typeof body.body === "string" ? body.body.replace(/\s+/g, " ").trim().slice(0, 2000) : "";
    if (!messageBody) throw new Error("Write a message before sending.");
    const clientMessageId =
      typeof body.clientMessageId === "string" ? body.clientMessageId.slice(0, 200) : null;

    if (viewer.demo) {
      const message: FellowshipMessageView = {
        id: `demo-message-${Date.now()}`,
        body: messageBody,
        authorProfileId: viewer.id,
        authorLabel: "You",
        createdAt: new Date().toISOString(),
        mine: true,
      };
      return Response.json({ message, demo: true }, { status: 201 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("fellowship_meetup_messages")
      .insert({
        meetup_id: meetupId,
        author_profile_id: viewer.id,
        body: messageBody,
        client_message_id: clientMessageId,
      })
      .select("id,author_profile_id,body,created_at")
      .single();
    if (error) throw new Error("The message could not be sent to this meetup thread.");

    const message: FellowshipMessageView = {
      id: String(data.id),
      body: String(data.body),
      authorProfileId: String(data.author_profile_id),
      authorLabel: "You",
      createdAt: String(data.created_at),
      mine: true,
    };
    return Response.json({ message }, { status: 201 });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "The message could not be sent." },
      { status: 400 },
    );
  }
}
