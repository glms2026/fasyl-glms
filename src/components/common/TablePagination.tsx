import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

interface TablePaginationProps {
  page: number;
  pageCount: number;
  pageSize: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export function TablePagination({
  page,
  pageCount,
  pageSize,
  totalRows,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [12, 25, 50],
}: TablePaginationProps) {
  const firstRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(page * pageSize, totalRows);

  return (
    <nav
      aria-label="Table pagination"
      className="flex flex-col items-center justify-between gap-4 border-t border-neutral-100 px-6 py-4 sm:flex-row"
    >
      <p className="text-sm text-neutral-500">
        Showing <span className="font-medium text-neutral-700">{firstRow}</span>
        {"–"}
        <span className="font-medium text-neutral-700">{lastRow}</span> of{" "}
        <span className="font-medium text-neutral-700">{totalRows}</span>
      </p>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label
            htmlFor="rows-per-page"
            className="text-sm whitespace-nowrap text-neutral-500"
          >
            Rows per page
          </label>

          <Select
            id="rows-per-page"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-8 w-[4.5rem] text-sm"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>

          <span className="px-2 text-sm tabular-nums text-neutral-600">
            {page} / {pageCount}
          </span>

          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
