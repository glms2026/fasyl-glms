import { DashboardLayout } from "@/layouts/dashboard/DashboardLayout";

import { StatCard } from "../components/StatCard";
import { FinancialOverview } from "../components/FinancialOverview";
import { RecentTransactions } from "../components/RecentTransaction";
import { RecentActivity } from "../components/RecentActivity";
import { QuickActions } from "../components/QuickAction";
import { SystemStatus } from "../components/SystemStatus";
import { dashboardSidebar } from "@/domains/dashboard/components/sidebar";

import { Wallet, Landmark, Receipt, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  return (
    <DashboardLayout sidebar={dashboardSidebar}>
      <div className="space-y-8">
        {/* Header */}

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

          <p className="mt-1 text-neutral-500">
            Welcome back. Here's an overview of today's financial operations.
          </p>
        </div>

        {/* KPI */}

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Assets"
            value="$84.5M"
            change="+12.6%"
            icon={Wallet}
          />

          <StatCard
            title="Ledger Accounts"
            value="1,284"
            change="+48"
            icon={Landmark}
          />

          <StatCard
            title="Journal Entries"
            value="6,421"
            change="+231"
            icon={Receipt}
          />

          <StatCard
            title="Monthly Growth"
            value="18.4%"
            change="+2.1%"
            icon={TrendingUp}
          />
        </section>

        {/* Charts */}

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <FinancialOverview />
          </div>

          <SystemStatus />
        </section>

        {/* Tables */}

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <RecentTransactions />
          </div>

          <div className="space-y-6">
            <QuickActions />

            <RecentActivity />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
