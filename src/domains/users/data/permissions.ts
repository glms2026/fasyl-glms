import type { PermissionGroup } from "../types";

/**
 * Permission catalogue rendered by the assignment matrix.
 *
 * The backend exposes no standalone permission-catalogue endpoint — the
 * names here mirror the permissions seeded by `PermissionInitializer` in
 * `glms-backend`, and `GET /api/roles/{roleId}/permissions` is the live
 * source of truth for what a role actually holds. The create-user and
 * role-assignment forms submit these exact names, which the backend
 * validates with `permissionRepository.findByNameIgnoreCase`.
 */
export const permissionGroups: PermissionGroup[] = [
  {
    key: "user-management",
    label: "User management",
    description: "Create, update and control access to accounts.",
    permissions: [
      {
        key: "USER_CREATE",
        label: "Create users",
        description: "Create a new user",
      },
      {
        key: "USER_UPDATE",
        label: "Update users",
        description: "Update an existing user",
      },
      {
        key: "USER_DELETE",
        label: "Delete users",
        description: "Delete or permanently remove a user account",
      },
      {
        key: "USER_ACTIVATE",
        label: "Activate accounts",
        description: "Approve and activate a controlled user action",
      },
      {
        key: "USER_DEACTIVATE",
        label: "Deactivate accounts",
        description: "Deactivate a user account",
      },
      {
        key: "USER_SUSPEND",
        label: "Suspend accounts",
        description: "Suspend a user account",
      },
      {
        key: "USER_UNSUSPEND",
        label: "Unsuspend accounts",
        description: "Remove suspension from a user account",
      },
      {
        key: "USER_LOCK",
        label: "Lock accounts",
        description: "Lock a user account",
      },
      {
        key: "USER_UNLOCK",
        label: "Unlock accounts",
        description: "Unlock a locked user account",
      },
      {
        key: "PASSWORD_RESET",
        label: "Reset passwords",
        description: "Reset a user's password",
      },
    ],
  },
  {
    key: "roles-access",
    label: "Roles & access",
    description: "Role membership and role permission configuration.",
    permissions: [
      {
        key: "ASSIGN_ROLE",
        label: "Assign roles",
        description: "Assign roles to users",
      },
      {
        key: "ASSIGN_PERMISSION",
        label: "Assign permissions",
        description: "Assign permissions to a role",
      },
      {
        key: "REMOVE_PERMISSION",
        label: "Remove permissions",
        description: "Remove permissions from a role",
      },
      {
        key: "ROLE_ASSIGN_PERMISSION",
        label: "Manage role access",
        description: "Assign roles and permissions to users",
      },
      {
        key: "UPDATE_PERMISSION",
        label: "Update permissions",
        description: "Update role or permission configuration",
      },
    ],
  },
  {
    key: "ledgers",
    label: "General ledger",
    description: "Access to ledger accounts and the chart of accounts.",
    permissions: [
      {
        key: "LEDGER_CREATE",
        label: "Create ledgers",
        description: "Create a ledger",
      },
      {
        key: "LEDGER_READ",
        label: "View ledgers",
        description: "View ledgers",
      },
      {
        key: "LEDGER_UPDATE",
        label: "Update ledgers",
        description: "Update a ledger",
      },
    ],
  },
  {
    key: "audit",
    label: "Audit",
    description: "Audit trail visibility and exports.",
    permissions: [
      {
        key: "AUDIT_VIEW",
        label: "View audit logs",
        description: "View audit logs",
      },
      {
        key: "AUDIT_EXPORT",
        label: "Export audit logs",
        description: "Export audit logs",
      },
    ],
  },
];

/** Every permission name, flattened — handy for "select all" behaviour. */
export const allPermissionKeys = permissionGroups.flatMap((group) =>
  group.permissions.map((permission) => permission.key),
);

/**
 * The roles the backend seeds (see `PermissionInitializer`), offered as
 * suggestions for the role pickers. The live role list comes from
 * `GET /api/roles`; this is the offline fallback while it loads.
 */
export const knownRoles = ["ADMIN", "CONTROL", "AUTHORIZER", "CREATOR"] as const;

/**
 * Starting permissions for each known role, mirroring the backend's seeded
 * role → permission mapping exactly (ADMIN receives everything).
 */
export const rolePermissionPresets: Record<string, string[]> = {
  ADMIN: allPermissionKeys,
  CONTROL: [
    "USER_CREATE",
    "USER_UPDATE",
    "USER_DEACTIVATE",
    "USER_SUSPEND",
    "USER_LOCK",
    "USER_UNSUSPEND",
    "ROLE_ASSIGN_PERMISSION",
    "UPDATE_PERMISSION",
    "ASSIGN_ROLE",
    "ASSIGN_PERMISSION",
    "REMOVE_PERMISSION",
  ],
  AUTHORIZER: ["USER_ACTIVATE"],
  CREATOR: ["LEDGER_CREATE", "LEDGER_READ", "LEDGER_UPDATE"],
};
