import { Navigate, Outlet } from "react-router-dom";

import { useAccess } from "@/domains/users/hooks/useAccess";

/**
 * Blocks routes that only ADMIN and CONTROL may use — currently the
 * roles & permissions management screen.
 *
 * The backend enforces the same rule via `@PreAuthorize`; this guard keeps
 * the screen out of reach for AUTHORIZER and CREATOR roles.
 */
export default function RequireRolesAccess() {
  const { isAdmin, isControl } = useAccess();

  if (!isAdmin && !isControl) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
