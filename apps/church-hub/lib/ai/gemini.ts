const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_TIMEOUT_MS = 20_000;

export interface GeminiTextRequest {
  systemInstruction?: string;
  prompt: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: "text/plain" | "application/json";
}

export interface GeminiTextResult {
  text: string;
  model: string;
  provider: "gemini";
}

export function isGeminiEnabled(): boolean {
  return (
    process.env.AI_PROVIDER === "gemini" &&
    Boolean(process.env.GEMINI_API_KEY || process.env.AI_API_KEY)
  );
}

function apiKey(): string {
  const value = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  if (!value) throw new Error("Gemini API key is not configured");
  return value;
}

function extractText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || !candidates.length) return "";
  const content = (candidates[0] as { content?: unknown })?.content;
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

export async function generateGeminiText(request: GeminiTextRequest): Promise<GeminiTextResult> {
  if (!isGeminiEnabled()) {
    throw new Error("Gemini is disabled. Set AI_PROVIDER=gemini and configure GEMINI_API_KEY.");
  }

  const model = request.model || process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: request.prompt }] }],
    generationConfig: {
      temperature: request.temperature ?? 0.2,
      maxOutputTokens: request.maxOutputTokens ?? 700,
      responseMimeType: request.responseMimeType ?? "text/plain",
    },
  };
  if (request.systemInstruction) {
    body.systemInstruction = { parts: [{ text: request.systemInstruction }] };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey(),
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Gemini request failed with status ${response.status}`);
  }
  const text = extractText(payload);
  if (!text) throw new Error("Gemini returned an empty response");
  return { text, model, provider: "gemini" };
}

export function parseJsonText<T>(text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}
