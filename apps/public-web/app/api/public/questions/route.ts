import { NextResponse, type NextRequest } from "next/server";
import { publicQuestionSchema } from "@church/validation";
import { checkLocalRateLimit } from "@/lib/rate-limit";
import { submitPublicQuestion } from "@/lib/public-submissions";

export async function POST(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = checkLocalRateLimit(`question:${key}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } },
    );
  }
  const body: unknown = await request.json().catch(() => null);
  const parsed = publicQuestionSchema.safeParse(body);
  if (!parsed.success || parsed.data.website) {
    return NextResponse.json({ message: "Please check the form and try again." }, { status: 400 });
  }
  try {
    const result = await submitPublicQuestion(parsed.data);
    return NextResponse.json(
      {
        id: result.id,
        message:
          result.mode === "demo"
            ? "Demo mode accepted this question without storing personal information."
            : "Thank you. An authorized church volunteer will respond using the contact method you selected.",
      },
      { status: 202 },
    );
  } catch {
    return NextResponse.json(
      { message: "Your question could not be submitted right now." },
      { status: 503 },
    );
  }
}
