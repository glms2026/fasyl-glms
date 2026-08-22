import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, LogOut } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { InlineAlert } from "@/components/common/InlineAlert";
import { getApiErrorMessage } from "@/lib/errors";

import { AuthHeading } from "../components/AuthHeading";
import { AuthLayout } from "../components/AuthLayout";
import { ChangePasswordForm } from "../components/ChangePasswordForm";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";
import type { ChangePasswordFormValues } from "../schema";

interface ChangePasswordPageProps {
  /**
   * True when this screen is part of the mandatory first-login flow
   * (route /force-password-change). Rendered full-screen with no shell,
   * no cancel, and a sign-out escape hatch; success ends the session
   * because the backend revokes every token when the flag clears.
   */
  forced?: boolean;
}

export default function ChangePasswordPage({ forced = false }: ChangePasswordPageProps) {
  const navigate = useNavigate();
  const { user, logout, clearAuth } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: ChangePasswordFormValues) => {
    setLoading(true);
    setError(null);

    try {
      await authService.changePassword(values);

      if (forced) {
        // The backend revokes all tokens on success, so the session is over.
        clearAuth();
        navigate("/login?reason=password-changed", { replace: true });
        return;
      }

      toast.success("Password updated");
      navigate("/dashboard", { replace: true });
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  if (forced) {
    return (
      <AuthLayout>
        <div className="space-y-6">
          <AuthHeading
            title="Set a new password"
            description="Your security matters. Choose a strong password to continue."
          />

          <InlineAlert variant="info">
            This is your first sign-in. The password you received was
            temporary{user?.username ? `, ${user.username}` : ""} — set your own
            before accessing the system.
          </InlineAlert>

          <ChangePasswordForm
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
          />

          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={loading}
              className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 disabled:opacity-50"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sign out and finish later
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Change password"
        description="Update the password you use to sign in to MIS."
      />

      <SectionCard
        title="Password"
        description="You'll stay signed in on this device after the change."
        action={
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="size-5" aria-hidden="true" />
          </span>
        }
      >
        <ChangePasswordForm
          onSubmit={handleSubmit}
          onCancel={() => navigate("/dashboard")}
          loading={loading}
          error={error}
        />
      </SectionCard>
    </div>
  );
}
