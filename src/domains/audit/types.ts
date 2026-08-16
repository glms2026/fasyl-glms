/**
 * Audit trail contract — mirrors the `/api/admin/audit-logs` endpoints.
 *
 * The backend answers list endpoints with a PagedModel envelope
 * (`content` + `page` metadata) rather than the bare Spring `Page` shape
 * used by `/users`.
 *
 * NOTE: the contract also declares `/search` (username/action/from/to +
 * pagination) and `/export` (CSV download), but both answer HTTP 500 to
 * every request on the current backend — a server bug, not a client one.
 * Until that is fixed the trail is fetched whole via `/audit-logs` and
 * filtered, measured and exported client-side, so this module does not
 * call those two endpoints.
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
  /**
   * Zone-less ISO-8601 UTC wall-clock time from the backend's
   * `LocalDateTime`, e.g. "2026-08-16T19:04:22.123".
   */
  createdAt: string;
}

/** PagedModel envelope returned by the list endpoint. */
export interface AuditLogPage {
  content: AuditLogEntry[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

/** Query params understood by the list endpoint. */
export interface AuditLogParams {
  /** 0-indexed page number. */
  page?: number;
  size?: number;
  /** Spring sort: "field,dir" e.g. "createdAt,desc". */
  sort?: string;
}
