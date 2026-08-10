import { NextResponse } from "next/server";
import { hasPermission } from "@church/authorization";
import { getViewer } from "@/lib/auth/viewer";
import { generateGeminiText, isGeminiEnabled, parseJsonText } from "@/lib/ai/gemini";

interface ModerationOutput {
  status: "safe" | "review";
  categories: string[];
  reason: string;
  confidence: number;
}

function demoModeration(text: string): ModerationOutput {
  const normalized = text.toLowerCase();
  const urlCount = (text.match(/https?:\/\//gi) ?? []).length;
  const hostile = ["idiot", "shut up", "hate you", "stupid"].some((phrase) =>
    normalized.includes(phrase),
  );
  const spam = urlCount >= 3 || /(.)\1{9,}/.test(text);
  if (hostile || spam) {
    return {
      status: "review",
      categories: [hostile ? "hostile-language" : "spam"],
      reason:
        "The synthetic preflight found a pattern that should be reviewed by a human moderator before posting.",
      confidence: 0.82,
    };
  }
  return {
    status: "safe",
    categories: [],
    reason:
      "The synthetic preflight did not find an immediate profanity, spam, or hostile-language pattern. A human still owns the final decision.",
    confidence: 0.76,
  };
}

function validateOutput(value: unknown): ModerationOutput {
  if (!value || typeof value !== "object") throw new Error("Invalid moderation output");
  const row = value as Record<string, unknown>;
  const status = row.status === "safe" || row.status === "review" ? row.status : null;
  const categories = Array.isArray(row.categories)
    ? row.categories.filter((item): item is string => typeof item === "string").slice(0, 8)
    : [];
  const reason = typeof row.reason === "string" ? row.reason.trim().slice(0, 700) : "";
  const confidence = Number(row.confidence);
  if (!status || !reason || !Number.isFinite(confidence))
    throw new Error("Invalid moderation output");
  return {
    status,
    categories,
    reason,
    confidence: Math.max(0, Math.min(1, confidence)),
  };
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ message: "Sign in is required." }, { status: 401 });
  if (!hasPermission(viewer.roles, "moderation.review")) {
    return NextResponse.json({ message: "You do not have moderation access." }, { status: 403 });
  }

  const body: unknown = await request.json().catch(() => null);
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const text = typeof record.text === "string" ? record.text.trim().slice(0, 4000) : "";
  const contentType = record.contentType === "community_post" ? "community_post" : null;
  if (!text || !contentType) {
    return NextResponse.json(
      { message: "This preflight only accepts a non-empty community post draft." },
      { status: 400 },
    );
  }

  if (viewer.demo) {
    return NextResponse.json({ ...demoModeration(text), mode: "demo" });
  }
  if (process.env.ALLOW_AI_PRIVATE_DATA_ACCESS !== "true") {
    return NextResponse.json(
      {
        message:
          "AI moderation preflight is disabled until leadership approves the AI vendor and member-content data boundary.",
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

  try {
    const result = await generateGeminiText({
      systemInstruction: [
        "You provide an advisory language preflight for an authorized church community moderator.",
        "Review only for profanity, spam, harassment, or hostile language.",
        "Do not make safeguarding, emergency, abuse-reporting, legal, medical, pastoral, or final moderation decisions.",
        "Do not infer identity, beliefs, mental state, vulnerability, or intent beyond the supplied text.",
        "Return raw JSON only with status ('safe' or 'review'), categories (array of short strings), reason (one concise sentence), and confidence (0 to 1).",
      ].join(" "),
      prompt: `Community post draft:\n\n${text}`,
      temperature: 0,
      maxOutputTokens: 500,
      responseMimeType: "application/json",
    });
    return NextResponse.json({
      ...validateOutput(parseJsonText<unknown>(result.text)),
      mode: "gemini",
      model: result.model,
    });
  } catch {
    return NextResponse.json(
      { message: "The moderation preflight is temporarily unavailable." },
      { status: 503 },
    );
  }
}
