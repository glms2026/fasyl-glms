import { Link } from "react-router-dom";
import { KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { useApiQuery } from "@/hooks/useApiQuery";
import { initials, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

import { authService } from "../services/authService";
import type { ProfileResponse } from "../types/auth";

/** Reads GET /api/auth/profile — the signed-in user's own record. */
export default function ProfilePage() {
  const { data, isLoading, error, refetch } = useApiQuery<ProfileResponse>(
    "auth:profile",
    () => authService.getProfile(),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="My profile"
        description="The account you're currently signed in with."
        actions={
          <Link
            to="/change-password"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "px-4",
            )}
          >
            <KeyRound className="size-4" />
            Change password
          </Link>
        }
      />

      {error ? (
        <ErrorState
          title="Couldn't load your profile"
          message={error}
          onRetry={refetch}
        />
      ) : (
        <SectionCard>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="size-16 rounded-full" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="flex size-16 items-center justify-center rounded-full bg-primary text-lg font-semibold text-white">
                  {initials(data?.username)}
                </span>

                <div className="min-w-0 space-y-1">
                  <p className="truncate text-lg font-semibold text-neutral-900">
                    {data?.username}
                  </p>

                  <Badge
                    variant={data?.status === "ACTIVE" ? "success" : "warning"}
                  >
                    {data?.status ? titleCase(data.status) : "Unknown"}
                  </Badge>
                </div>
              </div>

              <dl className="divide-y divide-neutral-100 border-t border-neutral-100">
                <div className="flex items-center gap-3 py-4">
                  <UserRound className="size-4 text-neutral-400" aria-hidden="true" />
                  <dt className="w-28 text-sm text-neutral-500">Username</dt>
                  <dd className="text-sm font-medium text-neutral-900">
                    {data?.username ?? "—"}
                  </dd>
                </div>

                <div className="flex items-center gap-3 py-4">
                  <Mail className="size-4 text-neutral-400" aria-hidden="true" />
                  <dt className="w-28 text-sm text-neutral-500">Email</dt>
                  <dd className="truncate text-sm font-medium text-neutral-900">
                    {data?.email || "—"}
                  </dd>
                </div>

                <div className="flex items-start gap-3 py-4">
                  <ShieldCheck
                    className="mt-0.5 size-4 text-neutral-400"
                    aria-hidden="true"
                  />
                  <dt className="w-28 text-sm text-neutral-500">Roles</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {data?.roles?.length ? (
                      data.roles.map((role) => (
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
      )}
    </div>
  );
}
