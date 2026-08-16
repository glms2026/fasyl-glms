import apiClient from "@/lib/apiClient";

import type { AuditLogEntry, AuditLogPage, AuditLogParams } from "../types";

/**
 * The audit trail is small for an internal system, and the backend's
 * `/search` + `/export` endpoints 500 on every request, so filtering,
 * metrics and CSV export run client-side over the whole list instead.
 * This size matches the ceiling the users module already relies on.
 */
const LIST_PAGE_SIZE = 1000;

/**
 * Real HTTP client for the `/api/admin/audit-logs` endpoints.
 *
 * ADMIN-only on the backend. Undefined filter params are dropped by axios,
 * so omitting a filter is the same as not sending it.
 */
export const auditService = {
  /** GET /api/admin/audit-logs — every event, paginated. */
  async list(params: AuditLogParams = {}): Promise<AuditLogPage> {
    const response = await apiClient.get<AuditLogPage>("/admin/audit-logs", {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 25,
        sort: params.sort ?? "createdAt,desc",
      },
    });

    return response.data;
  },

  /**
   * The complete trail in one request, paging through `/audit-logs`
   * internally. Never calls the broken `/search` endpoint.
   */
  async listAll(): Promise<AuditLogEntry[]> {
    const all: AuditLogEntry[] = [];

    for (let page = 0; ; page += 1) {
      const result = await this.list({ page, size: LIST_PAGE_SIZE });
      all.push(...result.content);

      if (
        result.content.length < LIST_PAGE_SIZE ||
        all.length >= result.page.totalElements
      ) {
        break;
      }
    }

    return all;
  },

  /** GET /api/admin/audit-logs/{id} */
  async getById(id: number): Promise<AuditLogEntry> {
    const response = await apiClient.get<AuditLogEntry>(
      `/admin/audit-logs/${id}`,
    );

    return response.data;
  },
};
