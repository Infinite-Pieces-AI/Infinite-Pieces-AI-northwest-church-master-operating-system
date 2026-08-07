import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { thisWeekData } from "@/lib/demo-data";

export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  if (viewer.demo) {
    return NextResponse.json({
      data: thisWeekData,
      viewer: {
        id: viewer.id,
        displayName: viewer.displayName,
        roles: viewer.roles,
        demo: true,
      },
    });
  }

  const supabase = await createClient();
  const referenceDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const { data, error } = await supabase.rpc("get_my_this_week", {
    p_reference_date: referenceDate,
  });

  if (error || !data) {
    return NextResponse.json(
      { message: "The weekly dashboard is temporarily unavailable." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    data,
    viewer: {
      id: viewer.id,
      displayName: viewer.displayName,
      roles: viewer.roles,
      demo: false,
    },
  });
}
