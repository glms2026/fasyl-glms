import { Navigate, Outlet } from "react-router-dom";

import { useAccess } from "@/domains/users/hooks/useAccess";

/**
 * Blocks routes only checkers (AUTHORIZER/ADMIN) may use — the pending
 * approvals queue.
 *
 * The backend enforces the same rule via `@PreAuthorize`; this guard keeps
 * the screen out of reach entirely, so a CONTROL or CREATOR who types the
 * URL is sent back to the dashboard instead of loading a feed that would
 * only 403 on fetch.
 */
export default function RequireAuthorizer() {
  const { canReview } = useAccess();

  if (!canReview) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
