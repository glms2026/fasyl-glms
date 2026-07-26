import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartHeader } from "./ChartHeader";
import { ChartLegend } from "./ChartLegend";

const data = [
  { month: "Jan", income: 42000, expense: 31000 },
  { month: "Feb", income: 48000, expense: 33000 },
  { month: "Mar", income: 46000, expense: 37000 },
  { month: "Apr", income: 52000, expense: 34000 },
  { month: "May", income: 61000, expense: 41000 },
  { month: "Jun", income: 58000, expense: 39000 },
];

export function FinancialOverview() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <ChartHeader title="Financial Overview" subtitle="Income vs Expenses" />

      <div className="mt-6 h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#001A42" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#001A42" stopOpacity={0} />
              </linearGradient>

              <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

            <XAxis dataKey="month" tickLine={false} axisLine={false} />

            <YAxis
              tickFormatter={(value) => `$${value / 1000}k`}
              tickLine={false}
              axisLine={false}
            />

            <Tooltip />

            <Area
              type="monotone"
              dataKey="income"
              stroke="#001A42"
              fill="url(#income)"
              strokeWidth={3}
            />

            <Area
              type="monotone"
              dataKey="expense"
              stroke="#38BDF8"
              fill="url(#expense)"
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4">
        <ChartLegend />

        <span className="text-sm text-neutral-500">Updated 5 minutes ago</span>
      </div>
    </div>
  );
}
