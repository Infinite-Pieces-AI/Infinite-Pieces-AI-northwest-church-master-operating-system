import { NextResponse } from "next/server";
import { hasPermission } from "@church/authorization";
import {
  destinationsForScope,
  navigationSafetyNote,
  recommendMinistryDestinations,
} from "@church/church-content";
import { generateGeminiText, isGeminiEnabled, parseJsonText } from "@/lib/ai/gemini";
import { getViewer } from "@/lib/auth/viewer";

interface GeminiNavigationOutput {
  destinationIds: string[];
  explanation: string;
}

function normalizeQuestion(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const question = value.trim().replace(/\s+/g, " ").slice(0, 800);
  return question.length >= 2 ? question : null;
}

function validateOutput(value: unknown, allowed: Set<string>): GeminiNavigationOutput {
  if (!value || typeof value !== "object") throw new Error("Invalid navigation output");
  const row = value as Record<string, unknown>;
  const destinationIds = Array.isArray(row.destinationIds)
    ? row.destinationIds
        .filter((id): id is string => typeof id === "string" && allowed.has(id))
        .slice(0, 3)
    : [];
  const explanation =
    typeof row.explanation === "string" ? row.explanation.trim().slice(0, 500) : "";
  if (!destinationIds.length || !explanation) throw new Error("Invalid navigation output");
  return { destinationIds, explanation };
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ message: "Sign in is required." }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const question = normalizeQuestion(
    body && typeof body === "object" ? (body as { question?: unknown }).question : null,
  );
  if (!question) {
    return NextResponse.json({ message: "Describe what you are trying to find." }, { status: 400 });
  }

  const includePrivileged =
    hasPermission(viewer.roles, "content.draft") ||
    hasPermission(viewer.roles, "outreach.manage") ||
    hasPermission(viewer.roles, "moderation.review");
  const destinations = destinationsForScope("member", includePrivileged);
  const safetyNote = navigationSafetyNote(question);
  const deterministic = recommendMinistryDestinations({
    query: question,
    scope: "member",
    includePrivileged,
    limit: 3,
  });

  if (isGeminiEnabled() && !safetyNote) {
    try {
      const allowed = new Set(destinations.map((destination) => destination.id));
      const result = await generateGeminiText({
        systemInstruction: [
          "You are a route-selection assistant inside an authenticated church member application.",
          "Choose only from the supplied approved destination IDs.",
          "Do not infer loneliness, vulnerability, beliefs, mental state, diagnosis, family status, or private facts.",
          "Do not give emergency, safeguarding, legal, medical, or pastoral decisions.",
          "Return JSON only with destinationIds (one to three IDs) and explanation (one sentence).",
        ].join(" "),
        prompt: [
          `Member question: ${question}`,
          "Approved destinations:",
          ...destinations.map(
            (destination) => `${destination.id}: ${destination.title} — ${destination.description}`,
          ),
        ].join("\n"),
        temperature: 0,
        maxOutputTokens: 320,
        responseMimeType: "application/json",
      });
      const selection = validateOutput(parseJsonText<unknown>(result.text), allowed);
      const recommendations = selection.destinationIds.flatMap((id) => {
        const destination = destinations.find((row) => row.id === id);
        return destination ? [{ destination, explanation: selection.explanation }] : [];
      });
      if (recommendations.length) {
        return NextResponse.json({
          mode: "gemini",
          model: result.model,
          safetyNote: null,
          recommendations,
        });
      }
    } catch {
      // Approved deterministic navigation remains available if the provider is unavailable.
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
