import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clock,
  RotateCw,
  ScrollText,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { InlineAlert } from "@/components/common/InlineAlert";
import { MetricCard } from "@/components/common/MetricCard";
import { SectionCard } from "@/components/common/SectionCard";
import { TablePagination } from "@/components/common/TablePagination";
import { ModuleHeader } from "@/domains/users/components/ModuleHeader";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatNumber, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

import { AuditDetailDialog } from "../components/AuditDetailDialog";
import { AuditFilters } from "../components/AuditFilters";
import { AuditTimeline } from "../components/AuditTimeline";
import { ExportButton } from "../components/ExportButton";
import { LiveIndicator } from "../components/LiveIndicator";
import { useAuditActivityCount, useAuditLogsQuery } from "../hooks/useAuditLogs";
import type { AuditLogEntry, AuditLogParams } from "../types";

const PAGE_SIZE = 25;
const PAGE_SIZE_OPTIONS = [25, 50];
const AUTO_REFRESH_MS = 60_000;

function TimelineSkeleton() {
  return (
    <div className="space-y-4 py-2" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-start gap-4 px-2">
          <Skeleton className="size-9 shrink-0 rounded-full" />

          <div className="flex-1 space-y-2 pt-1.5">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [live, setLive] = useState(false);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  // Captured once so the "last 24h" window doesn't drift across re-renders.
  const [now] = useState(() => Date.now());

  const debouncedSearch = useDebouncedValue(search, 300);

  const fromIso = useMemo(
    () => (from ? new Date(`${from}T00:00:00`).toISOString() : undefined),
    [from],
  );
  const toIso = useMemo(
    () => (to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined),
    [to],
  );

  const params = useMemo<AuditLogParams>(
    () => ({
      page: page - 1,
      size: pageSize,
      sort: "createdAt,desc",
      username: debouncedSearch.trim() || undefined,
      action: action === "ALL" ? undefined : action,
      from: fromIso,
      to: toIso,
    }),
    [page, pageSize, debouncedSearch, action, fromIso, toIso],
  );

  const query = useAuditLogsQuery(params);

  // Exact count for the trailing 24h — same filters, `size: 1`.
  const last24hQuery = useAuditActivityCount(
    new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    {
      username: debouncedSearch.trim() || undefined,
      action: action === "ALL" ? undefined : action,
      to: toIso,
    },
  );

  const filterCount = useMemo(
    () =>
      [debouncedSearch.trim(), action !== "ALL" ? action : "", from, to].filter(
        Boolean,
      ).length,
    [debouncedSearch, action, from, to],
  );

  const metrics = useMemo(() => {
    const content = query.data?.content ?? [];

    const actors = new Set(content.map((entry) => entry.username));

    const counts = new Map<string, number>();
    for (const entry of content) {
      counts.set(entry.action, (counts.get(entry.action) ?? 0) + 1);
    }

    let topAction: string | undefined;
    let topCount = 0;
    for (const [name, count] of counts) {
      if (count > topCount) {
        topAction = name;
        topCount = count;
      }
    }

    return {
      total: query.data?.page.totalElements ?? 0,
      last24h: last24hQuery.data ?? 0,
      actors: actors.size,
      topAction,
    };
  }, [query.data, last24hQuery.data]);

  // Auto-refresh while "live" is on. Errors surface inline; the last good
  // page stays put rather than being replaced by a spinner.
  useEffect(() => {
    if (!live) return;

    const interval = window.setInterval(() => {
      void query.refetch();
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(interval);
  }, [live, query.refetch]);

  const toggleLive = () => {
    const next = !live;
    setLive(next);

    if (next) void query.refetch();
  };

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const changeAction = (value: string) => {
    setAction(value);
    setPage(1);
  };

  const changeFrom = (value: string) => {
    setFrom(value);
    setPage(1);
  };

  const changeTo = (value: string) => {
    setTo(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setAction("ALL");
    setFrom("");
    setTo("");
    setPage(1);
  };

  const entries = query.data?.content ?? [];
  const totalRows = query.data?.page.totalElements ?? 0;
  const pageCount = Math.max(1, query.data?.page.totalPages ?? 1);

  const showSkeleton = query.isLoading && entries.length === 0;
  const showError = query.isError && entries.length === 0;
  const showEmpty = !showSkeleton && !showError && entries.length === 0;

  return (
    <div className="space-y-6">
      <ModuleHeader
        eyebrow={
          <Badge
            variant="neutral"
            className="border-white/20 bg-white/10 text-sky-300"
          >
            <ShieldCheck className="size-3.5" />
            Security &amp; compliance
          </Badge>
        }
        title="Audit log"
        description="Every sensitive action in GLMS, recorded in chronological order. The trail is append-only and visible to administrators."
        actions={<ExportButton params={params} />}
      />

      <section
        aria-label="Audit metrics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          label="Total events"
          value={formatNumber(metrics.total)}
          icon={ScrollText}
          isLoading={query.isLoading && entries.length === 0}
          caption={filterCount > 0 ? "matching filters" : "all time"}
        />

        <MetricCard
          label="Last 24 hours"
          value={formatNumber(metrics.last24h)}
          icon={Clock}
          tone="success"
          isLoading={last24hQuery.isLoading}
          caption="matching filters"
        />

        <MetricCard
          label="Unique actors"
          value={formatNumber(metrics.actors)}
          icon={UserRound}
          isLoading={query.isLoading && entries.length === 0}
          caption="on this page"
        />

        <MetricCard
          label="Most common action"
          value={metrics.topAction ? titleCase(metrics.topAction) : "—"}
          icon={Activity}
          isLoading={query.isLoading && entries.length === 0}
          caption="on this page"
        />
      </section>

      <SectionCard
        title="Activity trail"
        description="Newest first — click any event for its full record."
        contentClassName="p-0"
        action={
          <div className="flex items-center gap-2">
            <LiveIndicator live={live} onToggle={toggleLive} />

            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Refresh now"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              <RotateCw
                className={cn("size-4", query.isFetching && "animate-spin")}
              />
            </Button>
          </div>
        }
      >
        <div className="border-b border-neutral-100 p-4 sm:p-6">
          <AuditFilters
            search={search}
            onSearchChange={changeSearch}
            action={action}
            onActionChange={changeAction}
            from={from}
            onFromChange={changeFrom}
            to={to}
            onToChange={changeTo}
            filterCount={filterCount}
            onClear={clearFilters}
          />
        </div>

        <div className="px-3 py-2 sm:px-5">
          {query.isError && entries.length > 0 && (
            <div className="px-2 pb-2 pt-4">
              <InlineAlert variant="error">
                Couldn't refresh the trail — showing the last loaded events.
              </InlineAlert>
            </div>
          )}

          {showSkeleton && (
            <div className="px-3 py-3">
              <TimelineSkeleton />
            </div>
          )}

          {showError && (
            <ErrorState
              title="Couldn't load the audit trail"
              message={query.error ?? ""}
              onRetry={query.refetch}
            />
          )}

          {showEmpty && (
            <EmptyState
              icon={ScrollText}
              title={
                filterCount > 0
                  ? "No activity matches those filters"
                  : "No audit activity yet"
              }
              description={
                filterCount > 0
                  ? "Try widening the date range, or clear the filters to see the full trail."
                  : "Actions that get audited will appear here in chronological order."
              }
              action={
                filterCount > 0 ? (
                  <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          )}

          {!showSkeleton && !showError && entries.length > 0 && (
            <AuditTimeline
              key={`${page}:${pageSize}:${debouncedSearch}:${action}:${from}:${to}`}
              entries={entries}
              onSelect={setSelected}
            />
          )}
        </div>

        {!showSkeleton && !showError && totalRows > 0 && (
          <TablePagination
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            totalRows={totalRows}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        )}
      </SectionCard>

      <AuditDetailDialog entry={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
