import { redirect } from "next/navigation";
import type { AppRole } from "@church/authorization";
import { createClient } from "@/lib/supabase/server";

export interface Viewer {
  id: string;
  displayName: string;
  email: string;
  roles: AppRole[];
  aal: "aal1" | "aal2";
  demo: boolean;
}

const demoViewer: Viewer = {
  id: "00000000-0000-4000-8000-000000000001",
  displayName: "Jordan Member",
  email: "jordan.member@example.invalid",
  roles: [
    "member",
    "verified_guardian",
    "group_leader",
    "content_editor",
    "minister",
    "moderator",
    "safety_admin",
    "technical_admin"
  ],
  aal: "aal2",
  demo: true
};

/**
 * Demo mode is intentionally automatic in local development so designers and
 * ministry leaders can review the entire Church Hub before Supabase is set up.
 * Production remains secure by default: demo access is only enabled there when
 * NEXT_PUBLIC_ENABLE_DEMO is explicitly set to "true".
 */
export function isDemoModeEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO === "false") return false;
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO === "true") return true;
  return process.env.NODE_ENV !== "production";
}

export async function getViewer(): Promise<Viewer | null> {
  if (isDemoModeEnabled()) return demoViewer;
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  if (error || !userId) return null;

  const [{ data: profile }, { data: assignments }] = await Promise.all([
    supabase.from("profiles").select("display_name,email").eq("id", userId).maybeSingle(),
    supabase
      .from("role_assignments")
      .select("role:roles(key)")
      .eq("user_id", userId)
      .is("revoked_at", null)
  ]);

  type RoleAssignmentRow = {
    role: { key?: AppRole } | Array<{ key?: AppRole }> | null;
  };
  const roles = ((assignments ?? []) as RoleAssignmentRow[])
    .map((item): AppRole | undefined =>
      Array.isArray(item.role) ? item.role[0]?.key : item.role?.key
    )
    .filter((role: AppRole | undefined): role is AppRole => Boolean(role));

  return {
    id: userId,
    displayName: profile?.display_name ?? "Member",
    email: profile?.email ?? String(data.claims.email ?? ""),
    roles: roles.length ? roles : ["member"],
    aal: data.claims.aal === "aal2" ? "aal2" : "aal1",
    demo: false
  };
}

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) {
    redirect("/login");
    throw new Error("Unreachable after redirect");
  }
  return viewer;
}
