import type { ExpandedMinistryDestination } from "@church/church-content";

const DEFAULT_MODEL = "gemini-2.5-flash";

export function isPublicGeminiGuideEnabled(): boolean {
  return (
    process.env.AI_PROVIDER === "gemini" &&
    Boolean(process.env.GEMINI_API_KEY || process.env.AI_API_KEY)
  );
}

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  if (!key) throw new Error("Gemini API key is not configured");
  return key;
}

function extractText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || !candidates.length) return "";
  const content = (candidates[0] as { content?: unknown }).content;
  if (!content || typeof content !== "object") return "";
  const parts = (content as { parts?: unknown }).parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .map((part) =>
      part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string"
        ? String((part as { text: string }).text)
        : "",
    )
    .join("")
    .trim();
}

interface GuideSelection {
  destinationIds: string[];
  explanation: string;
}

export async function generatePublicGuideSelection(input: {
  query: string;
  destinations: readonly ExpandedMinistryDestination[];
}): Promise<GuideSelection> {
  if (!isPublicGeminiGuideEnabled()) throw new Error("Gemini guide is not configured");
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const destinationText = input.destinations
    .map(
      (destination) =>
        `${destination.id}: ${destination.title} — ${destination.description} (${destination.href})`,
    )
    .join("\n");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey(),
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: [
              "You are a route-selection assistant for the public Boston Church Lowell website.",
              "Choose only from the supplied approved destination IDs.",
              "Do not infer vulnerability, religious belief, diagnosis, identity, or private facts.",
              "Do not give pastoral, emergency, legal, medical, treatment, or safeguarding advice.",
              "For recovery questions, route only to approved church information or official treatment-resource pages.",
              "Return JSON only: destinationIds (one to three IDs) and explanation (one plain-language sentence).",
            ].join(" "),
          },
        ],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Visitor question:\n${input.query}\n\nApproved destinations:\n${destinationText}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 300,
        responseMimeType: "application/json",
      },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}`);
  const text = extractText(payload)
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  const parsed = JSON.parse(text) as Partial<GuideSelection>;
  const allowed = new Set(input.destinations.map((destination) => destination.id));
  const destinationIds = Array.isArray(parsed.destinationIds)
    ? parsed.destinationIds
        .filter((id): id is string => typeof id === "string" && allowed.has(id))
        .slice(0, 3)
    : [];
  if (!destinationIds.length) throw new Error("Gemini did not select an approved destination");
  return {
    destinationIds,
    explanation:
      typeof parsed.explanation === "string" && parsed.explanation.trim()
        ? parsed.explanation.trim().slice(0, 400)
        : "These approved pages best match the question you entered.",
  };
}
