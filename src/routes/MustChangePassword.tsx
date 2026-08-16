import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/domains/auth/hooks/useAuth";

/**
 * Locks the whole app while the account owes the mandatory first-login
 * password change. The backend's PasswordChangeFilter 403s every endpoint
 * except change-password / logout / refresh-token in that state, so this
 * guard keeps the UI honest instead of showing a shell full of 403s.
 */
export default function MustChangePassword() {
  const { user } = useAuth();

  if (user?.mustChangePassword) {
    return <Navigate to="/force-password-change" replace />;
  }

  return <Outlet />;
}
