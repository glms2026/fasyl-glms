import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { LedgerPoint } from "../data/ledger.mock";

const NAVY = "#001A42";
const SKY = "#38BDF8";

const compact = new Intl.NumberFormat("en-NG", {
  notation: "compact",
  maximumFractionDigits: 1,
});

interface LedgerMovementChartProps {
  data: LedgerPoint[];
}

export function LedgerMovementChart({ data }: LedgerMovementChartProps) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="debitsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={NAVY} stopOpacity={0.35} />
              <stop offset="100%" stopColor={NAVY} stopOpacity={0} />
            </linearGradient>

            <linearGradient id="creditsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SKY} stopOpacity={0.3} />
              <stop offset="100%" stopColor={SKY} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />

          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#737373" }}
          />

          <YAxis
            tickFormatter={(value: number) => `₦${compact.format(value)}`}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#737373" }}
            width={70}
          />

          <Tooltip
            formatter={(value) => `₦${compact.format(Number(value))}`}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e5e5e5",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              fontSize: 13,
            }}
          />

          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />

          <Area
            type="monotone"
            dataKey="debits"
            name="Debits"
            stroke={NAVY}
            strokeWidth={2.5}
            fill="url(#debitsFill)"
          />

          <Area
            type="monotone"
            dataKey="credits"
            name="Credits"
            stroke={SKY}
            strokeWidth={2.5}
            fill="url(#creditsFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
