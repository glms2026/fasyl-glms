import { Link } from "react-router-dom";
import {
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
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { cn } from "@/lib/utils";

import {
  DistributionChart,
  LoginTrendChart,
  UserGrowthChart,
} from "../components/UserCharts";
import { UserActivityFeed } from "../components/UserActivityFeed";
import { UsersTabs } from "../components/UsersTabs";
import { useUserAnalyticsQuery, useUserMetricsQuery } from "../hooks/useUsers";

export default function UsersOverviewPage() {
  const metrics = useUserMetricsQuery();
  const analytics = useUserAnalyticsQuery();

  return (
    <div className="space-y-6">
      <PageHeader
        title="User management"
        description="Accounts, roles and access across the ledger."
        actions={
          <Link to="/users/new" className={cn(buttonVariants({ size: "lg" }), "px-4")}>
            <UserPlus className="size-4" />
            Create user
          </Link>
        }
      />

      <UsersTabs />

      {metrics.isError ? (
        <ErrorState
          title="Couldn't load user metrics"
          message={metrics.error ?? ""}
          onRetry={metrics.refetch}
        />
      ) : (
        <section
          aria-label="User metrics"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
        >
          <MetricCard
            label="Total users"
            value={metrics.data?.total ?? 0}
            icon={Users}
            isLoading={metrics.isLoading}
            change={
              metrics.data ? `+${metrics.data.totalChange}%` : undefined
            }
            caption="vs last month"
          />

          <MetricCard
            label="Active"
            value={metrics.data?.active ?? 0}
            icon={UserCheck}
            tone="success"
            isLoading={metrics.isLoading}
          />

          <MetricCard
            label="Suspended"
            value={metrics.data?.suspended ?? 0}
            icon={PauseCircle}
            tone="warning"
            isLoading={metrics.isLoading}
          />

          <MetricCard
            label="Locked"
            value={metrics.data?.locked ?? 0}
            icon={Lock}
            tone="destructive"
            isLoading={metrics.isLoading}
          />

          <MetricCard
            label="New this month"
            value={metrics.data?.newThisMonth ?? 0}
            icon={UserPlus}
            isLoading={metrics.isLoading}
          />

          <MetricCard
            label="Administrators"
            value={metrics.data?.administrators ?? 0}
            icon={ShieldCheck}
            isLoading={metrics.isLoading}
          />
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="User growth"
          description="Total accounts over the last six months."
          className="xl:col-span-2"
        >
          <UserGrowthChart
            data={analytics.data?.growth}
            isLoading={analytics.isLoading}
          />
        </SectionCard>

        <SectionCard
          title="Role distribution"
          description="How access is spread across roles."
        >
          <DistributionChart
            data={analytics.data?.roleDistribution}
            isLoading={analytics.isLoading}
            emptyLabel="No roles assigned yet"
          />
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="Sign-in trends"
          description="Successful and failed attempts this week."
          className="xl:col-span-2"
        >
          <LoginTrendChart
            data={analytics.data?.loginTrend}
            isLoading={analytics.isLoading}
          />
        </SectionCard>

        <SectionCard
          title="Account status"
          description="Current state of every account."
        >
          <DistributionChart
            data={analytics.data?.statusDistribution}
            isLoading={analytics.isLoading}
            emptyLabel="No accounts yet"
          />
        </SectionCard>
      </div>

      <SectionCard
        title="Recent activity"
        description="The latest administrative changes."
        action={
          <Link
            to="/users/list"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all users
          </Link>
        }
      >
        {analytics.isError ? (
          <ErrorState
            title="Couldn't load activity"
            message={analytics.error ?? ""}
            onRetry={analytics.refetch}
          />
        ) : (
          <UserActivityFeed
            activities={analytics.data?.recentActivity}
            isLoading={analytics.isLoading}
          />
        )}
      </SectionCard>
    </div>
  );
}
