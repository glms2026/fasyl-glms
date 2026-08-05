import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { SortState } from "@/hooks/useDataTable";

import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";

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
}: DataTableProps<TRow>) {
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (!isLoading && rows.length === 0) {
    return <>{empty ?? <EmptyState title="Nothing to show yet" />}</>;
  }

  return (
    <div className="w-full overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[46rem] border-collapse text-sm">
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
                    "bg-neutral-50/80 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500",
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

        <tbody className="divide-y divide-neutral-100">
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
            : rows.map((row) => (
                <tr
                  key={getRowId(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "transition-colors",
                    onRowClick
                      ? "cursor-pointer hover:bg-neutral-50"
                      : "hover:bg-neutral-50/60",
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
              ))}
        </tbody>
      </table>
    </div>
  );
}
