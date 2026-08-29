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

export async function createPrayerRequestAction(formData: FormData) {
  const viewer = await persistentViewer();
  const displayMode = text(formData, "displayMode", 30);
  const privacyScope = text(formData, "privacyScope", 40);
  if (!new Set(["named", "first_name", "anonymous_to_members"]).has(displayMode)) {
    throw new Error("Unsupported name-display option.");
  }
  if (!new Set(["church", "leaders_only", "requester_and_leaders"]).has(privacyScope)) {
    throw new Error("Unsupported prayer privacy option.");
  }
  const db = await createDynamicClient();
  await assertNoError(
    db.from("prayer_requests").insert({
      created_by: viewer.id,
      title: text(formData, "title", 180),
      request_text: text(formData, "requestText", 4000),
      display_mode: displayMode,
      privacy_scope: privacyScope,
      status: "open",
      allow_encouragement: formData.get("allowEncouragement") === "on",
      needs_pastoral_followup: formData.get("needsPastoralFollowup") === "on",
    }),
  );
  revalidatePath("/prayer-well");
}

export async function recordPrayerSupportAction(formData: FormData) {
  const viewer = await persistentViewer();
  const supportType = text(formData, "supportType", 30);
  if (!new Set(["prayed", "encouragement", "update"]).has(supportType)) {
    throw new Error("Unsupported prayer response.");
  }
  const message = text(formData, "message", 2000, false);
  if (supportType !== "prayed" && !message) {
    throw new Error("An encouragement or update needs a message.");
  }
  const db = await createDynamicClient();
  await assertNoError(
    db.from("prayer_support_events").insert({
      prayer_request_id: text(formData, "prayerRequestId", 80),
      profile_id: viewer.id,
      support_type: supportType,
      message: message || null,
      requester_only: formData.get("requesterOnly") === "on",
    }),
  );
  revalidatePath("/prayer-well");
}

export async function markPrayerAnsweredAction(formData: FormData) {
  const viewer = await persistentViewer();
  const requestId = text(formData, "prayerRequestId", 80);
  const db = await createDynamicClient();
  await assertNoError(
    db
      .from("prayer_requests")
      .update({
        status: "answered",
        answered_at: new Date().toISOString(),
        answer_testimony: text(formData, "answerTestimony", 4000, false) || null,
      })
      .eq("id", requestId)
      .eq("created_by", viewer.id),
  );
  revalidatePath("/prayer-well");
}

export async function archivePrayerRequestAction(formData: FormData) {
  const viewer = await persistentViewer();
  const db = await createDynamicClient();
  await assertNoError(
    db
      .from("prayer_requests")
      .update({ status: "archived" })
      .eq("id", text(formData, "prayerRequestId", 80))
      .eq("created_by", viewer.id),
  );
  revalidatePath("/prayer-well");
}
