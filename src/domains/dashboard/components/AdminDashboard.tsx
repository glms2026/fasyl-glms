import { Link } from "react-router-dom";
import {
  Activity,
  ClipboardCheck,
  FileText,
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
import { usePendingApprovalsQuery } from "@/domains/users/hooks/useApprovals";
import { useAllUsersQuery } from "@/domains/users/hooks/useUsers";
import { cn } from "@/lib/utils";

import {
  adminMetrics,
  adminRecentActivity,
} from "../data/roleDashboard.mock";
import { ledgerMovement, ledgerSummary, systemChecks } from "../data/ledger.mock";
import { LedgerMovementChart } from "./LedgerMovementChart";
import { SystemStatusList } from "./SystemStatusList";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const actionIcons: Record<string, typeof Users> = {
  USER_CREATE: UserPlus,
  ASSIGN_ROLE: Shield,
  USER_LOCK: Shield,
  USER_ACTIVATE: ClipboardCheck,
  LOGIN: Activity,
};

const statusColors: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
};

export function AdminDashboard() {
  const { user } = useAuth();
  const usersQuery = useAllUsersQuery();
  const approvalsQuery = usePendingApprovalsQuery({ page: 0, size: 6 }, true);

  const users = usersQuery.data ?? [];
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "ACTIVE").length;
  const pendingApprovals = approvalsQuery.data?.content ?? [];

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
              to="/create-gl"
              className={cn(buttonVariants({ size: "lg" }), "px-4")}
            >
              Create GL
            </Link>
          </>
        }
      />

      {/* Metrics row — 4 cards with indigo gradient */}
      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Users"
          value={totalUsers}
          icon={Users}
          isLoading={usersQuery.isLoading}
          change={adminMetrics[0].change}
          trend={adminMetrics[0].trend}
          caption={adminMetrics[0].caption}
        />
        <MetricCard
          label="Active Users"
          value={activeUsers}
          icon={Users}
          tone="success"
          isLoading={usersQuery.isLoading}
          change={adminMetrics[1].change}
          trend={adminMetrics[1].trend}
          caption={adminMetrics[1].caption}
        />
        <MetricCard
          label="Pending Approvals"
          value={pendingApprovals.length}
          icon={ClipboardCheck}
          tone="warning"
          isLoading={approvalsQuery.isLoading}
          change={adminMetrics[2].change}
          trend={adminMetrics[2].trend}
          caption={adminMetrics[2].caption}
        />
        <MetricCard
          label="GL Accounts"
          value={ledgerSummary.glAccounts}
          icon={FileText}
          change={ledgerSummary.glAccountsChange}
          caption="added this month"
        />
      </section>

      {/* Main content — 2/3 + 1/3 */}
      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="Ledger Movement"
          description="Debits and credits over the last 6 months"
          className="xl:col-span-2"
        >
          <LedgerMovementChart data={ledgerMovement} />
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Pending Approvals">
            <PendingApprovalsList
              requests={pendingApprovals}
              isLoading={approvalsQuery.isLoading}
            />
          </SectionCard>

          <SectionCard title="System Status">
            <SystemStatusList checks={systemChecks} />
          </SectionCard>
        </div>
      </div>

      {/* Bottom section — recent activity */}
      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="Recent Activity"
          description="Latest system events"
          className="xl:col-span-2"
          action={
            <Link
              to="/audit-logs"
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              View all
            </Link>
          }
        >
          <div className="space-y-3">
            {adminRecentActivity.map((event) => {
              const Icon = actionIcons[event.action] || Activity;
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900">
                      {event.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-neutral-500">
                      by {event.user}
                      {event.target && ` → ${event.target}`}
                    </p>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusColors[event.status || "success"])}>
                    {event.status || "success"}
                  </span>
                </div>
              );
            })}
          </div>
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
