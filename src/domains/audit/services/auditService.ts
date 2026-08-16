import apiClient from "@/lib/apiClient";

import type { AuditLogEntry, AuditLogPage, AuditLogParams } from "../types";

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

  /** GET /api/admin/audit-logs/search — filters + pagination server-side. */
  async search(params: AuditLogParams = {}): Promise<AuditLogPage> {
    const response = await apiClient.get<AuditLogPage>(
      "/admin/audit-logs/search",
      {
        params: {
          page: params.page ?? 0,
          size: params.size ?? 25,
          sort: params.sort ?? "createdAt,desc",
          username: params.username || undefined,
          action: params.action || undefined,
          from: params.from,
          to: params.to,
        },
      },
    );

    return response.data;
  },

  /** GET /api/admin/audit-logs/{id} */
  async getById(id: number): Promise<AuditLogEntry> {
    const response = await apiClient.get<AuditLogEntry>(
      `/admin/audit-logs/${id}`,
    );

    return response.data;
  },

  /** GET /api/admin/audit-logs/export — CSV download for the given filters. */
  async exportCsv(params: AuditLogParams = {}): Promise<Blob> {
    const response = await apiClient.get<Blob>("/admin/audit-logs/export", {
      params: {
        username: params.username || undefined,
        action: params.action || undefined,
        from: params.from,
        to: params.to,
      },
      responseType: "blob",
    });

    return response.data;
  },
};
