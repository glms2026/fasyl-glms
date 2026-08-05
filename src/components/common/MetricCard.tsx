import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  trend?: "up" | "down" | "flat";
  /** Short qualifier under the value, e.g. "vs last month". */
  caption?: string;
  isLoading?: boolean;
  tone?: "default" | "success" | "warning" | "destructive";
  className?: string;
}

const tones = {
  default: "bg-primary/10 text-primary",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  destructive: "bg-red-50 text-red-600",
} as const;

export function MetricCard({
  label,
  value,
  icon: Icon,
  change,
  trend = "up",
  caption,
  isLoading = false,
  tone = "default",
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <p className="truncate text-sm font-medium text-neutral-500">
            {label}
          </p>

          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-semibold tracking-tight tabular-nums text-neutral-900">
              {value}
            </p>
          )}
        </div>

        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            tones[tone],
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>

      {(change || caption) && !isLoading && (
        <div className="mt-4 flex items-center gap-1.5 text-sm">
          {change && (
            <>
              <ArrowUpRight
                aria-hidden="true"
                className={cn(
                  "size-4",
                  trend === "up" && "text-emerald-600",
                  trend === "down" && "rotate-90 text-red-500",
                  trend === "flat" && "rotate-45 text-neutral-400",
                )}
              />

              <span
                className={cn(
                  "font-semibold",
                  trend === "up" && "text-emerald-600",
                  trend === "down" && "text-red-500",
                  trend === "flat" && "text-neutral-500",
                )}
              >
                {change}
              </span>
            </>
          )}

          {caption && <span className="text-neutral-400">{caption}</span>}
        </div>
      )}
    </div>
  );
}
