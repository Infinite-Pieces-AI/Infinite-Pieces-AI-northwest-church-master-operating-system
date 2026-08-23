import { redirect } from "next/navigation";
import { hasPermission, type Permission } from "@church/authorization";
import { requireViewer, type Viewer } from "@/lib/auth/viewer";

export async function requireAdminPermission(permission: Permission): Promise<Viewer> {
  const viewer = await requireViewer();
  if (!hasPermission(viewer.roles, permission)) redirect("/this-week?error=forbidden");
  return viewer;
}
