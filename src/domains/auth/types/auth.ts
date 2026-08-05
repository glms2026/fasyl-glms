/**
 * Auth contract — mirrors the `/api/auth` endpoints exactly.
 *
 * The backend returns bare objects (no success/data envelope) and plain
 * strings for write operations, so there is no generic ApiResponse wrapper.
 */

/** Account states the backend reports on the profile payload. */
export const AccountStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
  LOCKED: "LOCKED",
  PENDING: "PENDING",
} as const;

export type AccountStatus =
  (typeof AccountStatus)[keyof typeof AccountStatus];

/** POST /api/auth/login */
export interface LoginRequest {
  username: string;
  password: string;
}

/** POST /api/auth/login → 200 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  username: string;
  role: string;
}

/** GET /api/auth/profile → 200 */
export interface ProfileResponse {
  id: number;
  username: string;
  email: string;
  status: AccountStatus;
  roles: string[];
}

/** POST /api/auth/change-password */
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** POST /api/auth/forgot-password */
export interface ForgotPasswordRequest {
  email: string;
}

/** POST /api/auth/reset-password */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * The signed-in user as the UI needs it: the profile payload plus the role
 * string returned by login, which the profile endpoint reports as an array.
 */
export interface AuthUser extends ProfileResponse {
  primaryRole: string;
}
