import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

function dynamicClient(client: Awaited<ReturnType<typeof createClient>>): SupabaseClient {
  return client as unknown as SupabaseClient;
}

function text(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().slice(0, maximum);
  return normalized || null;
}

export async function GET() {
  const viewer = await getViewer();
  if (!viewer || viewer.demo) {
    return NextResponse.json({ message: "A real signed-in member account is required." }, { status: 401 });
  }
  const client = dynamicClient(await createClient());
  const { data, error } = await client.rpc("list_recovery_access_options");
  if (error) {
    return NextResponse.json({ message: "Recovery access options could not be loaded." }, { status: 503 });
  }
  return NextResponse.json({
    programs: ((data ?? []) as Row[]).map((row) => ({
      id: String(row.program_id),
      displayName: String(row.display_name),
      publicSummary: String(row.public_summary),
      meetingDay: typeof row.meeting_day === "string" ? row.meeting_day : undefined,
      programType: String(row.program_type),
      officialProgramConfirmation: row.official_program_confirmation === true,
      acceptingAccessRequests: row.accepting_access_requests === true,
      requestStatus:
        typeof row.current_request_status === "string" ? row.current_request_status : undefined,
      isCurrentMember: row.is_current_member === true,
    })),
  });
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer || viewer.demo) {
    return NextResponse.json({ message: "A real signed-in member account is required." }, { status: 401 });
  }
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }
  const row = body as Row;
  const action = text(row.action, 40);
  const programId = text(row.programId, 80);
  if (!programId) return NextResponse.json({ message: "Choose a recovery program." }, { status: 400 });
  const client = dynamicClient(await createClient());

  if (action === "request") {
    if (row.privacyAgreementAccepted !== true) {
      return NextResponse.json(
        { message: "Accept the confidentiality and privacy expectations before requesting access." },
        { status: 400 },
      );
    }
    const { error } = await client.rpc("request_recovery_access", {
      p_program_id: programId,
      p_message: text(row.message, 1500),
    });
    if (error) {
      return NextResponse.json({ message: error.message || "The access request could not be submitted." }, { status: 400 });
    }
    return NextResponse.json({ message: "Your private access request was sent to approved recovery leaders." });
  }

  if (action === "withdraw") {
    const { error } = await client
      .from("recovery_access_requests")
      .update({ status: "withdrawn" })
      .eq("program_id", programId)
      .eq("profile_id", viewer.id)
      .eq("status", "pending");
    if (error) return NextResponse.json({ message: "The access request could not be withdrawn." }, { status: 400 });
    return NextResponse.json({ message: "Your pending access request was withdrawn." });
  }

  if (action === "leave") {
    const { error } = await client.rpc("leave_recovery_program", { p_program_id: programId });
    if (error) return NextResponse.json({ message: "Recovery membership could not be ended." }, { status: 400 });
    return NextResponse.json({ message: "Your private recovery membership was ended." });
  }

  return NextResponse.json({ message: "Unsupported action." }, { status: 400 });
}
