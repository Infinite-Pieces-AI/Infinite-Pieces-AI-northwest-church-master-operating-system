import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getApiViewer } from "@/lib/auth/api-viewer";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ status: z.enum(["going", "cancelled"]), partySize: z.number().int().min(1).max(20).default(1), transportationNote: z.string().trim().max(500).optional(), accessibilityNote: z.string().trim().max(500).optional() });

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const viewer = await getApiViewer();
  if (!viewer) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Check the shift response." }, { status: 400 });
  if (viewer.demo) return NextResponse.json({ status: parsed.data.status, count: null, mode: "demo" });
  const supabase = await createClient();
  const { data, error } = await supabase.from("service_shift_signups").upsert({ shift_id: id, profile_id: viewer.id, status: parsed.data.status, party_size: parsed.data.partySize, transportation_note: parsed.data.transportationNote || null, accessibility_note: parsed.data.accessibilityNote || null, updated_at: new Date().toISOString() }, { onConflict: "shift_id,profile_id" }).select("status").single();
  if (error || !data) return NextResponse.json({ message: "The service shift response could not be saved." }, { status: 403 });
  const { data: count } = await supabase.rpc("service_shift_signup_count", { requested_shift_id: id });
  return NextResponse.json({ status: data.status, count: Number(count ?? 0), mode: "database" });
}
