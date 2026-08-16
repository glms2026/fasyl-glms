import apiClient from "@/lib/apiClient";

import type {
  ApiResponse,
  PermissionResponse,
  RoleResponse,
  UserApprovalRequest,
} from "../types";

/**
 * HTTP client for the `/api/roles` endpoints.
 *
 * The role-permission endpoints take a numeric `roleId` (`Long`), resolved
 * server-side via `roleRepository.findById`. Role names must be mapped to
 * IDs through `GET /api/roles` (the catalogue), which returns every role
 * with its ID, name and permission names.
 */
export const roleService = {
  /** GET /api/roles — the role catalogue (id, name, permission names). */
  async listRoles(): Promise<RoleResponse[]> {
    const response = await apiClient.get<RoleResponse[]>("/roles");

    return response.data;
  },

  /** GET /api/roles/{roleId}/permissions — full permission records. */
  async getRolePermissions(roleId: number): Promise<PermissionResponse[]> {
    const response = await apiClient.get<PermissionResponse[]>(
      `/roles/${roleId}/permissions`,
    );

    return response.data;
  },

  /** PUT /api/roles/{roleId}/permissions — queues ASSIGN_PERMISSION. */
  async assignPermissions(
    roleId: number,
    payload: { permissions: string[]; reason: string },
  ): Promise<UserApprovalRequest> {
    const response = await apiClient.put<UserApprovalRequest>(
      `/roles/${roleId}/permissions`,
      payload,
    );

    return response.data;
  },

  /** DELETE /api/roles/{roleId}/permissions — ADMIN-only, immediate. */
  async removeAllPermissions(roleId: number): Promise<ApiResponse> {
    const response = await apiClient.delete<ApiResponse>(
      `/roles/${roleId}/permissions`,
    );

    return response.data;
  },

  /** DELETE /api/roles/{roleId}/permissions/{permissionName} — queues REMOVE_PERMISSION. */
  async removePermission(
    roleId: number,
    permissionName: string,
    reason?: string,
  ): Promise<UserApprovalRequest> {
    const response = await apiClient.delete<UserApprovalRequest>(
      `/roles/${roleId}/permissions/${encodeURIComponent(permissionName)}`,
      { params: reason ? { reason } : undefined },
    );

    return response.data;
  },
};
