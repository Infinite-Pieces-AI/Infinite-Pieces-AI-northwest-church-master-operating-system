
import { NextResponse } from "next/server";
import { generateRotationProposal, type RotationInput } from "@church/group-rotation";
import { hasPermission } from "@church/authorization";
import { rotationInputSchema } from "@church/validation";
import { getViewer } from "@/lib/auth/viewer";

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!hasPermission(viewer.roles, "group.manage_assigned")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const parsed = rotationInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid rotation input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const proposal = generateRotationProposal(parsed.data as RotationInput);
  return NextResponse.json({
    data: proposal,
    persisted: false,
    approvalRequired: true,
    warning:
      "This endpoint creates a review-only proposal. It never activates memberships or notifies members."
  });
}
