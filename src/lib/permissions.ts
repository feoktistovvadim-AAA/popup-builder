import { Role } from "@prisma/client";

export type Permission =
  | "view_popups"
  | "edit_popups"
  | "publish_popups"
  | "manage_team"
  | "org_settings";

const roleRank: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  EDITOR: 2,
  VIEWER: 1,
};

const permissionMinRole: Record<Permission, Role> = {
  view_popups: "VIEWER",
  edit_popups: "EDITOR",
  publish_popups: "EDITOR",
  manage_team: "ADMIN",
  org_settings: "ADMIN",
};

export function roleAtLeast(role: Role, required: Role) {
  return roleRank[role] >= roleRank[required];
}

export function hasPermission(role: Role, permission: Permission) {
  return roleAtLeast(role, permissionMinRole[permission]);
}
