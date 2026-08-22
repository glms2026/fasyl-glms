import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

import { AppShell } from "@/layouts/dashboard/AppShell";
import { useAuthStore } from "@/domains/auth/stores/authStore";

import MustChangePassword from "./routes/MustChangePassword";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import RequireAdmin from "./routes/RequireAdmin";
import RequireAuthorizer from "./routes/RequireAuthorizer";
import RequireMaker from "./routes/RequireMaker";
import RequireRolesAccess from "./routes/RequireRolesAccess";
import { RouteLoader } from "./routes/RouteLoader";

// Auth screens load eagerly: one of them is almost always the first paint.
import SignInPage from "@/domains/auth/pages/SignInPage";
import ForgotPasswordPage from "@/domains/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/domains/auth/pages/ResetPasswordPage";

// Everything behind the shell is split, so signing in stays fast.
const DashboardPage = lazy(
  () => import("@/domains/dashboard/pages/DashboardPage"),
);
const GlDashboardPage = lazy(() => import("@/domains/gl/pages/GlDashboardPage"));
const CreateGlPage = lazy(() => import("@/domains/gl/pages/CreateGlPage"));
const GlEntriesPage = lazy(() => import("@/domains/gl/pages/GlEntriesPage"));
const UsersOverviewPage = lazy(
  () => import("@/domains/users/pages/UsersOverviewPage"),
);
const UsersListPage = lazy(() => import("@/domains/users/pages/UsersListPage"));
const CreateUserPage = lazy(
  () => import("@/domains/users/pages/CreateUserPage"),
);
const EditUserPage = lazy(() => import("@/domains/users/pages/EditUserPage"));
const UserDetailPage = lazy(
  () => import("@/domains/users/pages/UserDetailPage"),
);
const ApprovalsPage = lazy(
  () => import("@/domains/users/pages/ApprovalsPage"),
);
const RolesPermissionsPage = lazy(
  () => import("@/domains/users/pages/RolesPermissionsPage"),
);
const AuditLogsPage = lazy(() => import("@/domains/audit/pages/AuditLogsPage"));
const ChangePasswordPage = lazy(
  () => import("@/domains/auth/pages/ChangePasswordPage"),
);
const SettingsPage = lazy(() => import("@/domains/auth/pages/SettingsPage"));
const ProfilePage = lazy(() => import("@/domains/auth/pages/ProfilePage"));
const NotFoundPage = lazy(() => import("./routes/NotFoundPage"));

export default function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          {/* Public */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<SignInPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Authenticated */}
          <Route element={<ProtectedRoute />}>
            {/* Full-screen mandatory password change — outside the shell so
                there is no navigation to escape to until the flag clears. */}
            <Route
              path="/force-password-change"
              element={<ChangePasswordPage forced />}
            />

            <Route element={<MustChangePassword />}>
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/gl" element={<GlDashboardPage />} />
                <Route path="/gl/create" element={<CreateGlPage />} />
                <Route path="/gl/entries" element={<GlEntriesPage />} />

                <Route path="/users" element={<UsersOverviewPage />} />
                <Route path="/users/list" element={<UsersListPage />} />

                {/* Create/edit are maker operations (CONTROL/ADMIN). */}
                <Route element={<RequireMaker />}>
                  <Route path="/users/new" element={<CreateUserPage />} />
                  <Route path="/users/:id/edit" element={<EditUserPage />} />
                </Route>

                <Route path="/users/:id" element={<UserDetailPage />} />

                <Route element={<RequireAuthorizer />}>
                  <Route path="/approvals" element={<ApprovalsPage />} />
                </Route>

                <Route element={<RequireRolesAccess />}>
                  <Route
                    path="/roles-permissions"
                    element={<RolesPermissionsPage />}
                  />
                </Route>

                {/* The audit trail is ADMIN-only, end to end. */}
                <Route element={<RequireAdmin />}>
                  <Route path="/audit-logs" element={<AuditLogsPage />} />
                </Route>

                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route
                  path="/change-password"
                  element={<ChangePasswordPage />}
                />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>

      <Toaster position="top-right" richColors closeButton />
    </BrowserRouter>
  );
}
