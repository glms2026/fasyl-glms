import { Link } from "react-router-dom";
import {
  FileText,
  KeyRound,
  Landmark,
  Plus,
  Receipt,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { MetricCard } from "@/components/common/MetricCard";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { cn } from "@/lib/utils";

import { creatorRecentEntries } from "../data/roleDashboard.mock";
import { ledgerMovement, ledgerSummary } from "../data/ledger.mock";
import { LedgerMovementChart } from "./LedgerMovementChart";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const typeColors: Record<string, string> = {
  Asset: "bg-emerald-100 text-emerald-700",
  Liability: "bg-red-100 text-red-700",
  Equity: "bg-blue-100 text-blue-700",
  Income: "bg-amber-100 text-amber-700",
  Expense: "bg-purple-100 text-purple-700",
};

export function CreatorDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header with emerald accent */}
      <PageHeader
        title={`${greeting()}, ${user?.username ?? "there"}`}
        description="GL workspace — manage ledger accounts"
        eyebrow={<Badge className="bg-emerald-100 text-emerald-700">Creator</Badge>}
        actions={
          <Link
            to="/create-gl"
            className={cn(buttonVariants({ size: "lg" }), "px-4")}
          >
            <Plus className="size-4" />
            Create GL account
          </Link>
        }
      />

      {/* Metrics row — 4 cards with emerald gradient */}
      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Assets"
          value={ledgerSummary.totalAssets}
          icon={Landmark}
          change={ledgerSummary.assetsChange}
          caption="vs last month"
        />
        <MetricCard
          label="GL Accounts"
          value={ledgerSummary.glAccounts}
          icon={FileText}
          change={ledgerSummary.glAccountsChange}
          caption="added this month"
        />
        <MetricCard
          label="Journal Entries"
          value={ledgerSummary.journalEntries}
          icon={Receipt}
          change={ledgerSummary.journalEntriesChange}
          caption="this month"
        />
        <MetricCard
          label="Unposted Entries"
          value={ledgerSummary.unpostedEntries}
          icon={TrendingUp}
          tone="warning"
          caption="awaiting posting"
        />
      </section>

      {/* Main content — 2/3 + 1/3 */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Ledger movement chart */}
        <SectionCard
          title="Ledger Movement"
          description="Debits and credits over the last 6 months"
          className="xl:col-span-2"
        >
          <LedgerMovementChart data={ledgerMovement} />
        </SectionCard>

        {/* Quick actions */}
        <div className="space-y-6">
          <SectionCard title="Quick Actions">
            <ul className="space-y-2">
              <li>
                <Link
                  to="/create-gl"
                  className="flex items-center gap-3 rounded-xl border border-emerald-200 p-3 transition-colors hover:border-emerald-400 hover:bg-emerald-50"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <Plus className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-neutral-900">Create GL account</span>
                    <span className="block truncate text-xs text-neutral-500">Add a new ledger account</span>
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/change-password"
                  className="flex items-center gap-3 rounded-xl border border-emerald-200 p-3 transition-colors hover:border-emerald-400 hover:bg-emerald-50"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <KeyRound className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-neutral-900">Change password</span>
                    <span className="block truncate text-xs text-neutral-500">Update your credentials</span>
                  </span>
                </Link>
              </li>
            </ul>
          </SectionCard>
        </div>
      </div>

      {/* Bottom section — recent GL entries */}
      <SectionCard
        title="Recent GL Entries"
        description="Latest ledger account activity"
        action={
          <Link
            to="/create-gl"
            className="text-sm font-medium text-emerald-600 hover:underline"
          >
            Create new
          </Link>
        }
      >
        <div className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs font-medium uppercase text-neutral-500">
                <th className="pb-3 pr-4">Account</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Balance</th>
                <th className="pb-3">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {creatorRecentEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-emerald-50/50">
                  <td className="py-3 pr-4">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{entry.accountName}</p>
                      <p className="text-xs text-neutral-500">{entry.accountCode}</p>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", typeColors[entry.type] || "bg-neutral-100 text-neutral-700")}>
                      {entry.type}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-sm font-semibold text-neutral-900">
                    {entry.balance}
                  </td>
                  <td className="py-3 text-xs text-neutral-500">
                    {new Date(entry.lastUpdated).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
