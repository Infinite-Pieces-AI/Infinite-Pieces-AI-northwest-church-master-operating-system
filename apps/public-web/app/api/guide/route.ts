import { NextResponse } from "next/server";
import {
  destinationsForScope,
  navigationSafetyNote,
  recommendMinistryDestinations,
} from "@church/church-content";
import { generatePublicGuideSelection, isPublicGeminiGuideEnabled } from "@/lib/gemini-guide";

function normalizeQuestion(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const question = value.trim().replace(/\s+/g, " ").slice(0, 600);
  return question.length >= 2 ? question : null;
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const question = normalizeQuestion(
    body && typeof body === "object" ? (body as { question?: unknown }).question : null,
  );
  if (!question) {
    return NextResponse.json(
      { message: "Enter a question or describe what you are looking for." },
      { status: 400 },
    );
  }

  const safetyNote = navigationSafetyNote(question);
  const destinations = destinationsForScope("public");
  const deterministic = recommendMinistryDestinations({
    query: question,
    scope: "public",
    limit: 3,
  });

  if (isPublicGeminiGuideEnabled() && !safetyNote) {
    try {
      const selection = await generatePublicGuideSelection({ query: question, destinations });
      const selected = selection.destinationIds.flatMap((id) => {
        const destination = destinations.find((row) => row.id === id);
        return destination ? [{ destination, explanation: selection.explanation }] : [];
      });
      if (selected.length) {
        return NextResponse.json({
          mode: "gemini",
          safetyNote: null,
          recommendations: selected,
        });
      }
    } catch {
      // The deterministic approved-route engine remains available when the provider is unavailable.
    }
  }

  return NextResponse.json({
    mode: "guided",
    safetyNote,
    recommendations: deterministic.map((row) => ({
      destination: row.destination,
      explanation: row.explanation,
    })),
  });
}
