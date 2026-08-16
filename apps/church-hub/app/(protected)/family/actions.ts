"use server";

import { revalidatePath } from "next/cache";
import { requireViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

function requiredText(formData: FormData, key: string, max: number): string {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(`${key} is required`);
  return value.slice(0, max);
}

async function requirePersistentViewer() {
  const viewer = await requireViewer();
  if (viewer.demo) throw new Error("Persistent family changes require a real signed-in account.");
  return viewer;
}

async function requireGuardianAccess(input: {
  childId: string;
  viewerId: string;
  permission: "manage" | "pickup";
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guardian_links")
    .select("id,can_manage_profile,can_authorize_pickup")
    .eq("child_id", input.childId)
    .eq("guardian_profile_id", input.viewerId)
    .is("ends_at", null)
    .maybeSingle();
  if (error) throw error;
  const allowed =
    input.permission === "manage" ? data?.can_manage_profile : data?.can_authorize_pickup;
  if (!data || !allowed) throw new Error("You do not have permission for this child record.");
}

export async function updateHouseholdNameAction(formData: FormData) {
  const viewer = await requirePersistentViewer();
  const householdId = requiredText(formData, "householdId", 80);
  const name = requiredText(formData, "name", 120);
  const supabase = await createClient();
  const { data: membership, error: membershipError } = await supabase
    .from("household_members")
    .select("id,is_primary_contact")
    .eq("household_id", householdId)
    .eq("profile_id", viewer.id)
    .is("ended_at", null)
    .maybeSingle();
  if (membershipError) throw membershipError;
  if (!membership?.is_primary_contact) {
    throw new Error("Only an active household primary contact may rename the household.");
  }
  const { error } = await supabase.from("households").update({ name }).eq("id", householdId);
  if (error) throw error;
  revalidatePath("/family");
  revalidatePath("/family/household");
}

export async function addAuthorizedPickupAction(formData: FormData) {
  const viewer = await requirePersistentViewer();
  const childId = requiredText(formData, "childId", 80);
  const displayName = requiredText(formData, "displayName", 120);
  const relationshipLabel = String(formData.get("relationshipLabel") ?? "")
    .trim()
    .slice(0, 120);
  const phoneLastFour = String(formData.get("phoneLastFour") ?? "").trim();
  if (phoneLastFour && !/^\d{4}$/.test(phoneLastFour)) {
    throw new Error("Phone verification must be the final four digits only.");
  }
  await requireGuardianAccess({ childId, viewerId: viewer.id, permission: "pickup" });
  const supabase = await createClient();
  const { error } = await supabase.from("authorized_pickups").insert({
    child_id: childId,
    display_name: displayName,
    relationship_label: relationshipLabel || null,
    phone_last_four: phoneLastFour || null,
    active: true,
    authorized_by_guardian: viewer.id,
  });
  if (error) throw error;
  revalidatePath("/family");
  revalidatePath("/family/pickup");
}

export async function setAuthorizedPickupStatusAction(formData: FormData) {
  const viewer = await requirePersistentViewer();
  const pickupId = requiredText(formData, "pickupId", 80);
  const active = String(formData.get("active") ?? "") === "true";
  const supabase = await createClient();
  const { data: pickup, error: pickupError } = await supabase
    .from("authorized_pickups")
    .select("id,child_id")
    .eq("id", pickupId)
    .maybeSingle();
  if (pickupError) throw pickupError;
  if (!pickup) throw new Error("Pickup record not found.");
  await requireGuardianAccess({
    childId: String(pickup.child_id),
    viewerId: viewer.id,
    permission: "pickup",
  });
  const { error } = await supabase.from("authorized_pickups").update({ active }).eq("id", pickupId);
  if (error) throw error;
  revalidatePath("/family");
  revalidatePath("/family/pickup");
}

const mediaScopes = new Set([
  "private_household",
  "private_class_album",
  "private_parent_community",
  "internal_church_presentation",
  "public_website",
  "official_social_media",
  "promotional_advertising",
]);

export async function setMediaPermissionAction(formData: FormData) {
  const viewer = await requirePersistentViewer();
  const childId = requiredText(formData, "childId", 80);
  const scope = requiredText(formData, "scope", 80);
  const granted = String(formData.get("granted") ?? "") === "true";
  const notes = String(formData.get("notes") ?? "")
    .trim()
    .slice(0, 500);
  if (!mediaScopes.has(scope)) throw new Error("Unsupported media-permission scope.");
  await requireGuardianAccess({ childId, viewerId: viewer.id, permission: "manage" });
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error: revokeError } = await supabase
    .from("media_permissions")
    .update({ revoked_at: now })
    .eq("child_id", childId)
    .eq("scope", scope)
    .is("revoked_at", null);
  if (revokeError) throw revokeError;
  const { error } = await supabase.from("media_permissions").insert({
    child_id: childId,
    scope,
    granted,
    granted_by_guardian: viewer.id,
    effective_from: now,
    notes: notes || null,
  });
  if (error) throw error;
  revalidatePath("/family");
  revalidatePath("/family/media-consent");
}
