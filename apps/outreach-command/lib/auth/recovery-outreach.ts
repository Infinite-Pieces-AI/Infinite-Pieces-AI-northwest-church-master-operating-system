import type { AppRole } from "@church/authorization";

const recoveryOutreachRoles = new Set<AppRole>(["minister", "super_admin"]);

export function canManageRecoveryOutreach(roles: readonly AppRole[]): boolean {
  return roles.some((role) => recoveryOutreachRoles.has(role));
}
