import { NextResponse } from "next/server";
import { getPublishedEvents } from "@/lib/published-content";
export function GET() {
  return NextResponse.json(
    { data: getPublishedEvents() },
    { headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
