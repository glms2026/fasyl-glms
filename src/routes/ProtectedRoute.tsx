import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/domains/auth/hooks/useAuth";

import { RouteLoader } from "./RouteLoader";

/** Blocks unauthenticated access and remembers where the user was headed. */
export default function ProtectedRoute() {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <RouteLoader label="Restoring your session" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
