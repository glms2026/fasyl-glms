import { cn } from "@/lib/utils";

interface LiveIndicatorProps {
  live: boolean;
  onToggle: () => void;
}

/** Toggle that switches the trail between manual and auto-refresh modes. */
export function LiveIndicator({ live, onToggle }: LiveIndicatorProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={live}
      aria-label={live ? "Pause live updates" : "Resume live updates"}
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        live
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700",
      )}
    >
      <span className="relative flex size-2">
        {live && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        )}

        <span
          className={cn(
            "relative inline-flex size-2 rounded-full",
            live ? "bg-emerald-500" : "bg-neutral-300",
          )}
        />
      </span>

      {live ? "Live" : "Paused"}
    </button>
  );
}
