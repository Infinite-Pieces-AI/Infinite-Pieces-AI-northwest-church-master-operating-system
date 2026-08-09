import { NextResponse, type NextRequest } from "next/server";
import { prayerRequestSchema } from "@church/validation";
import { checkLocalRateLimit } from "@/lib/rate-limit";
import { submitPrayerRequest } from "@/lib/public-submissions";

export async function POST(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = checkLocalRateLimit(`prayer:${key}`, { limit: 3, windowMs: 30 * 60 * 1000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } },
    );
  }
  const body: unknown = await request.json().catch(() => null);
  const parsed = prayerRequestSchema.safeParse(body);
  if (!parsed.success || parsed.data.website) {
    return NextResponse.json({ message: "Please check the form and try again." }, { status: 400 });
  }
  try {
    const result = await submitPrayerRequest(parsed.data);
    return NextResponse.json(
      {
        id: result.id,
        message:
          result.mode === "demo"
            ? "Demo mode accepted this request without storing the prayer text."
            : parsed.data.responseRequested
              ? "Your request was sent to the restricted prayer workflow. An authorized leader may respond using the method you selected."
              : "Your request was sent to the restricted prayer workflow without creating a marketing or visitor follow-up record.",
      },
      { status: 202 },
    );
  } catch {
    return NextResponse.json(
      { message: "The prayer request could not be submitted right now." },
      { status: 503 },
    );
  }
}
