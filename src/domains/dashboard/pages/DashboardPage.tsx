import { Link } from "react-router-dom";
import {
  FileClock,
  Landmark,
  Receipt,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { MetricCard } from "@/components/common/MetricCard";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { UserActivityFeed } from "@/domains/users/components/UserActivityFeed";
import {
  useUserAnalyticsQuery,
  useUserMetricsQuery,
} from "@/domains/users/hooks/useUsers";
import { formatNumber, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

import { LedgerMovementChart } from "../components/LedgerMovementChart";
import { QuickActions } from "../components/QuickActions";
import { SystemStatusList } from "../components/SystemStatusList";
import { ledgerMovement, ledgerSummary, systemChecks } from "../data/ledger.mock";

function greeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";

  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuth();

  const metrics = useUserMetricsQuery();
  const analytics = useUserAnalyticsQuery();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${user?.username ?? "there"}`}
        description="Here's where the ledger stands today."
        eyebrow={
          user?.primaryRole ? (
            <Badge variant="neutral">{titleCase(user.primaryRole)}</Badge>
          ) : null
        }
        actions={
          <>
            <Link
              to="/users/new"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "px-4",
              )}
            >
              <UserPlus className="size-4" />
              Add user
            </Link>

            <Link
              to="/create-gl"
              className={cn(buttonVariants({ size: "lg" }), "px-4")}
            >
              <Landmark className="size-4" />
              Create GL
            </Link>
          </>
        }
      />

      <section
        aria-label="Ledger summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          label="Total assets"
          value={ledgerSummary.totalAssets}
          change={ledgerSummary.assetsChange}
          caption="vs last month"
          icon={Wallet}
        />

        <MetricCard
          label="GL accounts"
          value={formatNumber(ledgerSummary.glAccounts)}
          change={ledgerSummary.glAccountsChange}
          caption="added this month"
          icon={Landmark}
        />

        <MetricCard
          label="Journal entries"
          value={formatNumber(ledgerSummary.journalEntries)}
          change={ledgerSummary.journalEntriesChange}
          caption="this month"
          icon={Receipt}
        />

        <MetricCard
          label="Unposted entries"
          value={ledgerSummary.unpostedEntries}
          icon={FileClock}
          tone="warning"
          caption="awaiting approval"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="Ledger movement"
          description="Debits and credits posted over the last six months."
          className="xl:col-span-2"
        >
          <LedgerMovementChart data={ledgerMovement} />
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Quick actions">
            <QuickActions />
          </SectionCard>

          <SectionCard title="System status">
            <SystemStatusList checks={systemChecks} />
          </SectionCard>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="Team access"
          description="Who can reach the ledger right now."
          className="xl:col-span-1"
          action={
            <Link
              to="/users"
              className="text-sm font-medium text-primary hover:underline"
            >
              Open
            </Link>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <MetricCard
              label="Total users"
              value={metrics.data?.total ?? 0}
              icon={Users}
              isLoading={metrics.isLoading}
            />

            <MetricCard
              label="Active users"
              value={metrics.data?.active ?? 0}
              icon={Users}
              tone="success"
              isLoading={metrics.isLoading}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Recent activity"
          description="The latest administrative changes across accounts."
          className="xl:col-span-2"
        >
          <UserActivityFeed
            activities={analytics.data?.recentActivity}
            isLoading={analytics.isLoading}
          />
        </SectionCard>
      </div>
    </div>
  );
}
