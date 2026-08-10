import { NextResponse } from "next/server";
import { assertAiRequestAllowed, buildBibleCompanionSystemPrompt } from "@church/ai";
import { getApiViewer } from "@/lib/auth/api-viewer";
import { generateGeminiText, isGeminiEnabled } from "@/lib/ai/gemini";

function normalizeReference(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const reference = value.trim().replace(/\s+/g, " ").slice(0, 160);
  return reference.length >= 2 ? reference : null;
}

export async function POST(request: Request) {
  const viewer = await getApiViewer();
  if (!viewer) return NextResponse.json({ message: "Sign in is required." }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const verse = normalizeReference(
    body && typeof body === "object" ? (body as { verse?: unknown }).verse : null,
  );
  if (!verse) {
    return NextResponse.json({ message: "Choose a valid Scripture reference." }, { status: 400 });
  }

  assertAiRequestAllowed({ requestedDataClasses: [], publishAutomatically: false });

  if (viewer.demo || !isGeminiEnabled()) {
    return NextResponse.json({
      mode: "demo",
      text: `This synthetic demo shows where a concise historical and cultural note for ${verse} will appear. When Gemini is enabled, the server sends only the selected reference and tightly scoped study instructions—never private prayer, child, counseling, attendance, or safeguarding data. Important background claims should still be checked against licensed Scripture and minister-approved study resources.`,
    });
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
