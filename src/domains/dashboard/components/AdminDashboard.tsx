import { Link } from "react-router-dom";
import {
  ClipboardCheck,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { MetricCard } from "@/components/common/MetricCard";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { PendingApprovalsList } from "@/domains/users/components/PendingApprovalsList";
import {
  ApprovalTrendChart,
  DistributionChart,
  ROLE_PALETTES,
  RoleBarChart,
  UserGrowthChart,
} from "@/domains/users/components/UserCharts";
import { usePendingApprovalsQuery } from "@/domains/users/hooks/useApprovals";
import { useAllUsersQuery } from "@/domains/users/hooks/useUsers";
import { cn } from "@/lib/utils";

import {
  deriveApprovalTrend,
  deriveRoleDistribution,
  deriveStatusDistribution,
  deriveUserGrowth,
} from "../data/chartData";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function AdminDashboard() {
  const { user } = useAuth();
  const usersQuery = useAllUsersQuery();
  const approvalsQuery = usePendingApprovalsQuery({ page: 0, size: 100 }, true);

  const users = usersQuery.data ?? [];
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "ACTIVE").length;
  const pendingApprovals = approvalsQuery.data?.content ?? [];

  // Derive chart data from live API responses
  const userGrowthData = deriveUserGrowth(users);
  const statusDistData = deriveStatusDistribution(users);
  const roleDistData = deriveRoleDistribution(users);
  const approvalTrendData = deriveApprovalTrend(pendingApprovals);

  return (
    <div className="space-y-6">
      {/* Header with indigo accent */}
      <PageHeader
        title={`${greeting()}, ${user?.username ?? "there"}`}
        description="Command center — full system overview"
        eyebrow={<Badge className="bg-indigo-100 text-indigo-700">Administrator</Badge>}
        actions={
          <>
            <Link
              to="/users/new"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-4")}
            >
              <UserPlus className="size-4" />
              Add user
            </Link>
            <Link
              to="/gl/create"
              className={cn(buttonVariants({ size: "lg" }), "px-4")}
            >
              Create GL
            </Link>
          </>
        }
      />

      {/* Metrics row */}
      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Users"
          value={totalUsers}
          icon={Users}
          isLoading={usersQuery.isLoading}
        />
        <MetricCard
          label="Active Users"
          value={activeUsers}
          icon={Users}
          tone="success"
          isLoading={usersQuery.isLoading}
        />
        <MetricCard
          label="Pending Approvals"
          value={pendingApprovals.length}
          icon={ClipboardCheck}
          tone="warning"
          isLoading={approvalsQuery.isLoading}
        />
        <MetricCard
          label="Locked Accounts"
          value={users.filter((u) => u.status === "LOCKED").length}
          icon={Shield}
          tone="destructive"
          isLoading={usersQuery.isLoading}
        />
      </section>

      {/* Charts row 1 — user growth + approval trend */}
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="User Growth"
          description="Cumulative users over time"
        >
          <UserGrowthChart data={userGrowthData} isLoading={usersQuery.isLoading} />
        </SectionCard>

        <SectionCard
          title="Approval Activity"
          description="Pending, approved and rejected requests"
        >
          <ApprovalTrendChart data={approvalTrendData} isLoading={approvalsQuery.isLoading} />
        </SectionCard>
      </div>

      {/* Charts row 2 — status donut + role bar */}
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="User Status"
          description="Distribution across account states"
        >
          <DistributionChart data={statusDistData} isLoading={usersQuery.isLoading} emptyLabel="No users yet" />
        </SectionCard>

        <SectionCard
          title="Role Distribution"
          description="Users per role"
        >
          <RoleBarChart data={roleDistData} isLoading={usersQuery.isLoading} palette={ROLE_PALETTES.ADMIN} />
        </SectionCard>
      </div>

      {/* Pending approvals + quick actions */}
      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="Pending Approvals"
          className="xl:col-span-2"
        >
          <PendingApprovalsList
            requests={pendingApprovals}
            isLoading={approvalsQuery.isLoading}
          />
        </SectionCard>

        <SectionCard title="Quick Actions">
          <ul className="space-y-2">
            <li>
              <Link
                to="/users/new"
                className="flex items-center gap-3 rounded-xl border border-indigo-200 p-3 transition-colors hover:border-indigo-400 hover:bg-indigo-50"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <UserPlus className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-neutral-900">Add a user</span>
                  <span className="block truncate text-xs text-neutral-500">Invite a colleague</span>
                </span>
              </Link>
            </li>
            <li>
              <Link
                to="/users/list"
                className="flex items-center gap-3 rounded-xl border border-indigo-200 p-3 transition-colors hover:border-indigo-400 hover:bg-indigo-50"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <Users className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-neutral-900">Manage users</span>
                  <span className="block truncate text-xs text-neutral-500">Review roles and access</span>
                </span>
              </Link>
            </li>
            <li>
              <Link
                to="/roles-permissions"
                className="flex items-center gap-3 rounded-xl border border-indigo-200 p-3 transition-colors hover:border-indigo-400 hover:bg-indigo-50"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <Shield className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-neutral-900">Roles & Permissions</span>
                  <span className="block truncate text-xs text-neutral-500">Configure access controls</span>
                </span>
              </Link>
            </li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
