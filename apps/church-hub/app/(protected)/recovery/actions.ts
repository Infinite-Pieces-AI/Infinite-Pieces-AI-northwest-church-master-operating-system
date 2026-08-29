"use server";

import { revalidatePath } from "next/cache";
import { requireViewer } from "@/lib/auth/viewer";
import { createDynamicClient } from "@/lib/ministry-spaces";

function text(formData: FormData, key: string, max: number, required = true): string {
  const value = String(formData.get(key) ?? "").trim().slice(0, max);
  if (required && !value) throw new Error(`${key} is required`);
  return value;
}

async function persistentViewer() {
  const viewer = await requireViewer();
  if (viewer.demo) throw new Error("This change requires a real signed-in account.");
  return viewer;
}

async function assertNoError(result: PromiseLike<{ error: { message?: string } | null }>) {
  const { error } = await result;
  if (error) throw new Error(error.message ?? "The database change failed.");
}

export async function requestRecoveryGroupAccessAction(formData: FormData) {
  const viewer = await persistentViewer();
  const groupId = text(formData, "groupId", 80);
  const db = await createDynamicClient();
  await assertNoError(
    db.from("recovery_group_memberships").upsert(
      {
        group_id: groupId,
        profile_id: viewer.id,
        membership_role: "participant",
        status: "pending",
      },
      { onConflict: "group_id,profile_id" },
    ),
  );
  revalidatePath("/recovery");
}

export async function postRecoveryDiscussionAction(formData: FormData) {
  const viewer = await persistentViewer();
  const postType = text(formData, "postType", 30);
  if (!new Set(["announcement", "reflection", "encouragement", "resource", "question"]).has(postType)) {
    throw new Error("Unsupported recovery post type.");
  }
  const db = await createDynamicClient();
  await assertNoError(
    db.from("recovery_discussion_posts").insert({
      group_id: text(formData, "groupId", 80),
      meeting_id: text(formData, "meetingId", 80, false) || null,
      created_by: viewer.id,
      post_type: postType,
      body: text(formData, "body", 5000),
      status: "active",
    }),
  );
  revalidatePath("/recovery");
}

export async function recordRecoveryCheckinAction(formData: FormData) {
  const viewer = await persistentViewer();
  const attendanceState = text(formData, "attendanceState", 30);
  if (!new Set(["registered", "present", "absent", "excused"]).has(attendanceState)) {
    throw new Error("Unsupported attendance state.");
  }
  const db = await createDynamicClient();
  await assertNoError(
    db.from("recovery_meeting_checkins").upsert(
      {
        meeting_id: text(formData, "meetingId", 80),
        profile_id: text(formData, "profileId", 80),
        attendance_state: attendanceState,
        recorded_by: viewer.id,
        recorded_at: new Date().toISOString(),
      },
      { onConflict: "meeting_id,profile_id" },
    ),
  );
  revalidatePath("/recovery");
  revalidatePath("/recovery/leader");
}

export async function createRecoveryCurriculumUnitAction(formData: FormData) {
  const viewer = await persistentViewer();
  if (!viewer.roles.some((role) => ["minister", "group_leader", "super_admin"].includes(role))) {
    throw new Error("An approved recovery leader must create curriculum units.");
  }
  const weekNumber = Number(formData.get("weekNumber") ?? 0);
  if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 104) {
    throw new Error("Week number must be between 1 and 104.");
  }
  const scriptureReferences = text(formData, "scriptureReferences", 1000, false)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 20);
  const sourceKind = text(formData, "sourceKind", 30);
  if (!new Set(["church_created", "licensed_reference"]).has(sourceKind)) {
    throw new Error("Unsupported curriculum source type.");
  }
  const db = await createDynamicClient();
  await assertNoError(
    db.from("recovery_curriculum_units").upsert(
      {
        program_id: text(formData, "programId", 80),
        week_number: weekNumber,
        title: text(formData, "title", 180),
        summary: text(formData, "summary", 3000),
        scripture_references: scriptureReferences,
        leader_outline: text(formData, "leaderOutline", 12000, false) || null,
        participant_reflection: text(formData, "participantReflection", 6000, false) || null,
        source_kind: sourceKind,
        source_reference: text(formData, "sourceReference", 500, false) || null,
        published: formData.get("published") === "on",
        created_by: viewer.id,
      },
      { onConflict: "program_id,week_number" },
    ),
  );
  revalidatePath("/recovery");
  revalidatePath("/recovery/leader");
}

export async function createRecoveryMeetingAction(formData: FormData) {
  const viewer = await persistentViewer();
  if (!viewer.roles.some((role) => ["minister", "group_leader", "super_admin"].includes(role))) {
    throw new Error("An approved recovery leader must schedule meetings.");
  }
  const startsAt = new Date(text(formData, "startsAt", 80));
  const endsAtValue = text(formData, "endsAt", 80, false);
  const endsAt = endsAtValue ? new Date(endsAtValue) : null;
  if (Number.isNaN(startsAt.getTime())) throw new Error("Enter a valid meeting start time.");
  if (endsAt && (Number.isNaN(endsAt.getTime()) || endsAt <= startsAt)) {
    throw new Error("Meeting end time must be after the start time.");
  }
  const db = await createDynamicClient();
  await assertNoError(
    db.from("recovery_meetings").insert({
      group_id: text(formData, "groupId", 80),
      curriculum_unit_id: text(formData, "curriculumUnitId", 80, false) || null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt?.toISOString() ?? null,
      status: "scheduled",
      leader_notes: text(formData, "leaderNotes", 8000, false) || null,
    }),
  );
  revalidatePath("/recovery");
  revalidatePath("/recovery/leader");
}
