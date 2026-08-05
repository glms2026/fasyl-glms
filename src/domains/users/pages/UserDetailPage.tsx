import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  KeyRound,
  Lock,
  PauseCircle,
  PlayCircle,
  SquarePen,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { formatDateTime, formatRelative, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

import { permissionGroups } from "../data/permissions";
import { UserAvatar } from "../components/UserAvatar";
import { UserStatusBadge } from "../components/UserStatusBadge";
import { useUserActions } from "../hooks/useUserActions";
import { useUserQuery } from "../hooks/useUsers";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-neutral-500">{label}</dt>
      <dd className="text-sm font-medium text-neutral-900">{value}</dd>
    </div>
  );
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();

  const userId = Number(id);
  const { data: user, isLoading, error, refetch } = useUserQuery(userId);

  const actions = useUserActions();

  if (error) {
    return (
      <ErrorState
        title="Couldn't load this user"
        message={error}
        onRetry={refetch}
      />
    );
  }

  if (isLoading || !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-2xl lg:col-span-1" />
          <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  const granted = new Set(user.permissions);
  const isActive = user.status === "ACTIVE";

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.fullName}
        description={`@${user.username}`}
        eyebrow={
          <Link
            to="/users/list"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-800"
          >
            <ArrowLeft className="size-3.5" />
            Back to users
          </Link>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="lg"
              onClick={() => actions.openResetPassword(user)}
            >
              <KeyRound className="size-4" />
              Reset password
            </Button>

            {isActive ? (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => actions.openLock(user)}
                >
                  <Lock className="size-4" />
                  Lock
                </Button>

                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => actions.openSuspend(user)}
                >
                  <PauseCircle className="size-4" />
                  Suspend
                </Button>
              </>
            ) : (
              <Button size="lg" onClick={() => actions.openActivate(user)}>
                <PlayCircle className="size-4" />
                Activate
              </Button>
            )}

            <Link
              to={`/users/${user.id}/edit`}
              className={cn(buttonVariants({ size: "lg" }), "px-4")}
            >
              <SquarePen className="size-4" />
              Edit
            </Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard className="lg:col-span-1">
          <div className="flex flex-col items-center gap-3 pb-5 text-center">
            <UserAvatar name={user.fullName} size="lg" />

            <div className="space-y-1">
              <p className="font-semibold text-neutral-900">{user.fullName}</p>
              <p className="text-sm text-neutral-500">{user.email}</p>
            </div>

            <UserStatusBadge status={user.status} />
          </div>

          <dl className="divide-y divide-neutral-100 border-t border-neutral-100">
            <DetailRow label="Username" value={user.username} />
            <DetailRow label="Role" value={titleCase(user.role)} />
            <DetailRow label="Created" value={formatDateTime(user.createdAt)} />
            <DetailRow
              label="Last login"
              value={
                user.lastLoginAt ? formatRelative(user.lastLoginAt) : "Never"
              }
            />

            {user.lockedUntil && (
              <DetailRow
                label="Locked until"
                value={formatDateTime(user.lockedUntil)}
              />
            )}

            {user.suspensionReason && (
              <DetailRow
                label="Suspension reason"
                value={user.suspensionReason}
              />
            )}
          </dl>
        </SectionCard>

        <SectionCard
          title="Permissions"
          description={`${user.permissions.length} granted across ${permissionGroups.length} areas.`}
          className="lg:col-span-2"
          action={
            <Link
              to={`/users/${user.id}/edit`}
              className="text-sm font-medium text-primary hover:underline"
            >
              Change
            </Link>
          }
        >
          <div className="grid gap-5 sm:grid-cols-2">
            {permissionGroups.map((group) => {
              const active = group.permissions.filter((permission) =>
                granted.has(permission.key),
              );

              return (
                <div key={group.key} className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-neutral-900">
                      {group.label}
                    </p>

                    <span className="text-xs text-neutral-400">
                      {active.length}/{group.permissions.length}
                    </span>
                  </div>

                  {active.length === 0 ? (
                    <p className="text-sm text-neutral-400">No access</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {active.map((permission) => (
                        <Badge key={permission.key} variant="neutral">
                          {permission.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {actions.dialogs}
    </div>
  );
}
