import {
  Area,
  AreaChart,
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

const NAVY = "#001A42";

const SLICE_COLORS = [
  "#001A42",
  "#38BDF8",
  "#6366F1",
  "#14B8A6",
  "#F59E0B",
  "#EF4444",
];

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
