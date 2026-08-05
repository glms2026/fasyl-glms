import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionCardProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

/** The standard white panel used across dashboards and forms. */
export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-neutral-200 bg-white shadow-sm",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 border-b border-neutral-100 px-6 py-5">
          <div className="space-y-1">
            {title && (
              <h2 className="text-base font-semibold tracking-tight text-neutral-900">
                {title}
              </h2>
            )}

            {description && (
              <p className="text-sm text-neutral-500">{description}</p>
            )}
          </div>

          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}

      <div className={cn("p-6", contentClassName)}>{children}</div>
    </section>
  );
}
