import { Navigate, Outlet } from "react-router-dom";

import { useAccess } from "@/domains/users/hooks/useAccess";

/**
 * Blocks routes only ADMIN may use — currently the audit trail.
 *
 * The backend enforces the same rule via `@PreAuthorize` on
 * `/api/admin/audit-logs`; this guard keeps the screen out of reach
 * entirely, so a CONTROL or AUTHORIZER who types the URL is sent back to
 * the dashboard instead of loading a feed that would only 403 on fetch.
 */
export default function RequireAdmin() {
  const { isAdmin } = useAccess();

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
