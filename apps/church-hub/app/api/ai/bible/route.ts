import { NextResponse } from "next/server";
import { aiBibleQuestionSchema } from "@church/validation";
import { assertAiRequestAllowed } from "@church/ai";
import { getViewer } from "@/lib/auth/viewer";
export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const parsed = aiBibleQuestionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Invalid question" }, { status: 400 });
  assertAiRequestAllowed({
    requestedDataClasses: ["published_weekly_lesson"],
    publishAutomatically: false,
    recipientIsMinor: viewer.roles.includes("teen"),
  });
  if (!process.env.AI_API_KEY)
    return NextResponse.json(
      { message: "The approved AI provider is disabled. No private content was sent." },
      { status: 503 },
    );
  return NextResponse.json(
    { message: "Connect the retrieval pipeline before enabling responses." },
    { status: 501 },
  );
}
