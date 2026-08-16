import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Lock,
  PauseCircle,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { ErrorState } from "@/components/common/ErrorState";
import { MetricCard } from "@/components/common/MetricCard";
import { SectionCard } from "@/components/common/SectionCard";
import { cn } from "@/lib/utils";

import { ModuleHeader } from "../components/ModuleHeader";
import { heroButtonClass } from "../components/heroStyles";
import { PendingApprovalsList } from "../components/PendingApprovalsList";
import {
  DistributionChart,
  UserGrowthChart,
} from "../components/UserCharts";
import { UsersTabs } from "../components/UsersTabs";
import { useAccess } from "../hooks/useAccess";
import { usePendingApprovalsQuery } from "../hooks/useApprovals";
import { useAllUsersQuery } from "../hooks/useUsers";

function monthLabel(offset: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - offset);

  return date.toLocaleDateString("en-US", { month: "short" });
}

export default function UsersOverviewPage() {
  const usersQuery = useAllUsersQuery();
  const access = useAccess();

  // The pending queue endpoint is AUTHORIZER/ADMIN only.
  const pendingQuery = usePendingApprovalsQuery({ page: 0, size: 8 }, access.canReview);

  // Captured once so the derived metrics stay stable across re-renders.
  const [now] = useState(() => Date.now());

  const { metrics, growth, roleDistribution, statusDistribution } = useMemo(() => {
    const users = usersQuery.data ?? [];
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const countBy = (predicate: (user: (typeof users)[number]) => boolean) =>
      users.filter(predicate).length;

    const roles = new Set<string>();
    for (const user of users) {
      for (const role of user.roles) roles.add(role);
    }

    const newThisMonth = countBy(
      (user) => new Date(user.createdAt).getTime() >= thirtyDaysAgo,
    );

    const previousTotal = Math.max(0, users.length - newThisMonth);

    const growth = Array.from({ length: 6 }).map((_, index) => {
      const offset = 5 - index;

      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - offset);
      cutoff.setDate(1);

      const windowStart = new Date(cutoff);
      windowStart.setMonth(windowStart.getMonth() - 1);

      const total = users.filter(
        (user) => new Date(user.createdAt) < cutoff,
      ).length;

      const added = users.filter((user) => {
        const created = new Date(user.createdAt);
        return created >= windowStart && created < cutoff;
      }).length;

      return { month: monthLabel(offset), total, added };
    });

    const roleCounts = new Map<string, number>();
    for (const role of roles) roleCounts.set(role, 0);
    for (const user of users) {
      for (const role of user.roles) {
        roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1);
      }
    }

    const statusCounts = new Map<string, number>();
    for (const user of users) {
      statusCounts.set(user.status, (statusCounts.get(user.status) ?? 0) + 1);
    }

    return {
      metrics: {
        total: users.length,
        active: countBy((user) => user.status === "ACTIVE"),
        suspended: countBy((user) => user.status === "SUSPENDED"),
        locked: countBy((user) => user.status === "LOCKED"),
        inactive: countBy((user) => user.status === "INACTIVE"),
        pendingApprovals: pendingQuery.data?.totalElements ?? 0,
        newThisMonth,
        roleCount: roles.size,
        totalChange:
          previousTotal === 0
            ? 0
            : Math.round((newThisMonth / previousTotal) * 1000) / 10,
      },
      growth,
      roleDistribution: Array.from(roleCounts.entries())
        .map(([label, value]) => ({ label, value }))
        .filter((slice) => slice.value > 0)
        .sort((a, b) => b.value - a.value),
      statusDistribution: Array.from(statusCounts.entries())
        .map(([label, value]) => ({ label, value }))
        .filter((slice) => slice.value > 0)
        .sort((a, b) => b.value - a.value),
    };
  }, [usersQuery.data, pendingQuery.data, now]);

  const pending = pendingQuery.data?.content ?? [];

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="User management"
        description="Accounts, roles and access across the ledger. Everything is live data from the API."
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

      {usersQuery.isError ? (
        <ErrorState
          title="Couldn't load user data"
          message={usersQuery.error ?? ""}
          onRetry={usersQuery.refetch}
        />
      ) : (
        <section
          aria-label="User metrics"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
        >
          <MetricCard
            label="Total users"
            value={metrics.total}
            icon={Users}
            isLoading={usersQuery.isLoading}
            change={
              metrics.totalChange > 0 ? `+${metrics.totalChange}%` : undefined
            }
            caption="vs last 30 days"
          />

          <MetricCard
            label="Active"
            value={metrics.active}
            icon={UserCheck}
            tone="success"
            isLoading={usersQuery.isLoading}
          />

          <MetricCard
            label="Suspended"
            value={metrics.suspended}
            icon={PauseCircle}
            tone="warning"
            isLoading={usersQuery.isLoading}
          />

          <MetricCard
            label="Locked"
            value={metrics.locked}
            icon={Lock}
            tone="destructive"
            isLoading={usersQuery.isLoading}
          />

          <MetricCard
            label="New this month"
            value={metrics.newThisMonth}
            icon={UserPlus}
            isLoading={usersQuery.isLoading}
          />

          <MetricCard
            label="Roles in use"
            value={metrics.roleCount}
            icon={ShieldCheck}
            isLoading={usersQuery.isLoading}
          />
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="User growth"
          description="Total accounts over the last six months, from creation dates."
          className="xl:col-span-2"
        >
          <UserGrowthChart data={growth} isLoading={usersQuery.isLoading} />
        </SectionCard>

        <SectionCard
          title="Role distribution"
          description="How access is spread across roles."
        >
          <DistributionChart
            data={roleDistribution}
            isLoading={usersQuery.isLoading}
            emptyLabel="No roles assigned yet"
          />
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {access.canReview && (
          <SectionCard
            title="Pending approvals"
            description="Maker-checker requests waiting for an authorizer."
            className="xl:col-span-2"
            action={
              <Link
                to="/approvals"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "px-3",
                )}
              >
                Review queue
                <ArrowRight className="size-3.5" />
              </Link>
            }
          >
            <PendingApprovalsList
              requests={pending}
              isLoading={pendingQuery.isLoading}
            />
          </SectionCard>
        )}

        <SectionCard
          title="Account status"
          description="Current state of every account."
          className={access.canReview ? "xl:col-span-1" : "xl:col-span-3"}
        >
          <DistributionChart
            data={statusDistribution}
            isLoading={usersQuery.isLoading}
            emptyLabel="No accounts yet"
          />
        </SectionCard>
      </div>
    </div>
  );
}
