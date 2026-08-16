/**
 * User management contract — mirrors the `/api/users`,
 * `/api/user-approval-requests` and `/api/roles` endpoints.
 *
 * The backend answers with bare objects (no success/data envelope) and
 * Spring `Page` shapes for list endpoints.
 */

/** Account states the backend reports. Free-form strings plus the known set. */
export const UserStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  LOCKED: "LOCKED",
  SUSPENDED: "SUSPENDED",
  PASSWORD_EXPIRED: "PASSWORD_EXPIRED",
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

/** GET /api/users/{id} → 200 — a single user as the backend returns it. */
export interface ManagedUser {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  /** Raw status string; may contain values newer than this client knows. */
  status: string;
  /** Role names, resolved to IDs through GET /api/roles. */
  roles: string[];
  active: boolean;
  failedLoginAttempts: number;
  lockoutTime: string | null;
  suspendedAt: string | null;
  suspendedBy: string | null;
  lockedAt: string | null;
  lockedBy: string | null;
  lockReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export function userFullName(
  user: Pick<ManagedUser, "firstName" | "lastName" | "username">,
): string {
  return `${user.firstName} ${user.lastName}`.trim() || user.username;
}

/** POST /api/users body. */
export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  roles: string[];
  permissions: string[];
  /** Justification for the maker-checker approval request. */
  reason: string;
}

/** PUT /api/users/{id} body. Status is optional; the rest are required. */
export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  status?: string;
}

/** Reason payload for lock / suspend / deactivate. */
export interface UserActionRequest {
  reason: string;
}

/** PATCH /api/users/{id}/roles body. */
export interface AssignRoleRequest {
  roles: string[];
  reason: string;
}

/** Spring Page wrapper returned by list endpoints. */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

/** Query params understood by the pageable endpoints. */
export interface PageRequest {
  /** 0-indexed page number. */
  page?: number;
  size?: number;
  /** Spring sort: "field,dir" e.g. "createdAt,desc". */
  sort?: string;
}

/** Actions that can flow through the maker-checker approval queue. */
export const ApprovalAction = {
  USER_CREATE: "USER_CREATE",
  USER_UPDATE: "USER_UPDATE",
  USER_READ: "USER_READ",
  USER_DEACTIVATE: "USER_DEACTIVATE",
  USER_SUSPEND: "USER_SUSPEND",
  USER_LOCK: "USER_LOCK",
  USER_UNLOCK: "USER_UNLOCK",
  USER_UNSUSPEND: "USER_UNSUSPEND",
  ROLE_ASSIGN_PERMISSION: "ROLE_ASSIGN_PERMISSION",
  ACTIVATE_USER: "ACTIVATE_USER",
  UPDATE_PERMISSION: "UPDATE_PERMISSION",
  ASSIGN_ROLE: "ASSIGN_ROLE",
  ASSIGN_PERMISSION: "ASSIGN_PERMISSION",
  REMOVE_PERMISSION: "REMOVE_PERMISSION",
} as const;

export type ApprovalActionType =
  (typeof ApprovalAction)[keyof typeof ApprovalAction];

export const ApprovalStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;

export type ApprovalStatusType =
  (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

/** GET /api/user-approval-requests/{id} → 200. */
export interface UserApprovalRequest {
  id: number;
  /** The user affected by the request; null for role-level actions. */
  userId: number | null;
  username: string | null;
  makerId: number | null;
  makerUsername: string | null;
  authorizerId: number | null;
  authorizerUsername: string | null;
  action: string;
  status: string;
  roleNames: string[];
  permissions: string[];
  reason: string | null;
  remark: string | null;
  /**
   * The backend serialises `requestedAt` into `createdAt` (and
   * `authorizedAt` into `approvedAt`/`rejectedAt`); the raw ZonedDateTime
   * fields are left null, so the UI reads these derived fields.
   */
  requestedAt: string | null;
  authorizedAt: string | null;
  createdAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
}

/** PUT /api/user-approval-requests/{id}/approve | /reject body. */
export interface ApprovalDecisionRequest {
  remark?: string;
}

/** POST /api/user-approval-requests/assign-role body. */
export interface AssignRoleApprovalRequest {
  userId: number;
  roles: string[];
  reason: string;
}

/** GET /api/roles/{roleId}/permissions → 200 item. */
export interface PermissionResponse {
  id: number;
  name: string;
  description: string | null;
}

/** GET /api/roles → 200 item — the role catalogue. */
export interface RoleResponse {
  id: number;
  name: string;
  permissions: string[];
}

/** DELETE /api/roles/{roleId}/permissions → 200. */
export interface ApiResponse {
  success: boolean;
  message: string;
}

/** POST /api/user-approval-requests query params. */
export interface CreateApprovalRequestParams {
  userId: number;
  actionType: string;
  reason: string;
}

/*
 * Presentation types — shapes the UI consumes for charts and activity.
 * These are derived client-side from the API contract above; the backend
 * exposes no analytics endpoints.
 */

export interface UserMetrics {
  total: number;
  active: number;
  suspended: number;
  locked: number;
  inactive: number;
  pendingApprovals: number;
  /** Accounts created in the last 30 days. */
  newThisMonth: number;
  /** Unique role names currently in use. */
  roleCount: number;
  /** Percentage change in total users versus 30 days ago. */
  totalChange: number;
}

export interface UserGrowthPoint {
  month: string;
  total: number;
  added: number;
}

export interface DistributionSlice {
  label: string;
  value: number;
}

/** A single toggleable capability inside a permission group. */
export interface PermissionDefinition {
  key: string;
  label: string;
  description: string;
}

export interface PermissionGroup {
  key: string;
  label: string;
  description: string;
  permissions: PermissionDefinition[];
}
