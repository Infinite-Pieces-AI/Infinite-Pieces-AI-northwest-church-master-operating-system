import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth/viewer";
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    configured: Boolean(process.env.PLANNING_CENTER_APP_ID && process.env.PLANNING_CENTER_SECRET),
    systemOfRecord: "planning-center-or-approved-chms",
    mode: "read-through-mirror",
  });
}
