/**
 * Audit trail contract — mirrors the `/api/admin/audit-logs` endpoints.
 *
 * The backend answers list endpoints with a PagedModel envelope
 * (`content` + `page` metadata) rather than the bare Spring `Page` shape
 * used by `/users`, and the export endpoint with raw CSV.
 */

/** GET /api/admin/audit-logs/{id} → 200 — one recorded action. */
export interface AuditLogEntry {
  id: number;
  /** The actor who triggered the action. */
  username: string;
  /** Machine action name, e.g. "USER_CREATE" or "ASSIGN_ROLE". */
  action: string;
  /** Human-readable summary written at audit time. */
  description: string;
  /** ISO-8601 instant, e.g. 2026-08-16T19:04:22.123Z. */
  createdAt: string;
}

/** PagedModel envelope returned by list and search endpoints. */
export interface AuditLogPage {
  content: AuditLogEntry[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

/** Query params understood by the list, search and export endpoints. */
export interface AuditLogParams {
  /** 0-indexed page number. */
  page?: number;
  size?: number;
  /** Spring sort: "field,dir" e.g. "createdAt,desc". */
  sort?: string;
  username?: string;
  action?: string;
  /** ISO-8601 date-time, inclusive lower bound. */
  from?: string;
  /** ISO-8601 date-time, inclusive upper bound. */
  to?: string;
}
