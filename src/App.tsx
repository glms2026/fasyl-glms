import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

import { AppShell } from "@/layouts/dashboard/AppShell";
import { useAuthStore } from "@/domains/auth/stores/authStore";

import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import { RouteLoader } from "./routes/RouteLoader";

// Auth screens load eagerly: one of them is almost always the first paint.
import SignInPage from "@/domains/auth/pages/SignInPage";
import ForgotPasswordPage from "@/domains/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/domains/auth/pages/ResetPasswordPage";

// Everything behind the shell is split, so signing in stays fast.
const DashboardPage = lazy(
  () => import("@/domains/dashboard/pages/DashboardPage"),
);
const CreateGlPage = lazy(() => import("@/domains/gl/pages/CreateGlPage"));
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
const ChangePasswordPage = lazy(
  () => import("@/domains/auth/pages/ChangePasswordPage"),
);
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
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/create-gl" element={<CreateGlPage />} />

              <Route path="/users" element={<UsersOverviewPage />} />
              <Route path="/users/list" element={<UsersListPage />} />
              <Route path="/users/new" element={<CreateUserPage />} />
              <Route path="/users/:id" element={<UserDetailPage />} />
              <Route path="/users/:id/edit" element={<EditUserPage />} />

              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/change-password" element={<ChangePasswordPage />} />
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
