import { NextResponse } from "next/server";
import { getPublishedSchedule } from "@/lib/published-content";
export const dynamic = "force-dynamic";
export function GET() {
  return NextResponse.json(
    { data: getPublishedSchedule(), generatedAt: new Date().toISOString() },
    { headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
