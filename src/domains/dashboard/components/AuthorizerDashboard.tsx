import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  Hourglass,
  Users,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { MetricCard } from "@/components/common/MetricCard";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { PendingApprovalsList } from "@/domains/users/components/PendingApprovalsList";
import {
  ApprovalActionPieChart,
  ApprovalTrendChart,
  DistributionChart,
  ROLE_PALETTES,
} from "@/domains/users/components/UserCharts";
import { usePendingApprovalsQuery } from "@/domains/users/hooks/useApprovals";
import { useAllUsersQuery } from "@/domains/users/hooks/useUsers";
import { cn } from "@/lib/utils";

import {
  deriveApprovalActionDistribution,
  deriveApprovalTrend,
  deriveStatusDistribution,
} from "../data/chartData";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function AuthorizerDashboard() {
  const { user } = useAuth();
  const approvalsQuery = usePendingApprovalsQuery({ page: 0, size: 100 }, true);
  const usersQuery = useAllUsersQuery();

  const pendingApprovals = approvalsQuery.data?.content ?? [];
  const users = usersQuery.data ?? [];

  // Derive chart data
  const approvalTrendData = deriveApprovalTrend(pendingApprovals);
  const actionDistData = deriveApprovalActionDistribution(pendingApprovals);
  const statusDistData = deriveStatusDistribution(users);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={`${greeting()}, ${user?.username ?? "there"}`}
        description="Review queue — pending approvals await your decision"
        eyebrow={<Badge className="bg-amber-100 text-amber-700">Authorizer</Badge>}
        actions={
          <Link
            to="/approvals"
            className={cn(buttonVariants({ size: "lg" }), "px-4")}
          >
            <Hourglass className="size-4" />
            Review queue
          </Link>
        }
      />

      {/* Metrics row */}
      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Pending Approvals"
          value={pendingApprovals.length}
          icon={Clock}
          tone="warning"
          isLoading={approvalsQuery.isLoading}
        />
        <MetricCard
          label="Total Users"
          value={users.length}
          icon={Users}
          isLoading={usersQuery.isLoading}
        />
        <MetricCard
          label="Active Users"
          value={users.filter((u) => u.status === "ACTIVE").length}
          icon={CheckCircle2}
          tone="success"
          isLoading={usersQuery.isLoading}
        />
        <MetricCard
          label="Locked Accounts"
          value={users.filter((u) => u.status === "LOCKED").length}
          icon={XCircle}
          tone="destructive"
          isLoading={usersQuery.isLoading}
        />
      </section>

      {/* Charts row — approval trend + action pie */}
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Approval Activity"
          description="Pending, approved and rejected requests over time"
        >
          <ApprovalTrendChart data={approvalTrendData} isLoading={approvalsQuery.isLoading} />
        </SectionCard>

        <SectionCard
          title="Actions Breakdown"
          description="Distribution of request types"
        >
          <ApprovalActionPieChart
            data={actionDistData}
            isLoading={approvalsQuery.isLoading}
            palette={ROLE_PALETTES.AUTHORIZER}
          />
        </SectionCard>
      </div>

      {/* Status donut */}
      <SectionCard
        title="User Status"
        description="Account state distribution"
      >
        <div className="max-w-md">
          <DistributionChart data={statusDistData} isLoading={usersQuery.isLoading} emptyLabel="No users yet" />
        </div>
      </SectionCard>

      {/* Pending approvals queue */}
      <SectionCard
        title="Pending Approvals"
        description="Maker-checker requests requiring your review"
        className="border-amber-200"
        action={
          <Link
            to="/approvals"
            className="text-sm font-medium text-amber-600 hover:underline"
          >
            Open full queue
          </Link>
        }
      >
        <PendingApprovalsList
          requests={pendingApprovals}
          isLoading={approvalsQuery.isLoading}
        />
      </SectionCard>

      {/* Quick actions */}
      <SectionCard title="Quick Actions">
        <ul className="space-y-2">
          <li>
            <Link
              to="/approvals"
              className="flex items-center gap-3 rounded-xl border border-amber-200 p-3 transition-colors hover:border-amber-400 hover:bg-amber-50"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <Hourglass className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-neutral-900">Review queue</span>
                <span className="block truncate text-xs text-neutral-500">Approve or reject requests</span>
              </span>
            </Link>
          </li>
          <li>
            <Link
              to="/users/list"
              className="flex items-center gap-3 rounded-xl border border-amber-200 p-3 transition-colors hover:border-amber-400 hover:bg-amber-50"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <Users className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-neutral-900">View users</span>
                <span className="block truncate text-xs text-neutral-500">Review user accounts</span>
              </span>
            </Link>
          </li>
        </ul>
      </SectionCard>
    </div>
  );
}
