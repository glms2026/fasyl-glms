import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ModuleHeaderProps {
  title: string;
  description?: string;
  /** Breadcrumb or back link rendered above the title. */
  eyebrow?: ReactNode;
  /** Buttons or filters aligned to the trailing edge. */
  actions?: ReactNode;
  className?: string;
}

/**
 * Gradient hero used by the user-management, approval and role screens.
 * Darker than the surrounding canvas so the module reads as one unit; the
 * accents echo the FASYL sky-blue brand accent.
 */
export function ModuleHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: ModuleHeaderProps) {
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B1F44] via-[#12306B] to-[#1E4C96] px-6 py-8 shadow-lg shadow-primary/10 sm:px-8",
        className,
      )}
    >
      {/* Decorative wash — blurred brand-accent orbs + a faint grid. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -top-24 -right-16 size-72 rounded-full bg-sky-400/25 blur-3xl" />
        <div className="absolute -bottom-28 -left-20 size-64 rounded-full bg-blue-300/15 blur-3xl" />

        <svg className="absolute inset-0 h-full w-full opacity-[0.06]" aria-hidden="true">
          <defs>
            <pattern
              id="hero-grid"
              width="36"
              height="36"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 36 0 L 0 0 0 36"
                fill="none"
                stroke="white"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </div>

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          {eyebrow}

          <h1 className="truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {title}
          </h1>

          {description && (
            <p className="max-w-2xl text-sm text-white/70">{description}</p>
          )}
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
