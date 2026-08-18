import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  Hourglass,
  TrendingUp,
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
import { usePendingApprovalsQuery } from "@/domains/users/hooks/useApprovals";
import { cn } from "@/lib/utils";

import { authorizerMetrics } from "../data/roleDashboard.mock";
import { ledgerSummary } from "../data/ledger.mock";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function AuthorizerDashboard() {
  const { user } = useAuth();
  const approvalsQuery = usePendingApprovalsQuery({ page: 0, size: 10 }, true);

  const pendingApprovals = approvalsQuery.data?.content ?? [];

  return (
    <div className="space-y-6">
      {/* Header with amber accent */}
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

      {/* Metrics row — 4 cards with amber gradient */}
      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Pending Approvals"
          value={pendingApprovals.length}
          icon={Clock}
          tone="warning"
          isLoading={approvalsQuery.isLoading}
          change={authorizerMetrics[0].change}
          trend={authorizerMetrics[0].trend}
          caption={authorizerMetrics[0].caption}
        />
        <MetricCard
          label="Approved Today"
          value={authorizerMetrics[1].value}
          icon={CheckCircle2}
          tone="success"
          change={authorizerMetrics[1].change}
          trend={authorizerMetrics[1].trend}
          caption={authorizerMetrics[1].caption}
        />
        <MetricCard
          label="Rejected Today"
          value={authorizerMetrics[2].value}
          icon={XCircle}
          tone="destructive"
          change={authorizerMetrics[2].change}
          trend={authorizerMetrics[2].trend}
          caption={authorizerMetrics[2].caption}
        />
        <MetricCard
          label="Avg Response Time"
          value={authorizerMetrics[3].value}
          icon={TrendingUp}
          change={authorizerMetrics[3].change}
          trend={authorizerMetrics[3].trend}
          caption={authorizerMetrics[3].caption}
        />
      </section>

      {/* Main content — full-width pending approvals */}
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

      {/* Bottom row — GL summary + quick actions */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* GL summary for context */}
        <SectionCard title="Ledger Overview">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Total Assets</span>
              <span className="text-sm font-semibold text-neutral-900">{ledgerSummary.totalAssets}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">GL Accounts</span>
              <span className="text-sm font-semibold text-neutral-900">{ledgerSummary.glAccounts}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Journal Entries</span>
              <span className="text-sm font-semibold text-neutral-900">{ledgerSummary.journalEntries}</span>
            </div>
          </div>
        </SectionCard>

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

        <SectionCard title="Recent Approvals">
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900">USER_CREATE</p>
                <p className="text-xs text-neutral-500">jdoe approved by you</p>
              </div>
              <span className="text-xs text-neutral-400">2h ago</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900">USER_LOCK</p>
                <p className="text-xs text-neutral-500">testuser approved by you</p>
              </div>
              <span className="text-xs text-neutral-400">5h ago</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-red-100 bg-red-50 p-3">
              <XCircle className="size-4 text-red-600" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900">ASSIGN_ROLE</p>
                <p className="text-xs text-neutral-500">invaliduser rejected by you</p>
              </div>
              <span className="text-xs text-neutral-400">1d ago</span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
