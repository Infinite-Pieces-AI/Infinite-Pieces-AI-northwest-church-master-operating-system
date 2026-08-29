import { NextResponse } from "next/server";
import {
  includesSensitiveMinistryQuery,
  isUrgentSafetyQuery,
  ministryDestinations,
  scoreMinistryDestinations,
} from "@/lib/ministry-navigation";
import { getViewer } from "@/lib/auth/viewer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GeminiPayload = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

function jsonText(payload: GeminiPayload): string {
  return payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
}

function parseRouteKeys(raw: string): string[] {
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as { routes?: unknown };
    return Array.isArray(parsed.routes)
      ? parsed.routes.filter((value): value is string => typeof value === "string").slice(0, 3)
      : [];
  } catch {
    return [];
  }
}

async function askGemini(query: string): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || process.env.AI_PROVIDER !== "gemini") return [];
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const catalog = ministryDestinations
    .map((destination) => `${destination.key}: ${destination.title} — ${destination.description}`)
    .join("\n");
  const prompt = `You are a navigation classifier for a private church member application.\n\nChoose up to three route keys from the approved catalog. Do not provide pastoral, medical, legal, addiction, crisis, or safeguarding advice. Do not infer a diagnosis, spiritual condition, or vulnerability. Return only JSON with the form {"routes":["key"]}.\n\nApproved catalog:\n${catalog}\n\nMember question:\n${query}`;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(8_000),
    },
  );
  if (!response.ok) return [];
  return parseRouteKeys(jsonText((await response.json()) as GeminiPayload));
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { query?: unknown } | null;
  const query = typeof body?.query === "string" ? body.query.trim().slice(0, 500) : "";
  if (!query) return NextResponse.json({ message: "Ask a navigation question" }, { status: 400 });

  if (isUrgentSafetyQuery(query)) {
    return NextResponse.json({
      source: "safety-routing",
      results: scoreMinistryDestinations("recovery prayer", 2),
      safetyMessage:
        "This sounds urgent. Church Hub is not emergency response. Call 911 for immediate danger. In the United States, call or text 988 for urgent crisis support.",
    });
  }

  const deterministic = scoreMinistryDestinations(query, 3);
  const mayUsePrivateAi =
    process.env.ALLOW_AI_PRIVATE_DATA_ACCESS === "true" &&
    process.env.AI_PROVIDER === "gemini" &&
    Boolean(process.env.GEMINI_API_KEY);
  const shouldUseGemini = mayUsePrivateAi && !includesSensitiveMinistryQuery(query);

  let selected = deterministic;
  let source = "approved-navigation-rules";
  if (shouldUseGemini) {
    try {
      const keys = await askGemini(query);
      const aiResults = keys
        .map((key) => ministryDestinations.find((destination) => destination.key === key))
        .filter((destination): destination is (typeof ministryDestinations)[number] => Boolean(destination));
      if (aiResults.length) {
        selected = aiResults;
        source = "gemini-route-classification";
      }
    } catch {
      source = "approved-navigation-rules";
    }
  }

  return NextResponse.json({
    source,
    results: selected,
    safetyMessage: null,
    aiPrivacy:
      shouldUseGemini
        ? "The navigation question was sent to the configured Gemini provider."
        : "The answer was calculated locally from the approved route catalog.",
  });
}
