import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/domains/auth/hooks/useAuth";

import { RouteLoader } from "./RouteLoader";

interface LocationState {
  from?: { pathname?: string };
}

/** Keeps signed-in users out of the auth screens. */
export default function PublicRoute() {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <RouteLoader label="Loading" />;
  }

  if (isAuthenticated) {
    const state = location.state as LocationState | null;

    return <Navigate to={state?.from?.pathname ?? "/dashboard"} replace />;
  }

  return <Outlet />;
}
