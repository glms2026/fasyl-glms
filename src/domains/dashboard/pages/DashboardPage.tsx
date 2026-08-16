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
import { useAccess } from "@/domains/users/hooks/useAccess";
import { PendingApprovalsList } from "@/domains/users/components/PendingApprovalsList";
import { usePendingApprovalsQuery } from "@/domains/users/hooks/useApprovals";
import { useAllUsersQuery } from "@/domains/users/hooks/useUsers";
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
  const access = useAccess();

  const usersQuery = useAllUsersQuery();
  const approvalsQuery = usePendingApprovalsQuery(
    { page: 0, size: 6 },
    access.canReview,
  );

  const users = usersQuery.data ?? [];
  const totalUsers = users.length;
  const activeUsers = users.filter((candidate) => candidate.status === "ACTIVE")
    .length;
  const pendingApprovals = approvalsQuery.data?.content ?? [];

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
            {access.canMakeChanges && (
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
            )}

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
          className={access.canReview ? "xl:col-span-1" : "xl:col-span-3"}
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
              value={totalUsers}
              icon={Users}
              isLoading={usersQuery.isLoading}
            />

            <MetricCard
              label="Active users"
              value={activeUsers}
              icon={Users}
              tone="success"
              isLoading={usersQuery.isLoading}
            />
          </div>
        </SectionCard>

        {access.canReview && (
          <SectionCard
            title="Pending approvals"
            description="Maker-checker requests waiting for an authorizer."
            className="xl:col-span-2"
            action={
              <Link
                to="/approvals"
                className="text-sm font-medium text-primary hover:underline"
              >
                Review queue
              </Link>
            }
          >
            <PendingApprovalsList
              requests={pendingApprovals}
              isLoading={approvalsQuery.isLoading}
            />
          </SectionCard>
        )}
      </div>
    </div>
  );
}
