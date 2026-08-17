import { useEffect, useMemo, useState } from "react";
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

import { toUtcDate } from "@/lib/format";

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

/** How often the overview re-fetches the full user set for live charts. */
const AUTO_REFRESH_MS = 60_000;

/** Small pulsing badge that signals the overview is on a live refresh loop. */
function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      Live
    </span>
  );
}

export default function UsersOverviewPage() {
  const usersQuery = useAllUsersQuery();
  const access = useAccess();

  // The pending queue endpoint is AUTHORIZER/ADMIN only.
  const pendingQuery = usePendingApprovalsQuery({ page: 0, size: 8 }, access.canReview);

  // Ticked by the live refresh loop so relative buckets (last 30 days, month
  // boundaries) stay current instead of freezing at mount time.
  const [now, setNow] = useState(() => Date.now());

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

    // Growth buckets use UTC month boundaries so zone-less backend
    // timestamps land in the right bucket. `total` is cumulative through the
    // end of each month (the current one included), so the line always ends
    // at the live account total and moves as accounts are created.
    const createdTimes = users
      .map((user) => toUtcDate(user.createdAt).getTime())
      .filter((time) => !Number.isNaN(time));

    const growth = Array.from({ length: 6 }).map((_, index) => {
      const offset = 5 - index;
      const nowDate = new Date(now);

      const monthStart = Date.UTC(
        nowDate.getUTCFullYear(),
        nowDate.getUTCMonth() - offset,
        1,
      );
      const monthEnd = Date.UTC(
        nowDate.getUTCFullYear(),
        nowDate.getUTCMonth() - offset + 1,
        1,
      );

      return {
        month: new Date(monthStart).toLocaleDateString("en-US", {
          month: "short",
          timeZone: "UTC",
        }),
        total: createdTimes.filter((time) => time < monthEnd).length,
        added: createdTimes.filter(
          (time) => time >= monthStart && time < monthEnd,
        ).length,
      };
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

  const { refetch: refetchUsers } = usersQuery;

  // Real-time updates: re-fetch the full user set every minute so the growth
  // chart, metrics and distributions track account changes without a manual
  // reload, and re-fetch whenever the tab becomes visible again.
  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
      void refetchUsers();
    }, AUTO_REFRESH_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setNow(Date.now());
        void refetchUsers();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refetchUsers]);

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
          description="Total accounts over the last six months, refreshed live from the API."
          className="xl:col-span-2"
          action={<LiveBadge />}
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
