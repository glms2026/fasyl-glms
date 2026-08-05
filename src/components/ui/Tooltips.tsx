import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  className?: string;
}

export function Tooltip({ children, content, className }: TooltipProps) {
  return (
    <div className={cn("group relative flex", className)}>
      {children}

      <div
        className="
          pointer-events-none
          absolute
          left-full
          top-1/2
          z-50
          ml-3
          -translate-y-1/2
          whitespace-nowrap
          rounded-md
          bg-neutral-900
          px-3
          py-2
          text-sm
          text-white
          opacity-0
          shadow-lg
          transition-all
          duration-200
          group-hover:opacity-100
          group-hover:translate-x-0
        "
      >
        {content}
      </div>
    </div>
  );
}
