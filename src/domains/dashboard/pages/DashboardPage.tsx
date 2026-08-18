import { useAuth } from "@/domains/auth/hooks/useAuth";
import { useAccess } from "@/domains/users/hooks/useAccess";

import { AdminDashboard } from "../components/AdminDashboard";
import { AuthorizerDashboard } from "../components/AuthorizerDashboard";
import { ControlDashboard } from "../components/ControlDashboard";
import { CreatorDashboard } from "../components/CreatorDashboard";

/**
 * Dashboard router — renders the role-specific dashboard based on the
 * user's primary role. Each dashboard is tailored to the role's responsibilities
 * and permissions.
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const { roles } = useAccess();

  // Determine which dashboard to show based on the user's primary role
  // ADMIN gets the command center, CONTROL gets the maker workspace,
  // AUTHORIZER gets the review queue, CREATOR gets the GL workspace
  const primaryRole = user?.primaryRole || roles[0] || "ADMIN";

  switch (primaryRole) {
    case "ADMIN":
      return <AdminDashboard />;
    case "CONTROL":
      return <ControlDashboard />;
    case "AUTHORIZER":
      return <AuthorizerDashboard />;
    case "CREATOR":
      return <CreatorDashboard />;
    default:
      // Fallback to admin dashboard for unknown roles
      return <AdminDashboard />;
  }
}
