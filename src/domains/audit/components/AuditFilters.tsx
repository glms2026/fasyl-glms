import { FilterX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/DatePicker";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/common/SearchInput";
import { titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

import { knownAuditActions } from "../data/actions";

interface AuditFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  action: string;
  onActionChange: (value: string) => void;
  /** Local yyyy-mm-dd strings, converted to ISO before hitting the API. */
  from: string;
  onFromChange: (value: string) => void;
  to: string;
  onToChange: (value: string) => void;
  /** Number of active filters — hides the clear button when zero. */
  filterCount: number;
  onClear: () => void;
}

export function AuditFilters({
  search,
  onSearchChange,
  action,
  onActionChange,
  from,
  onFromChange,
  to,
  onToChange,
  filterCount,
  onClear,
}: AuditFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <SearchInput
        label="Search by username"
        placeholder="Search by username…"
        value={search}
        onChange={onSearchChange}
        className="min-w-[13rem] flex-1"
      />

      <div className="min-w-[11rem] flex-1">
        <Select
          aria-label="Filter by action"
          value={action}
          onChange={(event) => onActionChange(event.target.value)}
          className="h-10 border-neutral-300 text-sm"
        >
          <option value="ALL">All actions</option>

          {knownAuditActions.map((name) => (
            <option key={name} value={name}>
              {titleCase(name)}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex min-w-[13rem] flex-1 items-center gap-3">
        <div className="min-w-0 flex-1">
          <DatePicker
            label="From date"
            value={from}
            onChange={onFromChange}
            max={to || undefined}
          />
        </div>

        <span aria-hidden="true" className="shrink-0 text-neutral-300">
          →
        </span>

        <div className="min-w-0 flex-1">
          <DatePicker
            label="To date"
            value={to}
            onChange={onToChange}
            min={from || undefined}
          />
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClear}
        disabled={filterCount === 0}
        className={cn(
          "shrink-0 text-neutral-500",
          filterCount > 0 && "text-primary",
        )}
      >
        <FilterX className="size-4" />
        Clear
        {filterCount > 0 && (
          <span className="ml-0.5 inline-flex size-5 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {filterCount}
          </span>
        )}
      </Button>
    </div>
  );
}
