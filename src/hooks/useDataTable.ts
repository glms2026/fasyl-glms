import { useCallback, useMemo, useState } from "react";

import { useDebouncedValue } from "./useDebouncedValue";

export type SortDirection = "asc" | "desc";

export interface SortState<TRow> {
  field: keyof TRow;
  direction: SortDirection;
}

export interface UseDataTableOptions<TRow> {
  rows: TRow[] | undefined;
  /** Fields scanned by the search box. */
  searchFields: Array<keyof TRow>;
  initialSort?: SortState<TRow>;
  initialPageSize?: number;
  /** Extra predicates applied before search, keyed by filter name. */
  filters?: Array<(row: TRow) => boolean>;
}

export interface UseDataTableResult<TRow> {
  /** Rows for the current page. */
  pageRows: TRow[];
  /** Every row that survived filtering and search. */
  filteredRows: TRow[];
  search: string;
  setSearch: (value: string) => void;
  sort: SortState<TRow> | null;
  toggleSort: (field: keyof TRow) => void;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  pageCount: number;
  totalRows: number;
  /** True when filters or search hid everything, as opposed to no data at all. */
  isFilteredEmpty: boolean;
}

function compare(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;

  if (typeof a === "number" && typeof b === "number") return a - b;

  if (typeof a === "boolean" && typeof b === "boolean") {
    return Number(a) - Number(b);
  }

  const left = String(a);
  const right = String(b);

  const leftDate = Date.parse(left);
  const rightDate = Date.parse(right);

  if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate)) {
    return leftDate - rightDate;
  }

  return left.localeCompare(right, undefined, { sensitivity: "base" });
}

/**
 * Client-side search, sort and pagination for tables whose backing endpoint
 * returns a full collection. When paginated endpoints land, swap this for
 * server-driven params without changing the table components.
 */
export function useDataTable<TRow>({
  rows,
  searchFields,
  initialSort,
  initialPageSize = 10,
  filters,
}: UseDataTableOptions<TRow>): UseDataTableResult<TRow> {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState<TRow> | null>(initialSort ?? null);
  const [requestedPage, setRequestedPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const debouncedSearch = useDebouncedValue(search, 250);

  const filteredRows = useMemo(() => {
    const source = rows ?? [];

    const afterFilters = filters?.length
      ? source.filter((row) => filters.every((predicate) => predicate(row)))
      : source;

    const term = debouncedSearch.trim().toLowerCase();

    const afterSearch = term
      ? afterFilters.filter((row) =>
          searchFields.some((field) => {
            const value = row[field];
            return value != null && String(value).toLowerCase().includes(term);
          }),
        )
      : afterFilters;

    if (!sort) return afterSearch;

    return [...afterSearch].sort((a, b) => {
      const result = compare(a[sort.field], b[sort.field]);
      return sort.direction === "asc" ? result : -result;
    });
    // `filters` is rebuilt each render by callers, so depend on its contents
    // via the derived values the caller passes rather than identity.
  }, [rows, filters, debouncedSearch, searchFields, sort]);

  const totalRows = filteredRows.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));

  // Derived rather than corrected in an effect: when filtering shrinks the
  // result set, the visible page clamps immediately with no extra render.
  const page = Math.min(requestedPage, pageCount);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  // Anything that changes the result set sends the reader back to page one.
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setRequestedPage(1);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setRequestedPage(1);
  }, []);

  const toggleSort = useCallback((field: keyof TRow) => {
    setRequestedPage(1);

    setSort((current) => {
      if (!current || current.field !== field) {
        return { field, direction: "asc" };
      }

      if (current.direction === "asc") {
        return { field, direction: "desc" };
      }

      return null;
    });
  }, []);

  return {
    pageRows,
    filteredRows,
    search,
    setSearch: handleSearchChange,
    sort,
    toggleSort,
    page,
    setPage: setRequestedPage,
    pageSize,
    setPageSize: handlePageSizeChange,
    pageCount,
    totalRows,
    isFilteredEmpty: totalRows === 0 && (rows?.length ?? 0) > 0,
  };
}
