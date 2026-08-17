import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { SortState } from "@/hooks/useDataTable";

import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { InlineAlert } from "./InlineAlert";

export interface DataTableColumn<TRow> {
  id: string;
  header: string;
  cell: (row: TRow) => ReactNode;
  /** Set to make the header a sort control. */
  sortField?: keyof TRow;
  align?: "left" | "right" | "center";
  className?: string;
  /** Hide below the given breakpoint to keep narrow screens readable. */
  hideBelow?: "sm" | "md" | "lg" | "xl";
}

interface DataTableProps<TRow> {
  columns: Array<DataTableColumn<TRow>>;
  rows: TRow[];
  getRowId: (row: TRow) => string | number;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  empty?: ReactNode;
  sort?: SortState<TRow> | null;
  onToggleSort?: (field: keyof TRow) => void;
  onRowClick?: (row: TRow) => void;
  skeletonRows?: number;
  caption?: string;
  /** Per-row classes, e.g. a colour wash keyed on row state. */
  rowClassName?: (row: TRow) => string | undefined;
  /** Render rows as separated bands with vertical spacing between them. */
  separated?: boolean;
}

const alignment = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

const hideBelowClass = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
} as const;

/**
 * Presentational table. Search, sort and pagination state come from
 * `useDataTable`; this component only renders what it is handed, including
 * its loading, error and empty states.
 */
export function DataTable<TRow>({
  columns,
  rows,
  getRowId,
  isLoading = false,
  error = null,
  onRetry,
  empty,
  sort,
  onToggleSort,
  onRowClick,
  skeletonRows = 6,
  caption,
  rowClassName,
  separated = false,
}: DataTableProps<TRow>) {
  if (error && rows.length === 0) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (!isLoading && rows.length === 0) {
    return <>{empty ?? <EmptyState title="Nothing to show yet" />}</>;
  }

  return (
    <div className="w-full overflow-x-auto scrollbar-thin">
      {error && (
        <div className="flex flex-col gap-2 border-b border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <InlineAlert variant="error">
            Couldn't refresh this data — showing the last loaded results
            instead.
          </InlineAlert>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50"
            >
              Retry
            </button>
          )}
        </div>
      )}

      <table
        className={cn(
          "w-full min-w-[46rem] text-sm",
          separated ? "border-separate border-spacing-y-2" : "border-collapse",
        )}
      >
        {caption && <caption className="sr-only">{caption}</caption>}

        <thead>
          <tr className="border-b border-neutral-200">
            {columns.map((column) => {
              const sortable = Boolean(column.sortField && onToggleSort);
              const isSorted = sort?.field === column.sortField;

              return (
                <th
                  key={column.id}
                  scope="col"
                  aria-sort={
                    isSorted
                      ? sort?.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : sortable
                        ? "none"
                        : undefined
                  }
                  className={cn(
                    "bg-gradient-to-b from-neutral-50 to-white px-6 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500",
                    alignment[column.align ?? "left"],
                    column.hideBelow && hideBelowClass[column.hideBelow],
                    column.className,
                  )}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => onToggleSort?.(column.sortField as keyof TRow)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded transition-colors hover:text-neutral-800",
                        isSorted && "text-neutral-900",
                      )}
                    >
                      {column.header}

                      {isSorted ? (
                        sort?.direction === "asc" ? (
                          <ArrowUp className="size-3" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="size-3" aria-hidden="true" />
                        )
                      ) : (
                        <ChevronsUpDown
                          className="size-3 text-neutral-300"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody className={separated ? undefined : "divide-y divide-neutral-100"}>
          {isLoading
            ? Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`}>
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={cn(
                        "px-6 py-4",
                        column.hideBelow && hideBelowClass[column.hideBelow],
                      )}
                    >
                      <Skeleton className="h-4 w-full max-w-[8rem]" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row) => {
                const customRowClass = rowClassName?.(row);

                return (
                  <tr
                    key={getRowId(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "transition-colors",
                      onRowClick && "cursor-pointer",
                      customRowClass ??
                        (onRowClick
                          ? "hover:bg-neutral-50"
                          : "hover:bg-neutral-50/60"),
                    )}
                  >
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={cn(
                        "px-6 py-4 align-middle text-neutral-700",
                        alignment[column.align ?? "left"],
                        column.hideBelow && hideBelowClass[column.hideBelow],
                      )}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}
