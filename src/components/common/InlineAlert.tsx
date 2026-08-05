import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface InlineAlertProps {
  variant?: "error" | "success" | "info";
  children: ReactNode;
  className?: string;
}

const styles = {
  error: {
    box: "border-red-200 bg-red-50 text-red-700",
    Icon: AlertCircle,
  },
  success: {
    box: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Icon: CheckCircle2,
  },
  info: {
    box: "border-sky-200 bg-sky-50 text-sky-800",
    Icon: Info,
  },
} as const;

/** Form-level feedback that belongs next to the fields, not in a toast. */
export function InlineAlert({
  variant = "error",
  children,
  className,
}: InlineAlertProps) {
  const { box, Icon } = styles[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm",
        box,
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
