export const appRoles = [
  "visitor",
  "applicant",
  "member",
  "verified_guardian",
  "teen",
  "group_leader",
  "kids_volunteer",
  "content_editor",
  "minister",
  "moderator",
  "safety_admin",
  "technical_admin",
  "super_admin",
] as const;

export type AppRole = (typeof appRoles)[number];

export const permissions = [
  "member.read",
  "profile.update_self",
  "channel.read_assigned",
  "channel.post_assigned",
  "event.register_self",
  "household.read_own",
  "household.manage_own",
  "child.read_linked",
  "child.manage_linked",
  "group.manage_assigned",
  "kids.read_assigned_class",
  "content.draft",
  "content.publish",
  "moderation.review",
  "moderation.act",
  "safeguarding.review",
  "system.health.read",
  "system.infrastructure.manage",
  "access.approve",
  "role.assign",
  "audit.read",
  "outreach.manage",
] as const;

export type Permission = (typeof permissions)[number];

const rolePermissions: Record<AppRole, ReadonlySet<Permission>> = {
  visitor: new Set(),
  applicant: new Set(),
  member: new Set([
    "member.read",
    "profile.update_self",
    "channel.read_assigned",
    "channel.post_assigned",
    "event.register_self",
  ]),
  verified_guardian: new Set([
    "member.read",
    "profile.update_self",
    "channel.read_assigned",
    "channel.post_assigned",
    "event.register_self",
    "household.read_own",
    "household.manage_own",
    "child.read_linked",
    "child.manage_linked",
  ]),
  teen: new Set([
    "member.read",
    "profile.update_self",
    "channel.read_assigned",
    "channel.post_assigned",
    "event.register_self",
  ]),
  group_leader: new Set([
    "member.read",
    "profile.update_self",
    "channel.read_assigned",
    "channel.post_assigned",
    "event.register_self",
    "group.manage_assigned",
  ]),
  kids_volunteer: new Set([
    "member.read",
    "profile.update_self",
    "channel.read_assigned",
    "channel.post_assigned",
    "event.register_self",
    "kids.read_assigned_class",
  ]),
  content_editor: new Set([
    "member.read",
    "profile.update_self",
    "channel.read_assigned",
    "channel.post_assigned",
    "event.register_self",
    "content.draft",
  ]),
  minister: new Set([
    "member.read",
    "profile.update_self",
    "channel.read_assigned",
    "channel.post_assigned",
    "event.register_self",
    "content.draft",
    "content.publish",
    "group.manage_assigned",
    "access.approve",
    "outreach.manage",
  ]),
  moderator: new Set([
    "member.read",
    "profile.update_self",
    "channel.read_assigned",
    "channel.post_assigned",
    "event.register_self",
    "moderation.review",
    "moderation.act",
  ]),
  safety_admin: new Set(["member.read", "safeguarding.review", "audit.read"]),
  technical_admin: new Set(["member.read", "system.health.read", "system.infrastructure.manage"]),
  super_admin: new Set(permissions),
};

export function hasPermission(roles: readonly AppRole[], permission: Permission): boolean {
  return roles.some((role) => rolePermissions[role].has(permission));
}

export function assertPermission(roles: readonly AppRole[], permission: Permission): void {
  if (!hasPermission(roles, permission)) {
    throw new AuthorizationError(permission);
  }
}

export class AuthorizationError extends Error {
  readonly permission: Permission;

  constructor(permission: Permission) {
    super(`Missing required permission: ${permission}`);
    this.name = "AuthorizationError";
    this.permission = permission;
  }
}

export const privilegedRoles: ReadonlySet<AppRole> = new Set([
  "content_editor",
  "minister",
  "moderator",
  "safety_admin",
  "technical_admin",
  "super_admin",
]);

export function requiresMfa(roles: readonly AppRole[]): boolean {
  return roles.some((role) => privilegedRoles.has(role));
}
