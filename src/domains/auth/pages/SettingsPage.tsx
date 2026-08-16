import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { SectionCard } from "@/components/common/SectionCard";
import { ModuleHeader } from "@/domains/users/components/ModuleHeader";
import { useApiQuery } from "@/hooks/useApiQuery";
import { getApiErrorMessage } from "@/lib/errors";
import { initials, titleCase } from "@/lib/format";

import { ChangePasswordForm } from "../components/ChangePasswordForm";
import { authService } from "../services/authService";
import type { ChangePasswordFormValues } from "../schema";
import type { ProfileResponse } from "../types/auth";

/**
 * Account settings. The account card mirrors the profile screen's data
 * (GET /api/auth/profile); the security card reuses the same change-password
 * form and flow as /change-password.
 */
export default function SettingsPage() {
  const navigate = useNavigate();

  const { data: profile, isLoading, error, refetch } =
    useApiQuery<ProfileResponse>("auth:profile", () => authService.getProfile());

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handlePasswordSubmit = async (values: ChangePasswordFormValues) => {
    setLoading(true);
    setFormError(null);

    try {
      await authService.changePassword(values);
      toast.success("Password updated");
      navigate("/dashboard", { replace: true });
    } catch (caught) {
      setFormError(getApiErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Settings"
        description="Manage your account and how you sign in to GLMS."
      />

      <div className="grid gap-6 xl:grid-cols-5">
        <SectionCard
          className="xl:col-span-2"
          title="Account"
          description="The account you're currently signed in with."
          action={
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserRound className="size-5" aria-hidden="true" />
            </span>
          }
        >
        {error ? (
          <ErrorState
            title="Couldn't load your profile"
            message={error}
            onRetry={refetch}
          />
        ) : isLoading ? (
          <div className="space-y-4">
            <Skeleton className="size-14 rounded-full" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="flex size-14 items-center justify-center rounded-full bg-primary text-base font-semibold text-white">
                {initials(profile?.username)}
              </span>

              <div className="min-w-0 space-y-1">
                <p className="truncate text-lg font-semibold text-neutral-900">
                  {profile?.username}
                </p>

                <Badge
                  variant={profile?.status === "ACTIVE" ? "success" : "warning"}
                >
                  {profile?.status ? titleCase(profile.status) : "Unknown"}
                </Badge>
              </div>
            </div>

            <dl className="divide-y divide-neutral-100 border-t border-neutral-100">
              <div className="flex items-center gap-3 py-3.5">
                <Mail className="size-4 text-neutral-400" aria-hidden="true" />
                <dt className="w-24 text-sm text-neutral-500">Email</dt>
                <dd className="truncate text-sm font-medium text-neutral-900">
                  {profile?.email || "—"}
                </dd>
              </div>

              <div className="flex items-start gap-3 py-3.5">
                <ShieldCheck
                  className="mt-0.5 size-4 text-neutral-400"
                  aria-hidden="true"
                />
                <dt className="w-24 text-sm text-neutral-500">Roles</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {profile?.roles?.length ? (
                    profile.roles.map((role) => (
                      <Badge key={role} variant="outline">
                        {titleCase(role)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-neutral-400">
                      No roles assigned
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        )}
        </SectionCard>

        <SectionCard
          className="xl:col-span-3"
          title="Security"
          description="Update the password you use to sign in. You'll stay signed in on this device after the change."
          action={
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="size-5" aria-hidden="true" />
            </span>
          }
        >
          <div className="max-w-md">
            <ChangePasswordForm
              onSubmit={handlePasswordSubmit}
              onCancel={() => navigate("/dashboard")}
              loading={loading}
              error={formError}
            />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
