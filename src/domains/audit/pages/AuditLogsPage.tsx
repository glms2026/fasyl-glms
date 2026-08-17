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
import { formatNumber, titleCase, toUtcDate } from "@/lib/format";
import { cn } from "@/lib/utils";

import { AuditDetailDialog } from "../components/AuditDetailDialog";
import { AuditFilters } from "../components/AuditFilters";
import { AuditTable } from "../components/AuditTable";
import { ExportButton } from "../components/ExportButton";
import { LiveIndicator } from "../components/LiveIndicator";
import { useAuditLogsQuery } from "../hooks/useAuditLogs";
import type { AuditLogEntry } from "../types";

const PAGE_SIZE = 25;
const PAGE_SIZE_OPTIONS = [25, 50];
const AUTO_REFRESH_MS = 60_000;
const DAY_MS = 24 * 60 * 60 * 1000;

function TableSkeleton() {
  return (
    <div aria-hidden="true" className="overflow-x-auto">
      <div className="min-w-[52rem]">
        {/* Header row. */}
        <div className="flex gap-6 border-b border-neutral-200 bg-gradient-to-b from-neutral-50 to-white px-6 py-3.5">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="ml-auto h-3.5 w-14" />
        </div>

        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-6 border-b border-neutral-100 py-4 pr-6 pl-[calc(1.5rem+3px)]"
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="ml-auto h-4 w-20" />
          </div>
        ))}
      </div>
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

  // The whole trail, newest first. The backend's /search endpoint 500s on
  // every request, so filtering happens here instead of server-side.
  const query = useAuditLogsQuery();
  const { refetch } = query;
  const allEvents = useMemo(() => query.data ?? [], [query.data]);

  // Client-side equivalents of the server-side search filters: username is a
  // case-insensitive substring, action is exact, dates bound the local day.
  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    const fromMs = from
      ? new Date(`${from}T00:00:00`).getTime()
      : Number.NEGATIVE_INFINITY;
    const toMs = to
      ? new Date(`${to}T23:59:59.999`).getTime()
      : Number.POSITIVE_INFINITY;

    return allEvents.filter((entry) => {
      if (term && !entry.username.toLowerCase().includes(term)) return false;
      if (action !== "ALL" && entry.action !== action) return false;

      const time = toUtcDate(entry.createdAt).getTime();
      if (time < fromMs || time > toMs) return false;

      return true;
    });
  }, [allEvents, debouncedSearch, action, from, to]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  // A filter change can shrink the results below the current page — clamp to
  // the last valid page instead of showing an empty page.
  const safePage = Math.min(page, pageCount);

  const pageEntries = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  const filterCount = useMemo(
    () =>
      [debouncedSearch.trim(), action !== "ALL" ? action : "", from, to].filter(
        Boolean,
      ).length,
    [debouncedSearch, action, from, to],
  );

  const metrics = useMemo(() => {
    const actors = new Set(filtered.map((entry) => entry.username));

    const counts = new Map<string, number>();
    for (const entry of filtered) {
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

    const cutoff = now - DAY_MS;
    const last24h = filtered.filter(
      (entry) => toUtcDate(entry.createdAt).getTime() >= cutoff,
    ).length;

    return {
      total: filtered.length,
      last24h,
      actors: actors.size,
      topAction,
    };
  }, [filtered, now]);

  // Auto-refresh while "live" is on. Errors surface inline; the last good
  // page stays put rather than being replaced by a spinner.
  useEffect(() => {
    if (!live) return;

    const interval = window.setInterval(() => {
      void refetch();
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(interval);
  }, [live, refetch]);

  const toggleLive = () => {
    const next = !live;
    setLive(next);

    if (next) void refetch();
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

  const showSkeleton = query.isLoading && allEvents.length === 0;
  const showError = query.isError && allEvents.length === 0;
  const showEmpty = !showSkeleton && !showError && filtered.length === 0;

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
        actions={<ExportButton entries={filtered} />}
      />

      <section
        aria-label="Audit metrics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          label="Total events"
          value={formatNumber(metrics.total)}
          icon={ScrollText}
          isLoading={query.isLoading && allEvents.length === 0}
          caption={filterCount > 0 ? "matching filters" : "all time"}
        />

        <MetricCard
          label="Last 24 hours"
          value={formatNumber(metrics.last24h)}
          icon={Clock}
          tone="success"
          isLoading={query.isLoading && allEvents.length === 0}
          caption="matching filters"
        />

        <MetricCard
          label="Unique actors"
          value={formatNumber(metrics.actors)}
          icon={UserRound}
          isLoading={query.isLoading && allEvents.length === 0}
          caption={filterCount > 0 ? "matching filters" : "all time"}
        />

        <MetricCard
          label="Most common action"
          value={metrics.topAction ? titleCase(metrics.topAction) : "—"}
          icon={Activity}
          isLoading={query.isLoading && allEvents.length === 0}
          caption={filterCount > 0 ? "matching filters" : "all time"}
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
              onClick={() => void refetch()}
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
          {query.isError && allEvents.length > 0 && (
            <div className="px-2 pb-2 pt-4">
              <InlineAlert variant="error">
                Couldn't refresh the trail — showing the last loaded events.
              </InlineAlert>
            </div>
          )}

          {showSkeleton && (
            <div className="px-3 py-3">
              <TableSkeleton />
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          )}

          {!showSkeleton && !showError && pageEntries.length > 0 && (
            <AuditTable
              key={`${safePage}:${pageSize}:${debouncedSearch}:${action}:${from}:${to}`}
              entries={pageEntries}
              onSelect={setSelected}
            />
          )}
        </div>

        {!showSkeleton && !showError && filtered.length > 0 && (
          <TablePagination
            page={safePage}
            pageCount={pageCount}
            pageSize={pageSize}
            totalRows={filtered.length}
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
