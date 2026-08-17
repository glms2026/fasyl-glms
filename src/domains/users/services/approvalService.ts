import apiClient from "@/lib/apiClient";

import type {
  ApprovalDecisionRequest,
  AssignRoleApprovalRequest,
  Page,
  PageRequest,
  UserApprovalRequest,
} from "../types";

/**
 * The backend answers the list endpoints with a PagedModel envelope —
 * `{ content: [...], page: { size, number, totalElements, totalPages } }` —
 * not the flat Spring Page shape the rest of the app uses. Normalise it
 * once here so every consumer (nav badge count, pagination, metrics) reads
 * `totalElements` / `totalPages` off the same flat shape as the users module.
 */
interface PagedModel<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

function toPage<T>(paged: PagedModel<T>): Page<T> {
  const { content, page } = paged;

  return {
    content,
    totalElements: page.totalElements,
    totalPages: page.totalPages,
    size: page.size,
    number: page.number,
    numberOfElements: content.length,
    first: page.number === 0,
    last: page.totalPages === 0 || page.number >= page.totalPages - 1,
    empty: content.length === 0,
  };
}

/** HTTP client for the `/api/user-approval-requests` maker-checker queue. */
export const approvalService = {
  /** GET /api/user-approval-requests/pending — the authorizer's queue. */
  async listPending(params: PageRequest = {}): Promise<Page<UserApprovalRequest>> {
    const response = await apiClient.get<PagedModel<UserApprovalRequest>>(
      "/user-approval-requests/pending",
      {
        params: {
          page: params.page ?? 0,
          size: params.size ?? 10,
          sort: params.sort,
        },
      },
    );

    return toPage(response.data);
  },

  /** GET /api/user-approval-requests/mine — requests the caller submitted. */
  async listMine(params: PageRequest = {}): Promise<Page<UserApprovalRequest>> {
    const response = await apiClient.get<PagedModel<UserApprovalRequest>>(
      "/user-approval-requests/mine",
      {
        params: {
          page: params.page ?? 0,
          size: params.size ?? 10,
          sort: params.sort,
        },
      },
    );

    return toPage(response.data);
  },

  /** GET /api/user-approval-requests/{id} */
  async getById(id: number): Promise<UserApprovalRequest> {
    const response = await apiClient.get<UserApprovalRequest>(
      `/user-approval-requests/${id}`,
    );

    return response.data;
  },

  /** PUT /api/user-approval-requests/{id}/approve */
  async approve(
    id: number,
    payload: ApprovalDecisionRequest = {},
  ): Promise<UserApprovalRequest> {
    const response = await apiClient.put<UserApprovalRequest>(
      `/user-approval-requests/${id}/approve`,
      payload,
    );

    return response.data;
  },

  /** PUT /api/user-approval-requests/{id}/reject */
  async reject(
    id: number,
    payload: ApprovalDecisionRequest = {},
  ): Promise<UserApprovalRequest> {
    const response = await apiClient.put<UserApprovalRequest>(
      `/user-approval-requests/${id}/reject`,
      payload,
    );

    return response.data;
  },

  /** DELETE /api/user-approval-requests/{id} — withdraw a pending request. */
  async cancel(id: number): Promise<UserApprovalRequest> {
    const response = await apiClient.delete<UserApprovalRequest>(
      `/user-approval-requests/${id}`,
    );

    return response.data;
  },

  /** POST /api/user-approval-requests/assign-role */
  async assignRole(
    payload: AssignRoleApprovalRequest,
  ): Promise<UserApprovalRequest> {
    const response = await apiClient.post<UserApprovalRequest>(
      "/user-approval-requests/assign-role",
      payload,
    );

    return response.data;
  },
};
