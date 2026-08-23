import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth/viewer";
import {
  ministryRouteCatalog,
  recommendationById,
  resolveMinistryNavigation,
} from "@/lib/ministry-navigation";

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

function questionFrom(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 1000) : "";
}

async function geminiRoute(question: string): Promise<string[]> {
  const key = process.env.GEMINI_API_KEY ?? process.env.AI_API_KEY;
  const enabled =
    process.env.AI_PROVIDER === "gemini" &&
    process.env.ALLOW_AI_PRIVATE_DATA_ACCESS === "true" &&
    Boolean(key);
  if (!enabled || !key) return [];

  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const catalog = ministryRouteCatalog
    .map((route) => `${route.id}: ${route.title} — ${route.description}`)
    .join("\n");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You route an authenticated church member to existing Church Hub pages. Never infer spiritual maturity, loneliness, addiction, diagnosis, child safety, or private beliefs. Never provide pastoral, medical, legal, safeguarding, or emergency decisions. Return JSON exactly as {"routeIds":["id"]} with one to three IDs from the catalog.\n\nCATALOG\n${catalog}\n\nMEMBER QUESTION\n${question}`,
              },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(12_000),
    },
  );
  if (!response.ok) return [];
  const payload = (await response.json()) as GeminiResponse;
  const raw =
    payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  try {
    const parsed = JSON.parse(raw) as { routeIds?: unknown };
    return Array.isArray(parsed.routeIds)
      ? parsed.routeIds
          .filter((id): id is string => typeof id === "string")
          .slice(0, 3)
      : [];
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ message: "Sign in to use Church Hub navigation." }, { status: 401 });
  }
  const body: unknown = await request.json().catch(() => null);
  const question = questionFrom(
    body && typeof body === "object" ? (body as { question?: unknown }).question : null,
  );
  if (!question) {
    return NextResponse.json(
      { message: "Ask a question about where you need to go." },
      { status: 400 },
    );
  }

  const deterministic = resolveMinistryNavigation(question, 3);
  let ids: string[] = [];
  try {
    ids = await geminiRoute(question);
  } catch {
    ids = [];
  }
  const aiRoutes = ids.flatMap((id) => {
    const route = recommendationById(id);
    return route ? [route] : [];
  });
  const recommendations = (aiRoutes.length ? aiRoutes : deterministic).map(
    ({ keywords: _keywords, protected: _protected, ...route }) => route,
  );
  return NextResponse.json({
    recommendations,
    provider: aiRoutes.length ? "gemini" : "deterministic",
    notice: aiRoutes.length
      ? "Gemini improved route selection using only the question you typed. The answer was constrained to approved Hub destinations."
      : "Church Hub used its local, explainable route map. No external AI provider received your question.",
  });
}
