import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  KeyRound,
  Lock,
  UserPlus,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { MetricCard } from "@/components/common/MetricCard";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { cn } from "@/lib/utils";

import { useAllUsersQuery } from "@/domains/users/hooks/useUsers";
import { usePendingApprovalsQuery } from "@/domains/users/hooks/useApprovals";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const statusBadge: Record<string, { className: string; icon: typeof CheckCircle2 }> = {
  ACTIVE: { className: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  PENDING: { className: "bg-amber-100 text-amber-700", icon: Clock },
  LOCKED: { className: "bg-red-100 text-red-700", icon: Lock },
  SUSPENDED: { className: "bg-orange-100 text-orange-700", icon: AlertTriangle },
};

export function ControlDashboard() {
  const { user } = useAuth();
  const usersQuery = useAllUsersQuery();
  const approvalsQuery = usePendingApprovalsQuery({ page: 0, size: 10 }, true);

  const users = usersQuery.data ?? [];
  const pendingApprovals = approvalsQuery.data?.content ?? [];
  const lockedUsers = users.filter((u) => u.status === "LOCKED");
  const suspendedUsers = users.filter((u) => u.status === "SUSPENDED");
  const recentUsers = users.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header with sky blue accent */}
      <PageHeader
        title={`${greeting()}, ${user?.username ?? "there"}`}
        description="Maker workspace — create and manage users"
        eyebrow={<Badge className="bg-sky-100 text-sky-700">Control</Badge>}
        actions={
          <Link
            to="/users/new"
            className={cn(buttonVariants({ size: "lg" }), "px-4")}
          >
            <UserPlus className="size-4" />
            Create user
          </Link>
        }
      />

      {/* Metrics row — 4 cards with sky gradient */}
      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Users"
          value={users.length}
          icon={UserPlus}
          isLoading={usersQuery.isLoading}
        />
        <MetricCard
          label="Pending Approvals"
          value={pendingApprovals.length}
          icon={Clock}
          tone="warning"
          isLoading={approvalsQuery.isLoading}
        />
        <MetricCard
          label="Locked Accounts"
          value={lockedUsers.length}
          icon={Lock}
          tone="destructive"
          isLoading={usersQuery.isLoading}
        />
        <MetricCard
          label="Suspended Accounts"
          value={suspendedUsers.length}
          icon={AlertTriangle}
          tone="warning"
          isLoading={usersQuery.isLoading}
        />
      </section>

      {/* Main content — 2/3 + 1/3 */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Recently created users */}
        <SectionCard
          title="Recently Created Users"
          description="Users you've added to the system"
          className="xl:col-span-2"
          action={
            <Link
              to="/users/list"
              className="text-sm font-medium text-sky-600 hover:underline"
            >
              View all
            </Link>
          }
        >
          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 text-left text-xs font-medium uppercase text-neutral-500">
                  <th className="pb-3 pr-4">User</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recentUsers.map((u) => {
                  const badge = statusBadge[u.status] || statusBadge.ACTIVE;
                  const BadgeIcon = badge.icon;
                  return (
                    <tr key={u.id} className="hover:bg-sky-50/50">
                      <td className="py-3 pr-4">
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-neutral-500">{u.email}</p>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline" className="text-xs">
                          {u.roles[0]}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", badge.className)}>
                          <BadgeIcon className="size-3" />
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-neutral-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Quick actions */}
        <div className="space-y-6">
          <SectionCard title="Quick Actions">
            <ul className="space-y-2">
              <li>
                <Link
                  to="/users/new"
                  className="flex items-center gap-3 rounded-xl border border-sky-200 p-3 transition-colors hover:border-sky-400 hover:bg-sky-50"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                    <UserPlus className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-neutral-900">Create user</span>
                    <span className="block truncate text-xs text-neutral-500">Add a new account</span>
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/users/list"
                  className="flex items-center gap-3 rounded-xl border border-sky-200 p-3 transition-colors hover:border-sky-400 hover:bg-sky-50"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                    <Users className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-neutral-900">Manage users</span>
                    <span className="block truncate text-xs text-neutral-500">View and edit accounts</span>
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/roles-permissions"
                  className="flex items-center gap-3 rounded-xl border border-sky-200 p-3 transition-colors hover:border-sky-400 hover:bg-sky-50"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                    <KeyRound className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-neutral-900">Roles & Permissions</span>
                    <span className="block truncate text-xs text-neutral-500">Configure access</span>
                  </span>
                </Link>
              </li>
            </ul>
          </SectionCard>

          {/* Pending approvals summary */}
          <SectionCard title="Pending Approvals">
            <div className="space-y-3">
              {pendingApprovals.slice(0, 3).map((approval) => (
                <div key={approval.id} className="flex items-center gap-3 rounded-lg border border-sky-100 bg-sky-50 p-3">
                  <Clock className="size-4 text-sky-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900">{approval.action.replace(/_/g, " ")}</p>
                    <p className="text-xs text-neutral-500">by {approval.makerUsername}</p>
                  </div>
                  <span className="text-xs text-neutral-400">{approval.createdAt ? new Date(approval.createdAt).toLocaleDateString() : "N/A"}</span>
                </div>
              ))}
              {pendingApprovals.length === 0 && (
                <p className="text-sm text-neutral-500">No pending approvals</p>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
