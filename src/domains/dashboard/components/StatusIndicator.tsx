import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: "Healthy" | "Warning" | "Critical";
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "h-2.5 w-2.5 rounded-full",
          status === "Healthy" && "bg-green-500",

          status === "Warning" && "bg-yellow-500",

          status === "Critical" && "bg-red-500",
        )}
      />

      <span
        className={cn(
          "text-sm font-medium",
          status === "Healthy" && "text-green-700",

          status === "Warning" && "text-yellow-700",

          status === "Critical" && "text-red-700",
        )}
      >
        {status}
      </span>
    </div>
  );
}
