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

import type {
  DistributionSlice,
  LoginTrendPoint,
  UserGrowthPoint,
} from "../types";

const NAVY = "#001A42";
const SKY = "#38BDF8";

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

          <Tooltip contentStyle={tooltipStyle} />

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

export function LoginTrendChart({
  data,
  isLoading = false,
}: {
  data: LoginTrendPoint[] | undefined;
  isLoading?: boolean;
}) {
  return (
    <ChartFrame
      isLoading={isLoading}
      hasData={Boolean(data?.length)}
      emptyLabel="No sign-in activity recorded"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />

          <XAxis dataKey="day" {...axisProps} />
          <YAxis allowDecimals={false} {...axisProps} />

          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#FAFAFA" }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />

          <Bar dataKey="logins" name="Successful" fill={NAVY} radius={[6, 6, 0, 0]} />
          <Bar dataKey="failed" name="Failed" fill={SKY} radius={[6, 6, 0, 0]} />
        </BarChart>
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
