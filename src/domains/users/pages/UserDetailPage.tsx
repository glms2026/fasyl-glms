import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Lock,
  PauseCircle,
  PlayCircle,
  ShieldPlus,
  SquarePen,
  Trash2,
  Unlock,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { SectionCard } from "@/components/common/SectionCard";
import { formatDateTime, titleCase } from "@/lib/format";

import { ModuleHeader } from "../components/ModuleHeader";
import {
  heroButtonClass,
  heroGhostButtonClass,
} from "../components/heroStyles";
import { UserAvatar } from "../components/UserAvatar";
import { UserStatusBadge } from "../components/UserStatusBadge";
import { useAccess } from "../hooks/useAccess";
import { useUserActions } from "../hooks/useUserActions";
import { useUserQuery } from "../hooks/useUsers";
import { useEffectiveRolePermissions } from "../hooks/useRoles";
import { userFullName } from "../types";

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

  const effective = useEffectiveRolePermissions(user?.roles ?? []);

  const actions = useUserActions();
  const access = useAccess();

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
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-2xl lg:col-span-1" />
          <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  const status = user.status;
  const roleList = user.roles;

  const accessActions = (
    <>
      {status === "ACTIVE" && access.canMakeChanges && (
        <>
          <Button
            size="lg"
            className={heroGhostButtonClass}
            onClick={() => actions.openLock(user)}
          >
            <Lock className="size-4" />
            Lock
          </Button>

          <Button
            size="lg"
            className={heroGhostButtonClass}
            onClick={() => actions.openSuspend(user)}
          >
            <PauseCircle className="size-4" />
            Suspend
          </Button>
        </>
      )}

      {status === "LOCKED" && access.canAdminDirect && (
        <Button
          size="lg"
          className={heroGhostButtonClass}
          onClick={() => actions.openUnlock(user)}
        >
          <Unlock className="size-4" />
          Unlock
        </Button>
      )}

      {status === "SUSPENDED" && (
        <>
          {access.canMakeChanges && (
            <Button
              size="lg"
              className={heroGhostButtonClass}
              onClick={() => actions.openUnsuspend(user)}
            >
              <PlayCircle className="size-4" />
              Unsuspend
            </Button>
          )}

          {access.canAdminDirect && (
            <Button size="lg" className={heroButtonClass} onClick={() => actions.openActivate(user)}>
              <PlayCircle className="size-4" />
              Activate
            </Button>
          )}
        </>
      )}

      {(status === "INACTIVE" || status === "PASSWORD_EXPIRED") &&
        access.canAdminDirect && (
          <Button size="lg" className={heroButtonClass} onClick={() => actions.openActivate(user)}>
            <PlayCircle className="size-4" />
            Activate
          </Button>
        )}
    </>
  );

  return (
    <div className="space-y-6">
      <ModuleHeader
        title={userFullName(user)}
        description={`@${user.username} · ${roleList.map(titleCase).join(", ")}`}
        eyebrow={
          <Link
            to="/users/list"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            Back to users
          </Link>
        }
        actions={
          <>
            {accessActions}

            {access.canMakeChanges && (
              <Button
                size="lg"
                className={heroGhostButtonClass}
                onClick={() => actions.openAssignRoles(user)}
              >
                <ShieldPlus className="size-4" />
                Assign roles
              </Button>
            )}

            {access.canAdminDirect && (
              <Button
                size="lg"
                className={heroGhostButtonClass}
                onClick={() => actions.openDelete(user)}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            )}

            {access.canMakeChanges && (
              <Link to={`/users/${user.id}/edit`} className={heroButtonClass}>
                <SquarePen className="size-4" />
                Edit
              </Link>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard className="lg:col-span-1">
          <div className="flex flex-col items-center gap-3 pb-5 text-center">
            <UserAvatar name={userFullName(user)} size="lg" />

            <div className="space-y-1">
              <p className="font-semibold text-neutral-900">
                {userFullName(user)}
              </p>
              <p className="text-sm text-neutral-500">{user.email}</p>
            </div>

            <UserStatusBadge status={user.status} />
          </div>

          <dl className="divide-y divide-neutral-100 border-t border-neutral-100">
            <div className="py-3">
              <dt className="text-sm text-neutral-500">Roles</dt>
              <dd className="mt-1.5 flex flex-wrap gap-1.5">
                {roleList.length > 0 ? (
                  roleList.map((role) => (
                    <Badge key={role} variant="outline">
                      {titleCase(role)}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-neutral-400">No roles</span>
                )}
              </dd>
            </div>

            <DetailRow label="Username" value={user.username} />
            <DetailRow label="Created" value={formatDateTime(user.createdAt)} />
            <DetailRow label="Updated" value={formatDateTime(user.updatedAt)} />

            <DetailRow
              label="Failed sign-in attempts"
              value={String(user.failedLoginAttempts ?? 0)}
            />

            {user.lockoutTime && (
              <DetailRow label="Lockout time" value={formatDateTime(user.lockoutTime)} />
            )}

            {user.lockedAt && (
              <DetailRow label="Locked at" value={formatDateTime(user.lockedAt)} />
            )}

            {user.lockedBy && (
              <DetailRow label="Locked by" value={user.lockedBy} />
            )}

            {user.lockReason && (
              <DetailRow label="Lock reason" value={user.lockReason} />
            )}

            {user.suspendedAt && (
              <DetailRow label="Suspended at" value={formatDateTime(user.suspendedAt)} />
            )}

            {user.suspendedBy && (
              <DetailRow label="Suspended by" value={user.suspendedBy} />
            )}
          </dl>
        </SectionCard>

        <SectionCard
          title="Effective permissions"
          description="Permissions currently attached to this user's roles."
          className="lg:col-span-2"
        >
          {effective.isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : effective.isError ? (
            <EmptyState
              icon={ShieldPlus}
              title="Couldn't load permissions"
              description={effective.error ?? ""}
            />
          ) : roleList.length === 0 ? (
            <EmptyState
              icon={ShieldPlus}
              title="No roles assigned"
              description="Assign a role to grant this user access."
            />
          ) : (
            <div className="space-y-6">
              {roleList.map((role) => {
                const permissions = effective.data?.[role] ?? [];

                return (
                  <div key={role} className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-neutral-900">
                        {titleCase(role)}
                      </p>

                      <span className="text-xs text-neutral-400">
                        {permissions.length} permission
                        {permissions.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    {permissions.length === 0 ? (
                      <p className="text-sm text-neutral-400">
                        This role has no permissions yet.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {permissions.map((permission) => (
                          <Badge key={permission.id} variant="neutral">
                            {permission.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {actions.dialogs}
    </div>
  );
}
