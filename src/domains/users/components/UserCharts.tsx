import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { titleCase } from "@/lib/format";

import type { DistributionSlice, UserGrowthPoint } from "../types";
import type { ApprovalTrendPoint } from "@/domains/dashboard/data/chartData";

const NAVY = "#001A42";

const SLICE_COLORS = [
  "#001A42",
  "#38BDF8",
  "#6366F1",
  "#14B8A6",
  "#F59E0B",
  "#EF4444",
];

/** Role-specific colour palettes for charts. */
export const ROLE_PALETTES: Record<string, string[]> = {
  ADMIN: ["#4338CA", "#6366F1", "#818CF8", "#A5B4FC", "#C7D2FE"],
  CONTROL: ["#0284C7", "#38BDF8", "#7DD3FC", "#BAE6FD", "#E0F2FE"],
  AUTHORIZER: ["#D97706", "#F59E0B", "#FBBF24", "#FCD34D", "#FEF3C7"],
  CREATOR: ["#059669", "#10B981", "#34D399", "#6EE7B7", "#A7F3D0"],
};

const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fontSize: 12, fill: "#737373" },
} as const;

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #e5e5e5",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  fontSize: 13,
} as const;

/** Hover card for the growth chart: month, cumulative total, and adds. */
function GrowthTooltip(props: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: UserGrowthPoint }>;
}) {
  const point = props.payload?.[0]?.payload;
  if (!props.active || !point) return null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs shadow-lg">
      <p className="font-semibold text-neutral-900">{point.month}</p>

      <div className="mt-1.5 flex items-center justify-between gap-8">
        <span className="text-neutral-500">Total users</span>
        <span className="font-semibold text-neutral-900">{point.total}</span>
      </div>

      <div className="mt-0.5 flex items-center justify-between gap-8">
        <span className="text-neutral-500">Added</span>
        <span className="font-semibold text-emerald-600">+{point.added}</span>
      </div>
    </div>
  );
}

function ChartFrame({
  isLoading,
  hasData,
  emptyLabel,
  children,
}: {
  isLoading: boolean;
  hasData: boolean;
  emptyLabel: string;
  children: React.ReactNode;
}) {
  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (!hasData) {
    return <EmptyState title={emptyLabel} className="py-16" />;
  }

  return <div className="h-64 w-full">{children}</div>;
}

