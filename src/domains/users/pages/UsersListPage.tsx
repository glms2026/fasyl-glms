import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { TablePagination } from "@/components/common/TablePagination";
import { useDataTable } from "@/hooks/useDataTable";
import { formatDate, formatRelative, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

import { UserAvatar } from "../components/UserAvatar";
import { UserFilters } from "../components/UserFilters";
import { UserRowActions } from "../components/UserRowActions";
import { UserStatusBadge } from "../components/UserStatusBadge";
import { UsersTabs } from "../components/UsersTabs";
import { useUserActions } from "../hooks/useUserActions";
import { useUsersQuery } from "../hooks/useUsers";
import type { ManagedUser } from "../types";

export default function UsersListPage() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useUsersQuery();

  const [status, setStatus] = useState("ALL");
  const [role, setRole] = useState("ALL");

  const actions = useUserActions();

  const filters = useMemo(
    () => [
      (user: ManagedUser) => status === "ALL" || user.status === status,
      (user: ManagedUser) => role === "ALL" || user.role === role,
    ],
    [status, role],
  );

  const table = useDataTable<ManagedUser>({
    rows: data,
    searchFields: ["fullName", "username", "email"],
    initialSort: { field: "createdAt", direction: "desc" },
    filters,
  });

  const columns: Array<DataTableColumn<ManagedUser>> = [
    {
      id: "fullName",
      header: "Full name",
      sortField: "fullName",
      cell: (user) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={user.fullName} size="sm" />

          <div className="min-w-0">
            <p className="truncate font-medium text-neutral-900">
              {user.fullName}
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
      cell: (user) => (
        <span className="text-neutral-600">{user.username}</span>
      ),
    },
    {
      id: "email",
      header: "Email",
      sortField: "email",
      hideBelow: "md",
      cell: (user) => <span className="text-neutral-600">{user.email}</span>,
    },
    {
      id: "role",
      header: "Role",
      sortField: "role",
      cell: (user) => <Badge variant="outline">{titleCase(user.role)}</Badge>,
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
      id: "lastLoginAt",
      header: "Last login",
      sortField: "lastLoginAt",
      hideBelow: "xl",
      cell: (user) => (
        <span className="text-neutral-600">
          {user.lastLoginAt ? formatRelative(user.lastLoginAt) : "Never"}
        </span>
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
            onLock={actions.openLock}
            onSuspend={actions.openSuspend}
            onActivate={actions.openActivate}
            onResetPassword={actions.openResetPassword}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="All users"
        description="Search, filter and manage every account in GLMS."
        actions={
          <Link to="/users/new" className={cn(buttonVariants({ size: "lg" }), "px-4")}>
            <UserPlus className="size-4" />
            Create user
          </Link>
        }
      />

      <UsersTabs />

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 p-4 sm:p-6">
          <UserFilters
            search={table.search}
            onSearchChange={table.setSearch}
            status={status}
            onStatusChange={setStatus}
            role={role}
            onRoleChange={setRole}
          />
        </div>

        <DataTable
          caption="Users"
          columns={columns}
          rows={table.pageRows}
          getRowId={(user) => user.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          sort={table.sort}
          onToggleSort={table.toggleSort}
          onRowClick={(user) => navigate(`/users/${user.id}`)}
          empty={
            table.isFilteredEmpty ? (
              <EmptyState
                icon={Users}
                title="No users match those filters"
                description="Try a different search term, or clear the status and role filters."
              />
            ) : (
              <EmptyState
                icon={Users}
                title="No users yet"
                description="Create the first account to start assigning ledger access."
                action={
                  <Link
                    to="/users/new"
                    className={cn(buttonVariants({ size: "lg" }), "px-4")}
                  >
                    <UserPlus className="size-4" />
                    Create user
                  </Link>
                }
              />
            )
          }
        />

        {!isLoading && !error && table.totalRows > 0 && (
          <TablePagination
            page={table.page}
            pageCount={table.pageCount}
            pageSize={table.pageSize}
            totalRows={table.totalRows}
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
          />
        )}
      </div>

      {actions.dialogs}
    </div>
  );
}
