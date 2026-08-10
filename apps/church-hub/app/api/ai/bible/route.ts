import { NextResponse } from "next/server";
import { assertAiRequestAllowed, buildBibleCompanionSystemPrompt } from "@church/ai";
import { getViewer } from "@/lib/auth/viewer";
import { generateGeminiText, isGeminiEnabled } from "@/lib/ai/gemini";

function normalizeReference(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const reference = value.trim().replace(/\s+/g, " ").slice(0, 160);
  return reference.length >= 2 ? reference : null;
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ message: "Sign in is required." }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const verse = normalizeReference(
    body && typeof body === "object" ? (body as { verse?: unknown }).verse : null,
  );
  if (!verse) {
    return NextResponse.json({ message: "Choose a valid Scripture reference." }, { status: 400 });
  }

  try {
    assertAiRequestAllowed({
      requestedDataClasses: [],
      publishAutomatically: false,
      recipientIsMinor: viewer.roles.includes("teen"),
    });
  } catch {
    return NextResponse.json(
      { message: "This AI study companion is not enabled for independent minor accounts." },
      { status: 403 },
    );
  }

  if (viewer.demo) {
    return NextResponse.json(
      {
        message:
          "Live Gemini responses are disabled in local preview mode. Sign in through the configured production backend to use the AI study companion.",
      },
      { status: 503 },
    );
  }
  if (!isGeminiEnabled()) {
    return NextResponse.json(
      {
        message:
          "Gemini is not configured for this environment. An administrator must set the server-only AI provider and key before this button can generate content.",
      },
      { status: 503 },
    );
  }

  try {
    const result = await generateGeminiText({
      systemInstruction: buildBibleCompanionSystemPrompt(),
      prompt: [
        `Selected passage reference: ${verse}.`,
        "Provide exactly three short sentences of historical, cultural, or linguistic background that could help an adult reader understand the setting.",
        "Do not quote or recreate copyrighted Bible text, do not claim to establish doctrine, and do not invent a church position.",
        "Use careful language when historical details are uncertain and keep the answer readable for a general audience.",
      ].join(" "),
      temperature: 0.15,
      maxOutputTokens: 320,
    });
    return NextResponse.json({ text: result.text, mode: "gemini", model: result.model });
  } catch {
    return NextResponse.json(
      { message: "Gemini context is temporarily unavailable. Try again later." },
      { status: 503 },
    );
  }
}
