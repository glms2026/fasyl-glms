import { titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  actionBadgeClasses,
  actionToneStyles,
  getActionMeta,
} from "../data/actions";

interface ActionBadgeProps {
  action: string;
  /** Show the leading tone-colored icon chip. */
  withIcon?: boolean;
  /** Larger presentation for detail views. */
  size?: "sm" | "md";
  className?: string;
}

export function ActionBadge({
  action,
  withIcon = true,
  size = "sm",
  className,
}: ActionBadgeProps) {
  const meta = getActionMeta(action);
  const Icon = meta.icon;

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {withIcon && (
        <span
          aria-hidden="true"
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full",
            actionToneStyles[meta.tone],
            size === "sm" ? "size-6" : "size-8",
          )}
        >
          <Icon className={size === "sm" ? "size-3.5" : "size-4"} />
        </span>
      )}

      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3 [&_svg]:shrink-0",
          actionBadgeClasses[meta.tone],
          size === "md" && "px-3 py-1 text-sm",
        )}
      >
        {titleCase(action)}
      </span>
    </span>
  );
}
