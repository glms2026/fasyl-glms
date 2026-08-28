import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  FileText,
  KeyRound,
  Leaf,
  Plus,
  TreePine,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button-variants";
import { MetricCard } from "@/components/common/MetricCard";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { useApiQuery } from "@/hooks/useApiQuery";
import { titleCase, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

import { glService } from "@/domains/gl/services/glService";
import type { LedgerResponse } from "@/domains/gl/types";

/* ------------------------------------------------------------------ */
/*  Chart colours                                                     */
/* ------------------------------------------------------------------ */

const TYPE_COLORS: Record<string, string> = {
  ASSET: "#059669",
  LIABILITY: "#DC2626",
  EQUITY: "#7C3AED",
  INCOME: "#2563EB",
  EXPENSE: "#D97706",
};

const LEAF_COLORS: Record<string, string> = {
  Y: "#059669",
  N: "#6366F1",
};

const DEFAULT_COLOR = "#94A3B8";

/* ------------------------------------------------------------------ */
/*  Derived chart helpers                                             */
/* ------------------------------------------------------------------ */

function deriveTypeDistribution(ledgers: LedgerResponse[]) {
  const counts: Record<string, number> = {};
  for (const a of ledgers) {
    const t = a.ledgerType?.toUpperCase() ?? "UNKNOWN";
    counts[t] = (counts[t] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function deriveLeafDistribution(ledgers: LedgerResponse[]) {
  const counts: Record<string, number> = { Y: 0, N: 0 };
  for (const a of ledgers) {
    const key = a.leaf?.toUpperCase() === "Y" ? "Y" : "N";
    counts[key] += 1;
  }
  return [
    { name: "Leaf", value: counts.Y },
    { name: "Header", value: counts.N },
  ];
}

function deriveMonthlyCreations(ledgers: LedgerResponse[]) {
  const byMonth = new Map<string, number>();
  for (const a of ledgers) {
    if (!a.createdAt) continue;
    const d = new Date(a.createdAt);
    const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }
  return Array.from(byMonth.entries()).map(([month, count]) => ({
    month,
    count,
  }));
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function CreatorDashboard() {
  const { user } = useAuth();

  const { data: ledgers = [], isLoading, error, refetch } = useApiQuery(
    "creator-gl:dashboard",
    async () => {
      const page = await glService.getMyLedgers({ page: 0, size: 1000 });
      return page.content;
    },
  );

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = window.setInterval(() => refetch(), 60_000);
    return () => window.clearInterval(interval);
  }, [refetch]);

  const metrics = useMemo(() => {
    const total = ledgers.length;
    const leafCount = ledgers.filter((a) => a.leaf?.toUpperCase() === "Y").length;
    const headerCount = total - leafCount;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const newThisMonth = ledgers.filter(
      (a) => new Date(a.createdAt).getTime() >= thirtyDaysAgo,
    ).length;
    return { total, leafCount, headerCount, newThisMonth };
  }, [ledgers]);

  const typeDistribution = useMemo(() => deriveTypeDistribution(ledgers), [ledgers]);
  const leafDistribution = useMemo(() => deriveLeafDistribution(ledgers), [ledgers]);
  const monthlyCreations = useMemo(() => deriveMonthlyCreations(ledgers), [ledgers]);

  const recentColumns: Array<DataTableColumn<LedgerResponse>> = [
    {
      id: "ledgerCode",
      header: "Ledger Code",
      cell: (row) => (
        <Link
          to={`/gl/${row.id}`}
          className="font-mono text-sm font-medium text-emerald-600 hover:text-emerald-800 hover:underline"
        >
          {row.ledgerCode}
        </Link>
      ),
    },
    {
      id: "description",
      header: "Description",
      cell: (row) => (
        <span className="text-neutral-700">{row.description}</span>
      ),
    },
    {
      id: "ledgerType",
      header: "Type",
      cell: (row) => (
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: `${TYPE_COLORS[row.ledgerType?.toUpperCase()] ?? DEFAULT_COLOR}15`,
            color: TYPE_COLORS[row.ledgerType?.toUpperCase()] ?? DEFAULT_COLOR,
          }}
        >
          {titleCase(row.ledgerType)}
        </span>
      ),
    },
    {
      id: "leaf",
      header: "Leaf",
      cell: (row) => (
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: `${LEAF_COLORS[row.leaf?.toUpperCase()] ?? DEFAULT_COLOR}15`,
            color: LEAF_COLORS[row.leaf?.toUpperCase()] ?? DEFAULT_COLOR,
          }}
        >
          {row.leaf?.toUpperCase() === "Y" ? (
            <TreePine className="size-3" />
          ) : (
            <FileText className="size-3" />
          )}
          {row.leaf?.toUpperCase() === "Y" ? "Y" : "N"}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "Created",
      cell: (row) => (
        <span className="text-neutral-500">{formatDate(row.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with emerald accent */}
      <PageHeader
        title={`${greeting()}, ${user?.username ?? "there"}`}
        description="GL workspace — manage ledger accounts"
        eyebrow={<Badge className="bg-emerald-100 text-emerald-700">Creator</Badge>}
        actions={
          <Link
            to="/gl/create"
            className={cn(buttonVariants({ size: "lg" }), "px-4")}
          >
            <Plus className="size-4" />
            Create GL account
          </Link>
        }
      />

      {/* Metrics row — live data */}
      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="My GL Accounts"
          value={metrics.total}
          icon={BookOpen}
          isLoading={isLoading}
        />
        <MetricCard
          label="Leaf Accounts"
          value={metrics.leafCount}
          icon={Leaf}
          isLoading={isLoading}
          caption="Postings allowed"
        />
        <MetricCard
          label="Header Accounts"
          value={metrics.headerCount}
          icon={FileText}
          isLoading={isLoading}
          caption="Roll up children"
        />
        <MetricCard
          label="New This Month"
          value={metrics.newThisMonth}
          icon={Plus}
          isLoading={isLoading}
        />
      </section>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="By Ledger Type"
          description="Distribution of your ledger accounts across types."
          className="xl:col-span-2"
        >
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : typeDistribution.length === 0 ? (
            <EmptyState
              title="No data"
              description="Create your first ledger account to see charts."
            />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={typeDistribution}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #E5E7EB",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {typeDistribution.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={TYPE_COLORS[entry.name] ?? DEFAULT_COLOR}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard
          title="Leaf vs Header"
          description="Leaf accounts allow direct postings."
        >
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : leafDistribution.every((d) => d.value === 0) ? (
            <EmptyState
              title="No data"
              description="Create some ledger accounts to see charts."
            />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={leafDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  <Cell fill="#059669" />
                  <Cell fill="#6366F1" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #E5E7EB",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* Monthly creation trend */}
      {monthlyCreations.length > 0 && (
        <SectionCard
          title="Account Creations Over Time"
          description="Monthly trend of your ledger account registrations."
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={monthlyCreations}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              />
              <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      )}

      {/* Ledger Entries table */}
      <SectionCard
        title="My Ledger Entries"
        description="Accounts you have created."
        action={
          <Link
            to="/gl/entries"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-800"
          >
            View all
            <ArrowRight className="size-3.5" />
          </Link>
        }
      >
        <DataTable
          columns={recentColumns}
          rows={ledgers.filter((l) => (l.status?.toUpperCase() !== "REJECTED")).slice(0, 5)}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          empty={
            <EmptyState
              icon={BookOpen}
              title="No accounts yet"
              description="Create your first ledger account to get started."
              action={
                <Link
                  to="/gl/create"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <Plus className="size-4" />
                  Create Ledger Account
                </Link>
              }
            />
          }
        />
      </SectionCard>

      {/* Quick actions */}
      <SectionCard title="Quick Actions">
        <ul className="space-y-2">
          <li>
            <Link
              to="/gl/create"
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
              to="/gl/entries"
              className="flex items-center gap-3 rounded-xl border border-emerald-200 p-3 transition-colors hover:border-emerald-400 hover:bg-emerald-50"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <BookOpen className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-neutral-900">View Ledger Entries</span>
                <span className="block truncate text-xs text-neutral-500">Browse your created accounts</span>
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
  );
}
