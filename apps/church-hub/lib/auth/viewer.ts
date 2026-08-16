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

const localPreviewViewer: Viewer = {
  id: "00000000-0000-4000-8000-000000000001",
  displayName: "Local Preview Member",
  email: "preview@example.invalid",
  roles: [
    "member",
    "verified_guardian",
    "group_leader",
    "content_editor",
    "minister",
    "moderator",
    "safety_admin",
    "technical_admin",
  ],
  aal: "aal2",
  demo: true,
};

/**
 * Local preview access is an explicit development-only escape hatch.
 * It is never enabled automatically and can never run in a production build.
 */
export function isDemoModeEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return (
    process.env.NEXT_PUBLIC_ENABLE_DEMO === "true" &&
    process.env.ALLOW_LOCAL_PREVIEW_MODE === "true"
  );
}

export async function getViewer(): Promise<Viewer | null> {
  if (isDemoModeEnabled()) return localPreviewViewer;
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

  type RoleAssignmentRow = {
    role: { key?: AppRole } | Array<{ key?: AppRole }> | null;
  };
  const roles = ((assignments ?? []) as RoleAssignmentRow[])
    .map((item): AppRole | undefined =>
      Array.isArray(item.role) ? item.role[0]?.key : item.role?.key,
    )
    .filter((role: AppRole | undefined): role is AppRole => Boolean(role));

  return {
    id: userId,
    displayName: profile?.display_name ?? "Member",
    email: profile?.email ?? String(claims.email ?? ""),
    roles: roles.length ? roles : ["member"],
    aal: claims.aal === "aal2" ? "aal2" : "aal1",
    demo: false,
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
