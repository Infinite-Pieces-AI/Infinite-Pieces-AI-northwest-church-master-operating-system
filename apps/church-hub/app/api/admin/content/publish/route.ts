import { NextResponse } from "next/server";
import { z } from "zod";
import { hasPermission } from "@church/authorization";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

const commandSchema = z.object({ lessonId: z.string().uuid() });

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!hasPermission(viewer.roles, "content.publish")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const parsed = commandSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "A valid lessonId is required" }, { status: 400 });
  }

  if (viewer.demo) {
    return NextResponse.json({
      data: { id: parsed.data.lessonId, publicationStatus: "published", synthetic: true },
      audited: true,
      demo: true,
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("publish_weekly_lesson", {
    p_lesson_id: parsed.data.lessonId,
  });

  if (error) {
    return NextResponse.json(
      {
        message:
          "Publishing failed. Minister role, MFA, review state, and RLS/RPC policy are required.",
      },
      { status: 403 },
    );
  }

  return NextResponse.json({ data, audited: true });
}
