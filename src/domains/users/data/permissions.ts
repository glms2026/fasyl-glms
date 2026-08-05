import type { PermissionGroup, UserRole } from "../types";

/**
 * Permission catalogue rendered by the assignment matrix.
 *
 * The backend doesn't return permissions yet. When it does, replace this
 * constant with a fetched list — the matrix component already renders
 * whatever groups it's given.
 */
export const permissionGroups: PermissionGroup[] = [
  {
    key: "ledger",
    label: "General ledger",
    description: "Access to GL accounts and the chart of accounts.",
    permissions: [
      {
        key: "gl.view",
        label: "View GL accounts",
        description: "Read ledger accounts and balances.",
      },
      {
        key: "gl.create",
        label: "Create GL accounts",
        description: "Open new ledger accounts.",
      },
      {
        key: "gl.edit",
        label: "Edit GL accounts",
        description: "Amend account details and classifications.",
      },
      {
        key: "gl.close",
        label: "Close GL accounts",
        description: "Deactivate accounts with a zero balance.",
      },
    ],
  },
  {
    key: "transactions",
    label: "Transactions",
    description: "Journal entries and postings.",
    permissions: [
      {
        key: "txn.view",
        label: "View transactions",
        description: "Read journal entries and postings.",
      },
      {
        key: "txn.post",
        label: "Post entries",
        description: "Submit journal entries for approval.",
      },
      {
        key: "txn.approve",
        label: "Approve entries",
        description: "Authorise entries submitted by others.",
      },
      {
        key: "txn.reverse",
        label: "Reverse entries",
        description: "Reverse a posted entry with an audit note.",
      },
    ],
  },
  {
    key: "users",
    label: "User management",
    description: "Accounts, roles and access control.",
    permissions: [
      {
        key: "users.view",
        label: "View users",
        description: "Browse the user directory.",
      },
      {
        key: "users.create",
        label: "Create users",
        description: "Add accounts and assign a starting role.",
      },
      {
        key: "users.edit",
        label: "Edit users",
        description: "Change details, roles and permissions.",
      },
      {
        key: "users.lock",
        label: "Lock and suspend",
        description: "Temporarily or indefinitely block access.",
      },
      {
        key: "users.reset",
        label: "Reset passwords",
        description: "Trigger a password reset on another account.",
      },
    ],
  },
  {
    key: "reporting",
    label: "Reporting",
    description: "Statements, exports and audit history.",
    permissions: [
      {
        key: "reports.view",
        label: "View reports",
        description: "Open financial statements and summaries.",
      },
      {
        key: "reports.export",
        label: "Export reports",
        description: "Download reports as CSV or PDF.",
      },
      {
        key: "audit.view",
        label: "View audit trail",
        description: "Inspect the full history of changes.",
      },
    ],
  },
];

/** Every permission key, flattened — handy for "select all" behaviour. */
export const allPermissionKeys = permissionGroups.flatMap((group) =>
  group.permissions.map((permission) => permission.key),
);

/** Sensible starting permissions when a role is picked on the create form. */
export const rolePermissionPresets: Record<UserRole, string[]> = {
  ADMIN: allPermissionKeys,
  MAKER: ["gl.view", "gl.create", "txn.view", "txn.post", "reports.view"],
  CHECKER: [
    "gl.view",
    "txn.view",
    "txn.approve",
    "txn.reverse",
    "reports.view",
  ],
  AUDITOR: ["gl.view", "txn.view", "reports.view", "reports.export", "audit.view"],
  VIEWER: ["gl.view", "txn.view", "reports.view"],
};
