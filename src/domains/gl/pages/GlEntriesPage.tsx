import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import type { GlAccount } from "../types";

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
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [leafFilter, setLeafFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [sort, setSort] = useState<{
    field: keyof GlAccount;
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

    return content.filter((account) => {
      const matchesType =
        typeFilter === "ALL" ||
        account.accountType?.toUpperCase() === typeFilter;
      const matchesLeaf =
        leafFilter === "ALL" ||
        account.leaf?.toUpperCase() === leafFilter;

      if (!matchesType || !matchesLeaf) return false;
      if (!term) return true;

      const haystack = [
        account.accountCode,
        account.accountName,
        account.accountType,
        account.leaf,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [data, typeFilter, leafFilter, debouncedSearch]);

  const toggleSort = (field: keyof GlAccount) => {
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

  const columns: Array<DataTableColumn<GlAccount>> = [
    {
      id: "accountCode",
      header: "GL Code",
      sortField: "accountCode",
      cell: (row) => (
        <span className="font-mono text-sm font-semibold text-neutral-900">
          {row.accountCode}
        </span>
      ),
    },
    {
      id: "accountName",
      header: "GL Description",
      sortField: "accountName",
      cell: (row) => (
        <span className="text-neutral-700">{row.accountName}</span>
      ),
    },
    {
      id: "accountType",
      header: "GL Type",
      sortField: "accountType",
      cell: (row) => (
        <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
          {titleCase(row.accountType)}
        </span>
      ),
    },
    {
      id: "leaf",
      header: "Leaf",
      cell: (row) => <LeafBadge leaf={row.leaf} />,
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
    typeFilter !== "ALL" || leafFilter !== "ALL" || debouncedSearch !== "";

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="GL Entries"
        description="Browse all accounts in the general ledger."
        actions={
          <Link to="/gl/create" className={heroButtonClass}>
            <Plus className="size-4" />
            Create GL Account
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
              placeholder="Search by code, name, or type"
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
            </div>
          </div>
        </div>

        <DataTable
          caption="GL Entries"
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
                description="Try a different search term, or clear the type and leaf filters."
              />
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No GL entries yet"
                description="Create the first account to populate the ledger."
                action={
                  <Link
                    to="/gl/create"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    <Plus className="size-4" />
                    Create GL Account
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
