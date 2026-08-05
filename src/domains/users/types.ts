/**
 * User management contract.
 *
 * NOTE: the current backend exposes no `/api/users` endpoints. These types
 * describe the shape the UI expects so that swapping the stub service in
 * `services/userService.ts` for real HTTP calls is a one-file change.
 */

export const UserStatus = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  LOCKED: "LOCKED",
  INACTIVE: "INACTIVE",
  PENDING: "PENDING",
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const UserRole = {
  ADMIN: "ADMIN",
  MAKER: "MAKER",
  CHECKER: "CHECKER",
  AUDITOR: "AUDITOR",
  VIEWER: "VIEWER",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface ManagedUser {
  id: number;
  fullName: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string | null;
  permissions: string[];
  /** Set while a lock is active; null once it expires or is cleared. */
  lockedUntil: string | null;
  suspensionReason: string | null;
}

export interface CreateUserRequest {
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  permissions: string[];
}

export interface UpdateUserRequest {
  id: number;
  fullName: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  permissions: string[];
}

export interface LockUserRequest {
  id: number;
  /** Always sent in minutes — the dialog converts from the chosen unit. */
  durationMinutes: number;
}

export interface SuspendUserRequest {
  id: number;
  reason?: string;
}

export interface UserMetrics {
  total: number;
  active: number;
  suspended: number;
  locked: number;
  /** Accounts created in the last 30 days. */
  newThisMonth: number;
  administrators: number;
  /** Percentage change in total users versus the previous month. */
  totalChange: number;
}

export interface UserGrowthPoint {
  month: string;
  total: number;
  added: number;
}

export interface LoginTrendPoint {
  day: string;
  logins: number;
  failed: number;
}

export interface DistributionSlice {
  label: string;
  value: number;
}

export interface UserActivity {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  kind: "created" | "updated" | "locked" | "suspended" | "activated" | "login";
}

export interface UserAnalytics {
  growth: UserGrowthPoint[];
  loginTrend: LoginTrendPoint[];
  roleDistribution: DistributionSlice[];
  statusDistribution: DistributionSlice[];
  recentActivity: UserActivity[];
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
