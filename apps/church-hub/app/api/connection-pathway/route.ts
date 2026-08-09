import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getApiViewer } from "@/lib/auth/api-viewer";
import { createClient } from "@/lib/supabase/server";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("set_enrollment"),
    status: z.enum(["active", "paused", "completed", "archived"]),
  }),
  z.object({
    action: z.literal("set_step"),
    stepKey: z.enum(["visit", "fellowship", "bible", "service"]),
    status: z.enum(["not_started", "completed", "skipped"]),
  }),
]);

export async function POST(request: NextRequest) {
  const viewer = await getApiViewer();
  if (!viewer) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  const body: unknown = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ message: "Invalid pathway update." }, { status: 400 });
  if (viewer.demo) return NextResponse.json({ mode: "demo", ...parsed.data });
  const supabase = await createClient();
  if (parsed.data.action === "set_enrollment") {
    const value = parsed.data.status;
    const { error } = await supabase
      .from("connection_pathway_enrollments")
      .upsert(
        {
          profile_id: viewer.id,
          status: value,
          paused_at: value === "paused" ? new Date().toISOString() : null,
          completed_at: value === "completed" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "profile_id" },
      );
    if (error)
      return NextResponse.json({ message: "Pathway status could not be saved." }, { status: 403 });
  } else {
    const value = parsed.data;
    const { error } = await supabase
      .from("connection_pathway_steps")
      .upsert(
        {
          profile_id: viewer.id,
          step_key: value.stepKey,
          status: value.status,
          completed_at: value.status === "completed" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "profile_id,step_key" },
      );
    if (error)
      return NextResponse.json({ message: "Pathway step could not be saved." }, { status: 403 });
  }
  return NextResponse.json({ mode: "database", ...parsed.data });
}