export function UserGrowthChart({
  data,
  isLoading = false,
}: {
  data: UserGrowthPoint[] | undefined;
  isLoading?: boolean;
}) {
  return (
    <ChartFrame
      isLoading={isLoading}
      hasData={Boolean(data?.length)}
      emptyLabel="No growth data yet"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="userGrowthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={NAVY} stopOpacity={0.35} />
              <stop offset="100%" stopColor={NAVY} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />

          <XAxis dataKey="month" {...axisProps} />
          <YAxis allowDecimals={false} {...axisProps} />

          <Tooltip content={<GrowthTooltip />} />

          <Area
            type="monotone"
            dataKey="total"
            name="Total users"
            stroke={NAVY}
            strokeWidth={2.5}
            fill="url(#userGrowthFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function DistributionChart({
  data,
  isLoading = false,
  emptyLabel,
}: {
  data: DistributionSlice[] | undefined;
  isLoading?: boolean;
  emptyLabel: string;
}) {
  const slices = data?.map((slice) => ({
    ...slice,
    label: titleCase(slice.label),
  }));

  return (
    <ChartFrame
      isLoading={isLoading}
      hasData={Boolean(slices?.length)}
      emptyLabel={emptyLabel}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="label"
            innerRadius={52}
            outerRadius={82}
            paddingAngle={2}
            strokeWidth={0}
          >
            {slices?.map((slice, index) => (
              <Cell
                key={slice.label}
                fill={SLICE_COLORS[index % SLICE_COLORS.length]}
              />
            ))}
          </Pie>

          <Tooltip contentStyle={tooltipStyle} />

          <Legend
            iconType="circle"
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/* ── Approval trend (stacked area) ───────────────────────────────── */

function ApprovalTrendTooltip(props: {
  active?: boolean;
  payload?: ReadonlyArray<{ dataKey: string; value: number; color: string }>;
  label?: string;
}) {
  if (!props.active || !props.payload?.length) return null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs shadow-lg">
      <p className="mb-1.5 font-semibold text-neutral-900">{props.label}</p>
      {props.payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-neutral-500">{titleCase(entry.dataKey)}</span>
          </span>
          <span className="font-semibold text-neutral-900">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ApprovalTrendChart({
  data,
  isLoading = false,
  palette = ["#F59E0B", "#10B981", "#EF4444"],
}: {
  data: ApprovalTrendPoint[] | undefined;
  isLoading?: boolean;
  palette?: string[];
}) {
  return (
    <ChartFrame
      isLoading={isLoading}
      hasData={Boolean(data?.length)}
      emptyLabel="No approval data yet"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="pendingFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette[0]} stopOpacity={0.35} />
              <stop offset="100%" stopColor={palette[0]} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="approvedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette[1]} stopOpacity={0.35} />
              <stop offset="100%" stopColor={palette[1]} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="rejectedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette[2]} stopOpacity={0.35} />
              <stop offset="100%" stopColor={palette[2]} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
          <XAxis dataKey="month" {...axisProps} />
          <YAxis allowDecimals={false} {...axisProps} />
          <Tooltip content={<ApprovalTrendTooltip />} />

          <Area type="monotone" dataKey="pending" stackId="1" stroke={palette[0]} strokeWidth={2} fill="url(#pendingFill)" />
          <Area type="monotone" dataKey="approved" stackId="1" stroke={palette[1]} strokeWidth={2} fill="url(#approvedFill)" />
          <Area type="monotone" dataKey="rejected" stackId="1" stroke={palette[2]} strokeWidth={2} fill="url(#rejectedFill)" />

          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/* ── Role distribution (horizontal bar) ──────────────────────────── */

function RoleBarTooltip(props: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: { label: string; value: number } }>;
}) {
  if (!props.active || !props.payload?.length) return null;
  const point = props.payload[0].payload;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs shadow-lg">
      <p className="font-semibold text-neutral-900">{titleCase(point.label)}</p>
      <p className="mt-1 text-neutral-500">
        <span className="font-semibold text-neutral-900">{point.value}</span> user{point.value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export function RoleBarChart({
  data,
  isLoading = false,
  palette = SLICE_COLORS,
}: {
  data: DistributionSlice[] | undefined;
  isLoading?: boolean;
  palette?: string[];
}) {
  return (
    <ChartFrame
      isLoading={isLoading}
      hasData={Boolean(data?.length)}
      emptyLabel="No role data yet"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
          <XAxis type="number" allowDecimals={false} {...axisProps} />
          <YAxis
            type="category"
            dataKey="label"
            width={90}
            tickFormatter={(v: string) => titleCase(v)}
            {...axisProps}
          />
          <Tooltip content={<RoleBarTooltip />} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
            {data?.map((entry, index) => (
              <Cell key={entry.label} fill={palette[index % palette.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/* ── Approval action distribution (pie) ──────────────────────────── */

export function ApprovalActionPieChart({
  data,
  isLoading = false,
  palette = SLICE_COLORS,
}: {
  data: DistributionSlice[] | undefined;
  isLoading?: boolean;
  palette?: string[];
}) {
  const slices = data?.map((slice) => ({
    ...slice,
    label: titleCase(slice.label),
  }));

  return (
    <ChartFrame
      isLoading={isLoading}
      hasData={Boolean(slices?.length)}
      emptyLabel="No approval actions yet"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="label"
            innerRadius={52}
            outerRadius={82}
            paddingAngle={2}
            strokeWidth={0}
          >
            {slices?.map((slice, index) => (
              <Cell
                key={slice.label}
                fill={palette[index % palette.length]}
              />
            ))}
          </Pie>

          <Tooltip contentStyle={tooltipStyle} />

          <Legend
            iconType="circle"
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
