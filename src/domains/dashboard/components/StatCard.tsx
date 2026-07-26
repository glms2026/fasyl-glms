import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  trend?: "up" | "down";
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend = "up",
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <p className="text-sm font-medium text-neutral-500">{title}</p>

          <h2 className="text-3xl font-bold tracking-tight">{value}</h2>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#001A42]/10">
          <Icon className="text-[#001A42]" size={24} />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <ArrowUpRight
          size={18}
          className={
            trend === "up" ? "text-green-600" : "rotate-180 text-red-500"
          }
        />

        <span
          className={
            trend === "up"
              ? "text-sm font-semibold text-green-600"
              : "text-sm font-semibold text-red-500"
          }
        >
          {change}
        </span>

        <span className="text-sm text-neutral-400">vs last month</span>
      </div>
    </div>
  );
}
