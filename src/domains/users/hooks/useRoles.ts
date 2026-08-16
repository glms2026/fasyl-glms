import { useMemo } from "react";

import { useApiMutation } from "@/hooks/useApiMutation";
import { useApiQuery } from "@/hooks/useApiQuery";

import { roleService } from "../services/roleService";
import type {
  ApiResponse,
  PermissionResponse,
  RoleResponse,
  UserApprovalRequest,
} from "../types";

export const roleQueryKeys = {
  all: "roles",
  catalogue: "roles:catalogue",
  permissions: (roleId: number | string) => `roles:permissions:${roleId}`,
} as const;

/** GET /api/roles — the role catalogue, keyed by numeric role ID. */
export function useRolesCatalogue() {
  return useApiQuery<RoleResponse[]>(
    roleQueryKeys.catalogue,
    () => roleService.listRoles(),
  );
}

/** Permissions currently attached to a role (by numeric ID). */
export function useRolePermissionsQuery(roleId: number | null) {
  return useApiQuery<PermissionResponse[]>(
    roleQueryKeys.permissions(roleId ?? "none"),
    () => roleService.getRolePermissions(roleId as number),
    { enabled: typeof roleId === "number" && !Number.isNaN(roleId) },
  );
}

/**
 * Effective permissions for a user: every permission across their roles,
 * keyed by role name so the detail screen can show the breakdown. Roles are
 * names on `UserResponse`, but the role endpoints take IDs, so the catalogue
 * is used to resolve names → IDs first.
 */
export function useEffectiveRolePermissions(roles: string[]) {
  const catalogue = useRolesCatalogue();

  const resolved = useMemo(() => {
    const byName = new Map<string, RoleResponse>();

    for (const role of catalogue.data ?? []) {
      byName.set(role.name.toUpperCase(), role);
    }

    const ids: number[] = [];
    const nameById = new Map<number, string>();

    for (const roleName of roles) {
      const entry = byName.get(roleName.toUpperCase());

      if (entry) {
        ids.push(entry.id);
        nameById.set(entry.id, entry.name);
      }
    }

    return { ids, nameById };
  }, [catalogue.data, roles]);

  const key =
    `roles:effective:${resolved.ids.slice().sort((a, b) => a - b).join(",") || "none"}`;

  return useApiQuery<Record<string, PermissionResponse[]>>(
    key,
    async () => {
      const entries = await Promise.all(
        resolved.ids.map(async (roleId) => {
          const permissions = await roleService.getRolePermissions(roleId);

          return [
            resolved.nameById.get(roleId) as string,
            permissions,
          ] as const;
        }),
      );

      return Object.fromEntries(entries);
    },
    { enabled: resolved.ids.length > 0 },
  );
}

interface MutationCallbacks {
  onSuccess?: (data: UserApprovalRequest) => void;
  onError?: (message: string) => void;
}

export function useAssignRolePermissions({ onSuccess, onError }: MutationCallbacks = {}) {
  return useApiMutation<
    { roleId: number; permissions: string[]; reason: string },
    UserApprovalRequest
  >(
    ({ roleId, permissions, reason }) =>
      roleService.assignPermissions(roleId, { permissions, reason }),
    { invalidates: [roleQueryKeys.all, "users"], onSuccess, onError },
  );
}

export function useRemoveRolePermission({ onSuccess, onError }: MutationCallbacks = {}) {
  return useApiMutation<
    { roleId: number; permissionName: string; reason?: string },
    UserApprovalRequest
  >(
    ({ roleId, permissionName, reason }) =>
      roleService.removePermission(roleId, permissionName, reason),
    { invalidates: [roleQueryKeys.all, "users"], onSuccess, onError },
  );
}

export function useRemoveAllRolePermissions(options: {
  onSuccess?: (data: ApiResponse) => void;
  onError?: (message: string) => void;
} = {}) {
  const { onSuccess, onError } = options;

  return useApiMutation<{ roleId: number }, ApiResponse>(
    ({ roleId }) => roleService.removeAllPermissions(roleId),
    { invalidates: [roleQueryKeys.all, "users"], onSuccess, onError },
  );
}
