import type { AppRole } from "@church/authorization";
import { createClient } from "@/lib/supabase/server";

const privilegedRecoveryRoles = new Set<AppRole>(["minister", "safety_admin", "super_admin"]);

export function hasPrivilegedRecoveryRole(roles: readonly AppRole[]): boolean {
  return roles.some((role) => privilegedRecoveryRoles.has(role));
}

export async function isRecoveryLeader(
  viewerId: string,
  roles: readonly AppRole[],
  demo = false,
): Promise<boolean> {
  if (hasPrivilegedRecoveryRole(roles)) return true;
  if (
    demo ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return false;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recovery_memberships")
    .select("id")
    .eq("profile_id", viewerId)
    .in("membership_role", ["leader", "admin"])
    .is("ended_at", null)
    .limit(1)
    .maybeSingle();
  return !error && Boolean(data);
}
