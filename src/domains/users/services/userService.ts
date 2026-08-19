import apiClient from "@/lib/apiClient";

import type {
  AssignRoleRequest,
  CreateUserRequest,
  ManagedUser,
  Page,
  PageRequest,
  UpdateUserRequest,
  UserActionRequest,
  UserApprovalRequest,
} from "../types";

/**
 * Real HTTP client for the `/api/users` endpoints.
 *
 * Maker-checker reality: most writes (create, update, lock, suspend,
 * unsuspend, deactivate, assign roles) do NOT take effect immediately — they
 * create an approval request that an authorizer must approve. Those methods
 * return a `UserApprovalRequest`; the UI should tell the user the change is
 * pending. Only activate / delete act instantly, and those are ADMIN-only
 * on the backend. Locks are duration-based: pass `durationMinutes` for a
 * temporary lock that auto-expires, or omit it for an indefinite one.
 */
export const userService = {
  /** GET /api/users — Spring-paginated. */
  async list(params: PageRequest = {}): Promise<Page<ManagedUser>> {
    const response = await apiClient.get<Page<ManagedUser>>("/users", {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 10,
        sort: params.sort,
      },
    });

    return response.data;
  },

  /** GET /api/users/{id} */
  async getById(id: number): Promise<ManagedUser> {
    const response = await apiClient.get<ManagedUser>(`/users/${id}`);

    return response.data;
  },

  /** POST /api/users — creates the user and queues USER_CREATE for approval. */
  async create(payload: CreateUserRequest): Promise<ManagedUser> {
    const response = await apiClient.post<ManagedUser>("/users", payload);

    return response.data;
  },

  /** PUT /api/users/{id} — queues USER_UPDATE for approval. */
  async update(
    id: number,
    payload: UpdateUserRequest,
  ): Promise<UserApprovalRequest> {
    const response = await apiClient.put<UserApprovalRequest>(
      `/users/${id}`,
      payload,
    );

    return response.data;
  },

  /** PATCH /api/users/{id}/roles — queues ASSIGN_ROLE for approval. */
  async assignRoles(
    id: number,
    payload: AssignRoleRequest,
  ): Promise<UserApprovalRequest> {
    const response = await apiClient.patch<UserApprovalRequest>(
      `/users/${id}/roles`,
      payload,
    );

    return response.data;
  },

  /** PATCH /api/users/{id}/activate — instant. */
  async activate(id: number): Promise<string> {
    const response = await apiClient.patch<string>(`/users/${id}/activate`);

    return response.data;
  },

  /** PATCH /api/users/{id}/deactivate — queues USER_DEACTIVATE for approval. */
  async deactivate(
    id: number,
    payload: UserActionRequest,
  ): Promise<UserApprovalRequest> {
    const response = await apiClient.patch<UserApprovalRequest>(
      `/users/${id}/deactivate`,
      payload,
    );

    return response.data;
  },

  /** PUT /api/users/{id}/lock — queues USER_LOCK for approval. */
  async lock(
    id: number,
    payload: UserActionRequest,
  ): Promise<UserApprovalRequest> {
    const response = await apiClient.put<UserApprovalRequest>(
      `/users/${id}/lock`,
      payload,
    );

    return response.data;
  },

  /** PUT /api/users/{id}/suspend — queues USER_SUSPEND for approval. */
  async suspend(
    id: number,
    payload: UserActionRequest,
  ): Promise<UserApprovalRequest> {
    const response = await apiClient.put<UserApprovalRequest>(
      `/users/${id}/suspend`,
      payload,
    );

    return response.data;
  },

  /** PUT /api/users/{id}/unsuspend — queues USER_UNSUSPEND for approval. */
  async unsuspend(
    id: number,
    payload: UserActionRequest,
  ): Promise<UserApprovalRequest> {
    const response = await apiClient.put<UserApprovalRequest>(
      `/users/${id}/unsuspend`,
      payload,
    );

    return response.data;
  },

  /** DELETE /api/users/{id} — Maker/Checker. Requires a reason; soft-deletes after approval. */
  async deleteUser(
    id: number,
    payload: UserActionRequest,
  ): Promise<UserApprovalRequest> {
    const response = await apiClient.delete<UserApprovalRequest>(
      `/users/${id}`,
      { data: payload },
    );

    return response.data;
  },
};
