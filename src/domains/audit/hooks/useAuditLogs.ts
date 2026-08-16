import { useCallback } from "react";

import { useApiQuery, type UseApiQueryOptions } from "@/hooks/useApiQuery";

import { auditService } from "../services/auditService";
import type { AuditLogParams, AuditLogPage } from "../types";

/** Query keys — prefix-matched, so invalidating "audit" refreshes them all. */
export const auditQueryKeys = {
  all: "audit",
  list: "audit:list",
  detail: (id: number) => `audit:detail:${id}`,
  count: "audit:count",
} as const;

const hasFilters = (params: AuditLogParams) =>
  Boolean(params.username || params.action || params.from || params.to);

/**
 * The audit trail, server-paginated. Unfiltered reads hit the plain list
 * endpoint; any filter switches to `/search` so filtering happens
 * server-side. The key embeds every param so changes refetch.
 */
export function useAuditLogsQuery(
  params: AuditLogParams,
  options?: UseApiQueryOptions<AuditLogPage>,
) {
  const key = [
    auditQueryKeys.all,
    params.page ?? 0,
    params.size ?? 25,
    params.sort ?? "createdAt,desc",
    params.username ?? "",
    params.action ?? "",
    params.from ?? "",
    params.to ?? "",
  ].join(":");

  const fetcher = useCallback(
    () =>
      hasFilters(params)
        ? auditService.search(params)
        : auditService.list(params),
    [params],
  );

  return useApiQuery<AuditLogPage>(key, fetcher, options);
}

/**
 * How many events match the current filters since `from`. Sends `size: 1`
 * and reads the envelope's total so the KPI strip gets an exact count with
 * a single cheap request.
 */
export function useAuditActivityCount(
  from: string,
  extra: Pick<AuditLogParams, "username" | "action" | "to"> = {},
  enabled = true,
) {
  const key = [
    auditQueryKeys.count,
    from,
    extra.username ?? "",
    extra.action ?? "",
    extra.to ?? "",
  ].join(":");

  const fetcher = useCallback(
    async () => {
      const page = await auditService.search({
        from,
        size: 1,
        ...extra,
      });

      return page.page.totalElements;
    },
    [from, extra.username, extra.action, extra.to],
  );

  return useApiQuery<number>(key, fetcher, { enabled });
}
