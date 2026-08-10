import { NextResponse } from "next/server";
import { hasPermission } from "@church/authorization";
import { getViewer } from "@/lib/auth/viewer";
import { generateGeminiText, isGeminiEnabled, parseJsonText } from "@/lib/ai/gemini";

interface RotationAssignment {
  date: string;
  role: string;
  assignedName: string;
}

function validMonth(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) return null;
  const month = Number(value.slice(5, 7));
  return month >= 1 && month <= 12 ? value : null;
}

function sundaysForMonth(month: string): string[] {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const dates: string[] = [];
  const cursor = new Date(Date.UTC(year, monthIndex, 1));
  while (cursor.getUTCMonth() === monthIndex) {
    if (cursor.getUTCDay() === 0) dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function syntheticProposal(month: string, rosterText: string): RotationAssignment[] {
  const names = rosterText
    .split("\n")
    .map((line) => line.split("|")[0]?.trim())
    .filter((value): value is string => Boolean(value));
  const safeNames = names.length ? names.slice(0, 12) : ["Jordan Member", "Casey Member"];
  const roles = ["Welcome", "Setup", "Hospitality", "Kids check-in"];
  return sundaysForMonth(month).flatMap((date, sundayIndex) =>
    roles.map((role, roleIndex) => ({
      date,
      role,
      assignedName: safeNames[(sundayIndex + roleIndex) % safeNames.length] ?? "UNASSIGNED",
    })),
  );
}

function validateProposal(value: unknown): RotationAssignment[] {
  if (!Array.isArray(value)) throw new Error("Gemini did not return a schedule array");
  return value.slice(0, 100).map((item) => {
    if (!item || typeof item !== "object") throw new Error("Invalid schedule item");
    const row = item as Record<string, unknown>;
    const date = typeof row.date === "string" ? row.date.trim().slice(0, 40) : "";
    const role = typeof row.role === "string" ? row.role.trim().slice(0, 120) : "";
    const assignedName =
      typeof row.assignedName === "string" ? row.assignedName.trim().slice(0, 120) : "";
    if (!date || !role || !assignedName) {
      throw new Error("Schedule rows require date, role, and assignedName");
    }
    return { date, role, assignedName };
  });
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ message: "Sign in is required." }, { status: 401 });
  if (!hasPermission(viewer.roles, "group.manage_assigned")) {
    return NextResponse.json(
      { message: "You do not have permission to generate rotations." },
      { status: 403 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const targetMonth = validMonth(record.targetMonth);
  const rosterText =
    typeof record.rosterText === "string" ? record.rosterText.trim().slice(0, 8000) : "";
  if (!targetMonth || !rosterText) {
    return NextResponse.json(
      { message: "Add a valid month and a reviewed roster." },
      { status: 400 },
    );
  }

  if (viewer.demo) {
    return NextResponse.json({
      schedule: syntheticProposal(targetMonth, rosterText),
      mode: "demo",
      requiresHumanApproval: true,
    });
  }

  if (process.env.ALLOW_AI_PRIVATE_DATA_ACCESS !== "true") {
    return NextResponse.json(
      {
        message:
          "AI rotation generation is disabled until leadership approves sending volunteer roster and availability data to the configured AI provider.",
      },
      { status: 403 },
    );
  }
  if (!isGeminiEnabled()) {
    return NextResponse.json(
      { message: "Gemini is not configured for this environment." },
      { status: 503 },
    );
  }

  try {
    const result = await generateGeminiText({
      systemInstruction: [
        "You are a scheduling assistant preparing a draft church volunteer rotation for authorized leadership review.",
        "Honor explicit blackout dates and stated role eligibility. Prefer fair distribution and stated serving frequency.",
        "Never invent a volunteer who is not in the roster. If nobody is eligible, use UNASSIGNED.",
        "Return raw JSON only: an array of objects with exactly date, role, and assignedName.",
        "This is a proposal only and must not be described as activated, final, or communicated to volunteers.",
      ].join(" "),
      prompt: `Target month: ${targetMonth}\n\nReviewed roster and constraints:\n${rosterText}`,
      temperature: 0.1,
      maxOutputTokens: 1800,
      responseMimeType: "application/json",
    });
    const schedule = validateProposal(parseJsonText<unknown>(result.text));
    return NextResponse.json({
      schedule,
      mode: "gemini",
      model: result.model,
      requiresHumanApproval: true,
    });
  } catch {
    return NextResponse.json(
      { message: "Gemini could not produce a valid rotation proposal." },
      { status: 503 },
    );
  }
}
