import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  /** Say what to do next, not just that there's nothing here. */
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-neutral-100">
        <Icon className="size-5 text-neutral-400" aria-hidden="true" />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-neutral-900">{title}</p>

        {description && (
          <p className="mx-auto max-w-sm text-sm text-neutral-500">
            {description}
          </p>
        )}
      </div>

      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
