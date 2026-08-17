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

interface ToneStyle {
  /** Gradient wash — the card's background. */
  card: string;
  /** Solid white chip with a tone ring, so the icon pops on the wash. */
  chip: string;
}

const tones: Record<NonNullable<MetricCardProps["tone"]>, ToneStyle> = {
  default: {
    card: "bg-gradient-to-br from-indigo-200/70 via-indigo-50/40 to-white",
    chip: "bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-200",
  },
  success: {
    card: "bg-gradient-to-br from-emerald-200/70 via-emerald-50/40 to-white",
    chip: "bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-200",
  },
  warning: {
    card: "bg-gradient-to-br from-amber-200/70 via-amber-50/40 to-white",
    chip: "bg-white text-amber-600 shadow-sm ring-1 ring-amber-200",
  },
  destructive: {
    card: "bg-gradient-to-br from-red-200/70 via-red-50/40 to-white",
    chip: "bg-white text-red-600 shadow-sm ring-1 ring-red-200",
  },
};

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
        "rounded-2xl border border-neutral-200 p-5 shadow-sm transition-shadow hover:shadow-md",
        tones[tone].card,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <p className="truncate text-sm font-medium text-neutral-600">
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
            tones[tone].chip,
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
