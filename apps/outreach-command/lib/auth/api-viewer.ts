import { hasPermission, type AppRole } from "@church/authorization";
import { createClient } from "@/lib/supabase/server";

export interface OutreachApiViewer {
  id: string;
  email: string;
  displayName: string;
  roles: AppRole[];
  aal: "aal1" | "aal2";
}

export async function getOutreachApiViewer(): Promise<OutreachApiViewer | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;
  if (error || !claims || !userId) return null;

  const [{ data: profile }, { data: assignments }] = await Promise.all([
    supabase.from("profiles").select("display_name,email").eq("id", userId).maybeSingle(),
    supabase
      .from("role_assignments")
      .select("role:roles(key)")
      .eq("user_id", userId)
      .is("revoked_at", null),
  ]);

  type RoleRow = { role: { key?: AppRole } | Array<{ key?: AppRole }> | null };
  const roles = ((assignments ?? []) as RoleRow[])
    .map((assignment): AppRole | undefined =>
      Array.isArray(assignment.role) ? assignment.role[0]?.key : assignment.role?.key,
    )
    .filter((role: AppRole | undefined): role is AppRole => Boolean(role));

  if (!hasPermission(roles, "outreach.manage")) return null;
  if (claims.aal !== "aal2") return null;

  return {
    id: userId,
    email: profile?.email ?? String(claims.email ?? ""),
    displayName: profile?.display_name ?? "Outreach Leader",
    roles,
    aal: "aal2",
  };
}
