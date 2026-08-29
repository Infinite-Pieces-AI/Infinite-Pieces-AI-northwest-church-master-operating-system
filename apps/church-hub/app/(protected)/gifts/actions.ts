"use server";

import { revalidatePath } from "next/cache";
import { requireViewer } from "@/lib/auth/viewer";
import { createDynamicClient } from "@/lib/ministry-spaces";

const opportunityTypes = new Set([
  "church_need",
  "member_need",
  "service_offer",
  "item_for_sale",
  "item_free",
  "barter",
]);
const compensationTypes = new Set(["volunteer", "free", "paid", "barter"]);
const giftCategories = new Set([
  "hospitality",
  "teaching",
  "encouragement",
  "mercy",
  "service",
  "leadership",
  "administration",
  "music",
  "creative",
  "technology",
  "trades",
  "caregiving",
  "language",
  "transportation",
  "professional",
  "other",
]);

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

export async function saveGiftProfileAction(formData: FormData) {
  const viewer = await persistentViewer();
  const sharingScope = text(formData, "sharingScope", 20);
  if (!new Set(["private", "leaders", "church"]).has(sharingScope)) {
    throw new Error("Unsupported gift-profile visibility.");
  }
  const db = await createDynamicClient();
  await assertNoError(
    db.from("member_gift_profiles").upsert(
      {
        profile_id: viewer.id,
        headline: text(formData, "headline", 160, false) || null,
        service_summary: text(formData, "serviceSummary", 1200, false) || null,
        availability_notes: text(formData, "availabilityNotes", 500, false) || null,
        contact_preference: "in_app",
        sharing_scope: sharingScope,
        active: true,
      },
      { onConflict: "profile_id" },
    ),
  );
  revalidatePath("/gifts");
}

export async function addGiftAction(formData: FormData) {
  const viewer = await persistentViewer();
  const category = text(formData, "category", 40).toLowerCase();
  if (!giftCategories.has(category)) throw new Error("Unsupported gift category.");
  const experienceLevel = text(formData, "experienceLevel", 30);
  if (!new Set(["learning", "comfortable", "experienced", "expert"]).has(experienceLevel)) {
    throw new Error("Unsupported experience level.");
  }
  const db = await createDynamicClient();
  await assertNoError(
    db.from("member_gifts").upsert(
      {
        profile_id: viewer.id,
        gift_name: text(formData, "giftName", 120),
        category,
        experience_level: experienceLevel,
        willing_to_serve: formData.get("willingToServe") === "on",
        willing_to_mentor: formData.get("willingToMentor") === "on",
        willing_to_offer_paid_work: formData.get("paidWork") === "on",
        notes: text(formData, "notes", 700, false) || null,
      },
      { onConflict: "profile_id,gift_name" },
    ),
  );
  revalidatePath("/gifts");
}

export async function createGiftOpportunityAction(formData: FormData) {
  const viewer = await persistentViewer();
  const opportunityType = text(formData, "opportunityType", 40);
  const compensationType = text(formData, "compensationType", 20);
  if (!opportunityTypes.has(opportunityType)) throw new Error("Unsupported opportunity type.");
  if (!compensationTypes.has(compensationType)) throw new Error("Unsupported arrangement.");
  const price = Number(formData.get("price") ?? 0);
  if (compensationType === "paid" && (!Number.isFinite(price) || price < 0)) {
    throw new Error("Enter a valid non-negative price.");
  }
  const db = await createDynamicClient();
  await assertNoError(
    db.from("gift_opportunities").insert({
      created_by: viewer.id,
      opportunity_type: opportunityType,
      title: text(formData, "title", 180),
      description: text(formData, "description", 4000),
      category: text(formData, "category", 100),
      compensation_type: compensationType,
      price_cents: compensationType === "paid" ? Math.round(price * 100) : null,
      general_location: text(formData, "generalLocation", 180, false) || null,
      schedule_summary: text(formData, "scheduleSummary", 300, false) || null,
      visibility: "church",
      status: "open",
      moderation_status: opportunityType === "item_for_sale" ? "pending" : "approved",
    }),
  );
  revalidatePath("/gifts");
}

export async function respondToGiftOpportunityAction(formData: FormData) {
  const viewer = await persistentViewer();
  const responseType = text(formData, "responseType", 30);
  if (!new Set(["reply", "offer_help", "request_item", "question"]).has(responseType)) {
    throw new Error("Unsupported response type.");
  }
  const db = await createDynamicClient();
  await assertNoError(
    db.from("gift_opportunity_responses").insert({
      opportunity_id: text(formData, "opportunityId", 80),
      responder_id: viewer.id,
      message: text(formData, "message", 2000),
      response_type: responseType,
      private_to_creator: formData.get("privateToCreator") === "on",
      status: "active",
    }),
  );
  revalidatePath("/gifts");
}

export async function updateGiftOpportunityStatusAction(formData: FormData) {
  const viewer = await persistentViewer();
  const status = text(formData, "status", 20);
  if (!new Set(["open", "matched", "fulfilled", "closed", "cancelled"]).has(status)) {
    throw new Error("Unsupported opportunity status.");
  }
  const db = await createDynamicClient();
  await assertNoError(
    db
      .from("gift_opportunities")
      .update({ status })
      .eq("id", text(formData, "opportunityId", 80))
      .eq("created_by", viewer.id),
  );
  revalidatePath("/gifts");
}
