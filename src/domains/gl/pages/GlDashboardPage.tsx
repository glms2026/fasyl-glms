import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  DollarSign,
  FileText,
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

import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { MetricCard } from "@/components/common/MetricCard";
import { SectionCard } from "@/components/common/SectionCard";
import { titleCase, formatDate } from "@/lib/format";
import { useApiQuery } from "@/hooks/useApiQuery";


import { ModuleHeader } from "@/domains/users/components/ModuleHeader";
import { heroButtonClass } from "@/domains/users/components/heroStyles";

import { GlTabs } from "../components/GlTabs";
import { glService } from "../services/glService";
import type { GlAccount } from "../types";

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
/*  Live badge                                                        */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Derived chart data                                                */
/* ------------------------------------------------------------------ */

function deriveTypeDistribution(accounts: GlAccount[]) {
  const counts: Record<string, number> = {};
  for (const a of accounts) {
    const t = a.accountType?.toUpperCase() ?? "UNKNOWN";
    counts[t] = (counts[t] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function deriveLeafDistribution(accounts: GlAccount[]) {
  const counts: Record<string, number> = { Y: 0, N: 0 };
  for (const a of accounts) {
    const key = a.leaf?.toUpperCase() === "Y" ? "Y" : "N";
    counts[key] += 1;
  }
  return [
    { name: "Leaf", value: counts.Y },
    { name: "Header", value: counts.N },
  ];
}

function deriveMonthlyCreations(accounts: GlAccount[]) {
  const byMonth = new Map<string, number>();
  for (const a of accounts) {
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
/*  Page                                                              */
/* ------------------------------------------------------------------ */

const AUTO_REFRESH_MS = 60_000;

export default function GlDashboardPage() {
  const [now, setNow] = useState(() => Date.now());

  const { data, isLoading, error, refetch } = useApiQuery(
    "gl:all",
    async () => {
      const page = await glService.list({ page: 0, size: 1000 });
      return page.content;
    },
  );

  const accounts = data ?? [];

  const metrics = useMemo(() => {
    const total = accounts.length;
    const leafCount = accounts.filter((a) => a.leaf?.toUpperCase() === "Y").length;
    const headerCount = total - leafCount;
    const types = new Set(accounts.map((a) => a.accountType?.toUpperCase()));
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const newThisMonth = accounts.filter(
      (a) => new Date(a.createdAt).getTime() >= thirtyDaysAgo,
    ).length;
    return { total, leafCount, headerCount, typeCount: types.size, newThisMonth };
  }, [accounts, now]);

  const typeDistribution = useMemo(() => deriveTypeDistribution(accounts), [accounts]);
  const leafDistribution = useMemo(() => deriveLeafDistribution(accounts), [accounts]);
  const monthlyCreations = useMemo(() => deriveMonthlyCreations(accounts), [accounts]);

  // Live refresh
  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
      void refetch();
    }, AUTO_REFRESH_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setNow(Date.now());
        void refetch();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refetch]);

  const recentColumns: Array<DataTableColumn<GlAccount>> = [
    {
      id: "accountCode",
      header: "GL Code",
      sortField: "accountCode",
      cell: (row) => (
        <span className="font-mono text-sm font-medium">{row.accountCode}</span>
      ),
    },
    {
      id: "accountName",
      header: "GL Description",
      cell: (row) => (
        <span className="text-neutral-700">{row.accountName}</span>
      ),
    },
    {
      id: "accountType",
      header: "GL Type",
      cell: (row) => (
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: `${TYPE_COLORS[row.accountType?.toUpperCase()] ?? DEFAULT_COLOR}15`,
            color: TYPE_COLORS[row.accountType?.toUpperCase()] ?? DEFAULT_COLOR,
          }}
        >
          {titleCase(row.accountType)}
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
          {row.leaf?.toUpperCase() === "Y" ? "Leaf" : "Header"}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "Created",
      sortField: "createdAt",
      cell: (row) => (
        <span className="text-neutral-500">{formatDate(row.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Blue gradient hero */}
      <ModuleHeader
        title="General Ledger"
        description="Chart of accounts, metrics and entry management. Everything is live data from the API."
        actions={
          <Link to="/gl/create" className={heroButtonClass}>
            <Plus className="size-4" />
            Create GL Account
          </Link>
        }
      />

      <GlTabs />

      {/* Metric cards */}
      <section aria-label="GL metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <MetricCard
          label="Total Accounts"
          value={metrics.total}
          icon={BookOpen}
          isLoading={isLoading}
        />
        <MetricCard
          label="Leaf Accounts"
          value={metrics.leafCount}
          icon={Leaf}
          tone="success"
          caption="Postings allowed"
          isLoading={isLoading}
        />
        <MetricCard
          label="Header Accounts"
          value={metrics.headerCount}
          icon={FileText}
          tone="warning"
          caption="Roll up children"
          isLoading={isLoading}
        />
        <MetricCard
          label="Account Types"
          value={metrics.typeCount}
          icon={DollarSign}
          caption="Unique types"
          isLoading={isLoading}
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
          title="By Account Type"
          description="Distribution of GL accounts across types."
          className="xl:col-span-2"
          action={<LiveBadge />}
        >
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : typeDistribution.length === 0 ? (
            <EmptyState title="No data" description="Create some GL accounts to see charts." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={typeDistribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
            <EmptyState title="No data" description="Create some GL accounts to see charts." />
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
          description="Monthly trend of new GL account registrations."
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyCreations} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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

      {/* GL Entries table */}
      <SectionCard
        title="GL Entries"
        description="Browse all accounts in the general ledger."
        action={
          <Link
            to="/gl/entries"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            View all
            <ArrowRight className="size-3.5" />
          </Link>
        }
      >
        <DataTable
          columns={recentColumns}
          rows={accounts.slice(0, 5)}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          empty={
            <EmptyState
              icon={BookOpen}
              title="No accounts yet"
              description="Create the first GL account to get started."
              action={
                <Link to="/gl/create" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                  <Plus className="size-4" />
                  Create GL Account
                </Link>
              }
            />
          }
        />
      </SectionCard>
    </div>
  );
}
