import { NextResponse } from "next/server";
import { getApiViewer } from "@/lib/auth/api-viewer";
import { generateGeminiText, isGeminiEnabled } from "@/lib/ai/gemini";
import { loadFellowshipMeetupDetail, type FellowshipResponseStatus } from "@/lib/fellowship";
import type { Viewer } from "@/lib/auth/viewer";

const participantStates: ReadonlySet<FellowshipResponseStatus> = new Set([
  "host",
  "interested",
  "going",
  "waitlisted",
]);

export async function POST(
  _request: Request,
  context: { params: Promise<{ meetupId: string }> },
) {
  const apiViewer = await getApiViewer();
  if (!apiViewer) return NextResponse.json({ message: "Sign in is required." }, { status: 401 });

  const viewer: Viewer = {
    ...apiViewer,
    displayName: apiViewer.email.split("@")[0] || "Member",
    roles: ["member"],
    aal: "aal1",
  };
  const { meetupId } = await context.params;
  const detail = await loadFellowshipMeetupDetail(viewer, meetupId).catch(() => null);
  const status = detail?.meetup.joinedStatus ?? null;
  if (!detail || !status || !participantStates.has(status)) {
    return NextResponse.json(
      { message: "Join or express interest before summarizing this participant thread." },
      { status: 403 },
    );
  }

  const recentMessages = detail.messages.slice(-50);
  if (!recentMessages.length) {
    return NextResponse.json({ text: "There are no recent meetup messages to summarize.", mode: "demo" });
  }

  if (apiViewer.demo) {
    return NextResponse.json({
      mode: "demo",
      text: "• The host asked everyone to check the thread before leaving in case plans change.\n• No new responsibility has been assigned in the synthetic demo thread.\n• Open question: confirm any final weather or meeting update before traveling.",
    });
  }

  if (process.env.ALLOW_AI_PRIVATE_DATA_ACCESS !== "true") {
    return NextResponse.json(
      {
        message:
          "AI thread summaries are disabled until church leadership approves the AI vendor and private-message data boundary.",
      },
      { status: 403 },
    );
  }
  if (!isGeminiEnabled()) {
    return NextResponse.json(
      { message: "Gemini is not configured for this environment." },
      { status: 503 },
    );
  }

  const transcript = recentMessages
    .map((message, index) => `Message ${index + 1} — ${message.authorLabel}: ${message.body}`)
    .join("\n");

  try {
    const result = await generateGeminiText({
      systemInstruction: [
        "You summarize an authorized participant-only church meetup thread for a participant who already has access.",
        "Do not infer anyone's beliefs, vulnerability, health, family status, or spiritual condition.",
        "Do not invent decisions or responsibilities. Preserve uncertainty and distinguish decisions from open questions.",
        "Return exactly three concise bullets: decisions, action items, and open questions or changes to verify.",
      ].join(" "),
      prompt: `Summarize these recent meetup messages:\n\n${transcript}`,
      temperature: 0.1,
      maxOutputTokens: 500,
    });
    return NextResponse.json({ text: result.text, mode: "gemini", model: result.model });
  } catch {
    return NextResponse.json(
      { message: "The thread summary is temporarily unavailable." },
      { status: 503 },
    );
  }
}
