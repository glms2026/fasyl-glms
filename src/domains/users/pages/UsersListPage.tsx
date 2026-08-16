import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { TablePagination } from "@/components/common/TablePagination";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatDate, titleCase } from "@/lib/format";

import { ModuleHeader } from "../components/ModuleHeader";
import { heroButtonClass } from "../components/heroStyles";
import { UserAvatar } from "../components/UserAvatar";
import { UserFilters } from "../components/UserFilters";
import { UserRowActions } from "../components/UserRowActions";
import { UserStatusBadge } from "../components/UserStatusBadge";
import { UsersTabs } from "../components/UsersTabs";
import { useAccess } from "../hooks/useAccess";
import { useUserActions } from "../hooks/useUserActions";
import { useUsersQuery } from "../hooks/useUsers";
import { useRolesCatalogue } from "../hooks/useRoles";
import { userFullName, type ManagedUser } from "../types";

type SortDirection = "asc" | "desc";

function RoleBadges({ roles }: { roles: string[] }) {
  const shown = roles.slice(0, 2);
  const extra = roles.length - shown.length;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((role) => (
        <Badge key={role} variant="outline">
          {titleCase(role)}
        </Badge>
      ))}

      {extra > 0 && (
        <Badge variant="neutral">+{extra}</Badge>
      )}
    </div>
  );
}

export default function UsersListPage() {
  const navigate = useNavigate();

  const [status, setStatus] = useState("ALL");
  const [role, setRole] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<{
    field: keyof ManagedUser;
    direction: SortDirection;
  } | null>({ field: "createdAt", direction: "desc" });

  const sortParam = sort ? `${String(sort.field)},${sort.direction}` : undefined;

  const { data, isLoading, error, refetch } = useUsersQuery({
    page: page - 1,
    size: pageSize,
    sort: sortParam,
  });

  const debouncedSearch = useDebouncedValue(search, 250);

  // Search and the status/role filters run against the loaded page — the
  // backend only paginates, it doesn't search. Pagination itself is server
  // driven, so the page controls are always accurate.
  const rows = useMemo(() => {
    const content = data?.content ?? [];
    const term = debouncedSearch.trim().toLowerCase();

    return content.filter((user) => {
      const matchesStatus = status === "ALL" || user.status === status;
      const matchesRole = role === "ALL" || user.roles.includes(role);

      if (!matchesStatus || !matchesRole) return false;

      if (!term) return true;

      const haystack = [
        user.firstName,
        user.lastName,
        user.username,
        user.email,
        ...user.roles,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [data, status, role, debouncedSearch]);

  const changeStatus = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const changeRole = (value: string) => {
    setRole(value);
    setPage(1);
  };

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const toggleSort = (field: keyof ManagedUser) => {
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

  const actions = useUserActions();
  const access = useAccess();
  const catalogue = useRolesCatalogue();

  const roleOptions =
    catalogue.data?.map((role) => role.name) ?? undefined;

  const columns: Array<DataTableColumn<ManagedUser>> = [
    {
      id: "name",
      header: "Full name",
      sortField: "firstName",
      cell: (user) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={userFullName(user)} size="sm" />

          <div className="min-w-0">
            <p className="truncate font-medium text-neutral-900">
              {userFullName(user)}
            </p>

            <p className="truncate text-xs text-neutral-500 md:hidden">
              {user.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "username",
      header: "Username",
      sortField: "username",
      hideBelow: "lg",
      cell: (user) => <span className="text-neutral-600">{user.username}</span>,
    },
    {
      id: "email",
      header: "Email",
      sortField: "email",
      hideBelow: "md",
      cell: (user) => <span className="text-neutral-600">{user.email}</span>,
    },
    {
      id: "roles",
      header: "Roles",
      cell: (user) => <RoleBadges roles={user.roles} />,
    },
    {
      id: "status",
      header: "Status",
      sortField: "status",
      cell: (user) => <UserStatusBadge status={user.status} />,
    },
    {
      id: "createdAt",
      header: "Date created",
      sortField: "createdAt",
      hideBelow: "xl",
      cell: (user) => (
        <span className="text-neutral-600">{formatDate(user.createdAt)}</span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      cell: (user) => (
        <div
          className="flex justify-end"
          onClick={(event) => event.stopPropagation()}
        >
          <UserRowActions
            user={user}
            onView={(target) => navigate(`/users/${target.id}`)}
            onEdit={(target) => navigate(`/users/${target.id}/edit`)}
            onAssignRoles={actions.openAssignRoles}
            onLock={actions.openLock}
            onUnlock={actions.openUnlock}
            onSuspend={actions.openSuspend}
            onUnsuspend={actions.openUnsuspend}
            onDeactivate={actions.openDeactivate}
            onActivate={actions.openActivate}
            onDelete={actions.openDelete}
          />
        </div>
      ),
    },
  ];

  const totalRows = data?.totalElements ?? 0;
  const pageCount = Math.max(1, data?.totalPages ?? 1);
  const filterActive = status !== "ALL" || role !== "ALL" || debouncedSearch !== "";

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="All users"
        description="Search, filter and manage every account in GLMS. Sensitive changes are queued for approval."
        actions={
          access.canMakeChanges && (
            <Link to="/users/new" className={heroButtonClass}>
              <UserPlus className="size-4" />
              Create user
            </Link>
          )
        }
      />

      <UsersTabs />

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 p-4 sm:p-6">
          <UserFilters
            search={search}
            onSearchChange={changeSearch}
            status={status}
            onStatusChange={changeStatus}
            role={role}
            onRoleChange={changeRole}
            roleOptions={roleOptions}
          />
        </div>

        <DataTable
          caption="Users"
          columns={columns}
          rows={rows}
          getRowId={(user) => user.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          sort={sort}
          onToggleSort={toggleSort}
          onRowClick={(user) => navigate(`/users/${user.id}`)}
          empty={
            filterActive ? (
              <EmptyState
                icon={Users}
                title="No users match those filters"
                description="Try a different search term, or clear the status and role filters. Search applies to the page you're viewing."
              />
            ) : (
              <EmptyState
                icon={Users}
                title="No users yet"
                description="Create the first account to start assigning ledger access."
                action={
                  access.canMakeChanges ? (
                    <Link to="/users/new" className={heroButtonClass}>
                      <UserPlus className="size-4" />
                      Create user
                    </Link>
                  ) : undefined
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
            totalRows={totalRows}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        )}
      </div>

      {actions.dialogs}
    </div>
  );
}
