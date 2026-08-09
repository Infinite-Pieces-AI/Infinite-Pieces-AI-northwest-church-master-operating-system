import { NextResponse } from "next/server";
import { offlineSafeResponseHeaders } from "@church/pwa";
import { getViewer } from "@/lib/auth/viewer";
import { loadThisWeekData } from "@/lib/this-week";

export const dynamic = "force-dynamic";

export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const snapshot = await loadThisWeekData(viewer);
  if (!snapshot) {
    return NextResponse.json(
      { error: "The approved weekly lesson is temporarily unavailable." },
      { status: 503 },
    );
  }
  return NextResponse.json(
    {
      version: 1,
      generatedAt: new Date().toISOString(),
      lesson: {
        series: snapshot.lesson.series,
        title: snapshot.lesson.title,
        scriptureReference: snapshot.lesson.scripture,
        summary: snapshot.lesson.summary,
      },
      notice:
        "Licensed Bible text is not cached by this endpoint. Open the approved provider when online.",
    },
    { headers: offlineSafeResponseHeaders },
  );
}
