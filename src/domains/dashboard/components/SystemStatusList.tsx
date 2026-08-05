import { cn } from "@/lib/utils";

import type { SystemCheck } from "../data/ledger.mock";

interface SystemStatusListProps {
  checks: SystemCheck[];
}

const tones = {
  operational: { dot: "bg-emerald-500", label: "Operational" },
  degraded: { dot: "bg-amber-500", label: "Degraded" },
  down: { dot: "bg-red-500", label: "Down" },
} as const;

export function SystemStatusList({ checks }: SystemStatusListProps) {
  return (
    <ul className="divide-y divide-neutral-100">
      {checks.map((check) => {
        const tone = tones[check.state];

        return (
          <li
            key={check.label}
            className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900">
                {check.label}
              </p>

              <p className="truncate text-xs text-neutral-500">
                {check.detail}
              </p>
            </div>

            <span className="flex shrink-0 items-center gap-2 text-xs font-medium text-neutral-600">
              <span
                aria-hidden="true"
                className={cn("size-2 rounded-full", tone.dot)}
              />
              {tone.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
