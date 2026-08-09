import { redirect } from "next/navigation";
import { hasPermission, type AppRole } from "@church/authorization";
import { createClient } from "@/lib/supabase/server";

export interface OutreachViewer {
  id: string;
  displayName: string;
  email: string;
  roles: AppRole[];
  aal: "aal1" | "aal2";
  demo: boolean;
}

const demoViewer: OutreachViewer = {
  id: "00000000-0000-4000-8000-000000000901",
  displayName: "Jordan Outreach Leader",
  email: "outreach.leader@example.invalid",
  roles: ["minister", "technical_admin"],
  aal: "aal2",
  demo: true,
};

export function isOutreachDemoModeEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO === "false") return false;
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO === "true") return true;
  return process.env.NODE_ENV !== "production";
}

async function getOutreachViewer(): Promise<OutreachViewer | null> {
  if (isOutreachDemoModeEnabled()) return demoViewer;
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

  type RoleAssignmentRow = { role: { key?: AppRole } | Array<{ key?: AppRole }> | null };
  const roles = ((assignments ?? []) as RoleAssignmentRow[])
    .map((item): AppRole | undefined =>
      Array.isArray(item.role) ? item.role[0]?.key : item.role?.key,
    )
    .filter((role: AppRole | undefined): role is AppRole => Boolean(role));

  return {
    id: userId,
    displayName: profile?.display_name ?? "Outreach Leader",
    email: profile?.email ?? String(claims.email ?? ""),
    roles,
    aal: claims.aal === "aal2" ? "aal2" : "aal1",
    demo: false,
  };
}

export async function requireOutreachViewer(): Promise<OutreachViewer> {
  const viewer = await getOutreachViewer();
  if (!viewer) redirect("/login");
  if (!hasPermission(viewer.roles, "outreach.manage")) redirect("/login?error=forbidden");
  if (!viewer.demo && viewer.aal !== "aal2") {
    const hubUrl = process.env.NEXT_PUBLIC_CHURCH_HUB_URL ?? "http://localhost:3001";
    const outreachUrl = process.env.NEXT_PUBLIC_OUTREACH_URL ?? "http://localhost:3002";
    redirect(`${hubUrl}/mfa?next=${encodeURIComponent(`${outreachUrl}/radar`)}`);
  }
  return viewer;
}
