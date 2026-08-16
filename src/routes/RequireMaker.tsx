import { Navigate, Outlet } from "react-router-dom";

import { useAccess } from "@/domains/users/hooks/useAccess";

/**
 * Blocks routes only makers (CONTROL/ADMIN) may use — user creation and edit.
 *
 * The backend enforces the same rule via `@PreAuthorize`; this guard keeps the
 * screens out of reach entirely, so an AUTHORIZER (or any other viewer) who
 * types the URL is sent back to the read-only directory instead of loading a
 * form that would only fail on submit.
 */
export default function RequireMaker() {
  const { canMakeChanges } = useAccess();

  if (!canMakeChanges) {
    return <Navigate to="/users/list" replace />;
  }

  return <Outlet />;
}
