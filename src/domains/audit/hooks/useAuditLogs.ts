import { useCallback } from "react";

import { useApiQuery, type UseApiQueryOptions } from "@/hooks/useApiQuery";

import { auditService } from "../services/auditService";
import type { AuditLogEntry } from "../types";

/** Query keys — prefix-matched, so invalidating "audit" refreshes them all. */
export const auditQueryKeys = {
  all: "audit",
  list: "audit:all",
  detail: (id: number) => `audit:detail:${id}`,
} as const;

/**
 * The full audit trail, newest first. The backend's `/search` endpoint 500s
 * on every request, so filtering, metrics and export are done client-side
 * on this list (see `AuditLogsPage`).
 */
export function useAuditLogsQuery(
  options?: UseApiQueryOptions<AuditLogEntry[]>,
) {
  const fetcher = useCallback(() => auditService.listAll(), []);

  return useApiQuery<AuditLogEntry[]>(auditQueryKeys.list, fetcher, options);
}
