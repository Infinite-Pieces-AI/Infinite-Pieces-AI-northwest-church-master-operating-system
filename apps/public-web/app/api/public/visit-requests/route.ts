import { NextResponse, type NextRequest } from "next/server";
import { visitRequestSchema } from "@church/validation";
import { checkLocalRateLimit } from "@/lib/rate-limit";
import { submitVisitRequest } from "@/lib/public-submissions";

export async function POST(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = checkLocalRateLimit(`visit:${key}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!limit.allowed)
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } },
    );
  const body: unknown = await request.json().catch(() => null);
  const parsed = visitRequestSchema.safeParse(body);
  if (!parsed.success || parsed.data.website)
    return NextResponse.json({ message: "Please check the form and try again." }, { status: 400 });
  try {
    const result = await submitVisitRequest(parsed.data);
    return NextResponse.json(
      {
        id: result.id,
        message:
          result.mode === "demo"
            ? "Starter/demo mode accepted this request without storing personal data. Connect Supabase before production."
            : "Thank you. An authorized volunteer will follow up using the information you provided.",
      },
      { status: 202 },
    );
  } catch {
    return NextResponse.json(
      { message: "The request could not be submitted right now." },
      { status: 503 },
    );
  }
}
