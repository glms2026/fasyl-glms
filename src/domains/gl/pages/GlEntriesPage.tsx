import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, FileText, Plus, TreePine } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/common/SearchInput";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { SectionCard } from "@/components/common/SectionCard";
import { TablePagination } from "@/components/common/TablePagination";
import { Select } from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { titleCase, formatDateTime } from "@/lib/format";

import { ModuleHeader } from "@/domains/users/components/ModuleHeader";
import { heroButtonClass } from "@/domains/users/components/heroStyles";

import { GlTabs } from "../components/GlTabs";

import { glService } from "../services/glService";
import { useApiQuery } from "@/hooks/useApiQuery";
import type { LedgerResponse, LedgerStatus } from "../types";

/* ------------------------------------------------------------------ */
/*  Status badge                                                      */
/* ------------------------------------------------------------------ */

const STATUS_STYLES: Record<LedgerStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  PROCESSING: "bg-blue-50 text-blue-700 ring-blue-200",
  SUBMITTED: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  INACTIVE: "bg-neutral-100 text-neutral-600 ring-neutral-200",
  SUSPENDED: "bg-red-50 text-red-700 ring-red-200",
};

function StatusBadge({ status }: { status: LedgerStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status] ?? "bg-neutral-100 text-neutral-600"}`}
    >
      {titleCase(status)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Leaf badge                                                        */
/* ------------------------------------------------------------------ */

function LeafBadge({ leaf }: { leaf: string }) {
  const isLeaf = leaf?.toUpperCase() === "Y";
  return (
    <Badge
      variant={isLeaf ? "success" : "info"}
      className="inline-flex items-center gap-1"
    >
      {isLeaf ? <TreePine className="size-3" /> : <FileText className="size-3" />}
      {isLeaf ? "Leaf" : "Header"}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

type SortDirection = "asc" | "desc";

export default function GlEntriesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [leafFilter, setLeafFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [sort, setSort] = useState<{
    field: keyof LedgerResponse;
    direction: SortDirection;
  } | null>({ field: "createdAt", direction: "desc" });

  const sortParam = sort ? `${String(sort.field)},${sort.direction}` : undefined;

  const { data, isLoading, error, refetch } = useApiQuery(
    ["gl:entries", page - 1, pageSize, sortParam].join(":"),
    () =>
      glService.list({
        page: page - 1,
        size: pageSize,
        sort: sortParam,
      }),
  );

  const debouncedSearch = useDebouncedValue(search, 250);

  const rows = useMemo(() => {
    const content = data?.content ?? [];
    const term = debouncedSearch.trim().toLowerCase();

    return content.filter((ledger) => {
      const matchesType =
        typeFilter === "ALL" ||
        ledger.ledgerType?.toUpperCase() === typeFilter;
      const matchesLeaf =
        leafFilter === "ALL" ||
        ledger.leaf?.toUpperCase() === leafFilter;
      const matchesStatus =
        statusFilter === "ALL" || ledger.status === statusFilter;

      if (!matchesType || !matchesLeaf || !matchesStatus) return false;
      if (!term) return true;

      const haystack = [
        ledger.ledgerCode,
        ledger.description,
        ledger.ledgerType,
        ledger.leaf,
        ledger.status,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [data, typeFilter, leafFilter, statusFilter, debouncedSearch]);

  const toggleSort = (field: keyof LedgerResponse) => {
    setPage(1);
    setSort((current) => {
      if (!current || current.field !== field) {
        return { field, direction: "asc" };
      }
      return {
        field,
        direction: current.direction === "asc" ? "desc" : "asc",
      };
    });
  };

  const columns: Array<DataTableColumn<LedgerResponse>> = [
    {
      id: "ledgerCode",
      header: "Ledger Code",
      sortField: "ledgerCode",
      cell: (row) => (
        <button
          onClick={() => navigate(`/gl/${row.id}`)}
          className="font-mono text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
        >
          {row.ledgerCode}
        </button>
      ),
    },
    {
      id: "description",
      header: "Description",
      sortField: "description",
      cell: (row) => (
        <span className="text-neutral-700">{row.description}</span>
      ),
    },
    {
      id: "ledgerType",
      header: "Ledger Type",
      sortField: "ledgerType",
      cell: (row) => (
        <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
          {titleCase(row.ledgerType)}
        </span>
      ),
    },
    {
      id: "leaf",
      header: "Leaf",
      cell: (row) => <LeafBadge leaf={row.leaf} />,
    },
    {
      id: "status",
      header: "Status",
      sortField: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "createdAt",
      header: "Created",
      sortField: "createdAt",
      hideBelow: "md",
      cell: (row) => (
        <span className="text-neutral-500 text-sm">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
  ];

  const totalRows = data?.totalElements ?? 0;
  const pageCount = Math.max(1, data?.totalPages ?? 1);
  const filterActive =
    typeFilter !== "ALL" || leafFilter !== "ALL" || statusFilter !== "ALL" || debouncedSearch !== "";

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Ledger Entries"
        description="Browse all accounts in the general ledger."
        actions={
          <Link to="/gl/create" className={heroButtonClass}>
            <Plus className="size-4" />
            Create Ledger Account
          </Link>
        }
      />

      <GlTabs />

      <SectionCard>
        <div className="border-b border-neutral-100 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              label="Search entries"
              placeholder="Search by code, description, or type"
              className="sm:max-w-sm sm:flex-1"
            />

            <div className="flex gap-3">
              <Select
                aria-label="Filter by type"
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                className="sm:w-36"
              >
                <option value="ALL">All types</option>
                <option value="ASSET">Asset</option>
                <option value="LIABILITY">Liability</option>
                <option value="EQUITY">Equity</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </Select>

              <Select
                aria-label="Filter by leaf"
                value={leafFilter}
                onChange={(e) => { setLeafFilter(e.target.value); setPage(1); }}
                className="sm:w-32"
              >
                <option value="ALL">All</option>
                <option value="Y">Leaf</option>
                <option value="N">Header</option>
              </Select>

              <Select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="sm:w-36"
              >
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </Select>
            </div>
          </div>
        </div>

        <DataTable
          caption="Ledger Entries"
          columns={columns}
          rows={rows}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          sort={sort}
          onToggleSort={toggleSort}
          separated
          empty={
            filterActive ? (
              <EmptyState
                icon={BookOpen}
                title="No entries match those filters"
                description="Try a different search term, or clear the filters."
              />
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No ledger entries yet"
                description="Create the first account to populate the ledger."
                action={
                  <Link
                    to="/gl/create"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    <Plus className="size-4" />
                    Create Ledger Account
                  </Link>
                }
              />
            )
          }
        />

        {!isLoading && !error && totalRows > 0 && (
          <TablePagination
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            pageSizeOptions={[12, 25, 50]}
            totalRows={totalRows}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        )}
      </SectionCard>
    </div>
  );
}
