import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, KeyRound, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { SectionCard } from "@/components/common/SectionCard";
import { titleCase } from "@/lib/format";

import { useAccess } from "../hooks/useAccess";
import { AssignPermissionsDialog } from "../components/AssignPermissionsDialog";
import { ModuleHeader } from "../components/ModuleHeader";
import {
  useAssignRolePermissions,
  useRemoveAllRolePermissions,
  useRemoveRolePermission,
  useRolePermissionsQuery,
  useRolesCatalogue,
} from "../hooks/useRoles";
import type { PermissionResponse, RoleResponse } from "../types";

export default function RolesPermissionsPage() {
  // Role list comes live from GET /api/roles (id, name, permission names).
  const catalogue = useRolesCatalogue();
  const access = useAccess();

  const [roleId, setRoleId] = useState<number | null>(null);

  const selectedRole = (catalogue.data ?? []).find((role) => role.id === roleId) ?? null;

  const permissionsQuery = useRolePermissionsQuery(roleId);

  const [assignOpen, setAssignOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<PermissionResponse | null>(
    null,
  );
  const [removeAllOpen, setRemoveAllOpen] = useState(false);

  const assign = useAssignRolePermissions({
    onSuccess: () => {
      toast.success("Permission assignment submitted for approval.");
      setAssignOpen(false);
    },
  });

  const removeOne = useRemoveRolePermission({
    onSuccess: () => {
      toast.success("Permission removal submitted for approval.");
      setRemoveTarget(null);
    },
  });

  const removeAll = useRemoveAllRolePermissions({
    onSuccess: (response) => {
      toast.success(response.message || "All permissions removed.");
      setRemoveAllOpen(false);
    },
  });

  const permissions = permissionsQuery.data ?? [];
  const activeMutation = assign.isPending || removeOne.isPending || removeAll.isPending;

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Roles & permissions"
        description="Manage what each role can do. Changes are queued for approval before they take effect."
        eyebrow={
          <Link
            to="/users"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            Back to user management
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="Roles"
          description="Pick a role to view and edit its permissions."
          className="lg:col-span-1"
        >
          {catalogue.isError ? (
            <ErrorState
              title="Couldn't load roles"
              message={catalogue.error ?? ""}
              onRetry={catalogue.refetch}
            />
          ) : (
            <div className="space-y-3">
              {catalogue.isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <select
                  aria-label="Select a role"
                  value={roleId ?? ""}
                  onChange={(event) =>
                    setRoleId(event.target.value ? Number(event.target.value) : null)
                  }
                  className="h-10 w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 text-sm transition-colors outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15"
                >
                  <option value="">Choose a role…</option>

                  {catalogue.data?.map((option: RoleResponse) => (
                    <option key={option.id} value={option.id}>
                      {titleCase(option.name)}
                    </option>
                  ))}
                </select>
              )}

              {selectedRole && (
                <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm text-primary">
                  <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
                  {permissions.length} permission
                  {permissions.length === 1 ? "" : "s"} on this role
                </div>
              )}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title={
            selectedRole ? `${titleCase(selectedRole.name)} permissions` : "Permissions"
          }
          description={
            selectedRole
              ? "Currently attached to this role. Changes require authorizer approval."
              : "Select a role on the left to see its permissions."
          }
          className="lg:col-span-2"
          action={
            selectedRole &&
            access.canMakeChanges && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={permissions.length === 0 || activeMutation}
                  onClick={() => setRemoveAllOpen(true)}
                >
                  <Trash2 className="size-3.5" />
                  Remove all
                </Button>

                <Button size="sm" disabled={activeMutation} onClick={() => setAssignOpen(true)}>
                  <KeyRound className="size-3.5" />
                  Assign permissions
                </Button>
              </div>
            )
          }
        >
          {!selectedRole ? (
            <EmptyState
              icon={ShieldCheck}
              title="No role selected"
              description="Choose a role to manage its permissions."
              className="py-16"
            />
          ) : permissionsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-11 w-full" />
              ))}
            </div>
          ) : permissionsQuery.isError ? (
            <ErrorState
              title="Couldn't load permissions"
              message={permissionsQuery.error ?? ""}
              onRetry={permissionsQuery.refetch}
            />
          ) : permissions.length === 0 ? (
            <EmptyState
              icon={KeyRound}
              title="No permissions yet"
              description="Assign this role its first permissions."
              className="py-16"
            />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {permissions.map((permission) => (
                <li
                  key={permission.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {permission.name}
                    </p>

                    {permission.description && (
                      <p className="truncate text-xs text-neutral-500">
                        {permission.description}
                      </p>
                    )}
                  </div>

                  {access.canMakeChanges && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={activeMutation}
                      onClick={() => setRemoveTarget(permission)}
                      className="shrink-0 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${permission.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <AssignPermissionsDialog
        role={selectedRole ? titleCase(selectedRole.name) : null}
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        isPending={assign.isPending}
        error={assign.error}
        onConfirm={(permissionsToAssign, reason) => {
          if (!selectedRole) return;
          assign.mutate({
            roleId: selectedRole.id,
            permissions: permissionsToAssign,
            reason,
          });
        }}
      />

      <ConfirmDialog
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (!removeTarget || !selectedRole) return;
          removeOne.mutate({
            roleId: selectedRole.id,
            permissionName: removeTarget.name,
          });
        }}
        title="Remove this permission?"
        description={
          removeTarget && selectedRole
            ? `${removeTarget.name} will be removed from ${selectedRole.name} once an authorizer approves.`
            : undefined
        }
        confirmLabel="Submit removal"
        isPending={removeOne.isPending}
        error={removeOne.error}
      />

      <ConfirmDialog
        open={removeAllOpen}
        onClose={() => setRemoveAllOpen(false)}
        onConfirm={() => {
          if (!selectedRole) return;
          removeAll.mutate({ roleId: selectedRole.id });
        }}
        title="Remove every permission?"
        description={
          selectedRole
            ? `All ${permissions.length} permissions will be removed from ${selectedRole.name}. This takes effect immediately.`
            : undefined
        }
        confirmLabel="Remove all"
        tone="destructive"
        isPending={removeAll.isPending}
        error={removeAll.error}
      />
    </div>
  );
}
