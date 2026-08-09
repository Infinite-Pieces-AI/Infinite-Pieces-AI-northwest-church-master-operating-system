import { notFound } from "next/navigation";
import { hasPermission, type Permission } from "@church/authorization";
import { requireViewer } from "./viewer";
export async function requirePermission(permission: Permission) {
  const viewer = await requireViewer();
  if (!hasPermission(viewer.roles, permission)) notFound();
  return viewer;
}
