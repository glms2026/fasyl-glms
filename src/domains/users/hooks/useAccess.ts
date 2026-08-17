import { useAuthStore } from "@/domains/auth/stores/authStore";

/**
 * Maps the backend's `@PreAuthorize` role rules onto the UI so screens only
 * offer actions the current user is permitted to perform.
 *
 * Backend truth:
 * - Read users / roles: ADMIN, CONTROL, AUTHORIZER
 * - Maker ops (create, update, lock, suspend, unsuspend, deactivate,
 *   assign roles, assign/remove role permissions): CONTROL, ADMIN
 * - Checker ops (approve / reject, view the pending queue): AUTHORIZER, ADMIN
 * - Admin-direct ops (activate, delete user, clear role permissions):
 *   ADMIN only. Locks are duration-based now and there is no unlock.

 */
export function useAccess() {
  const roles = useAuthStore((state) => state.user?.roles) ?? [];

  const isAdmin = roles.includes("ADMIN");
  const isControl = roles.includes("CONTROL");
  const isAuthorizer = roles.includes("AUTHORIZER");

  return {
    isAdmin,
    isControl,
    isAuthorizer,
    /** May list and view users and the role catalogue. */
    canViewUsers: isAdmin || isControl || isAuthorizer,
    /** May create maker approval requests (lock / suspend / deactivate / roles…). */
    canMakeChanges: isAdmin || isControl,
    /** May act as checker: approve / reject and view the pending queue. */
    canReview: isAdmin || isAuthorizer,
    /** May run immediate admin-direct operations (activate / delete). */
    canAdminDirect: isAdmin,
  };
}
