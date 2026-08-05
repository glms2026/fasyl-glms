import * as React from "react";

import { cn } from "@/lib/utils";

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  align?: "start" | "end";
  className?: string;
  /** Accessible name for the trigger button. */
  label?: string;
}

/**
 * Small popover menu used for table row actions and the profile menu.
 * Closes on outside click, ESC, and after an item is chosen.
 */
function DropdownMenu({
  trigger,
  children,
  align = "end",
  className,
  label = "Open menu",
}: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const close = React.useCallback(() => setOpen(false), []);

  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center rounded-lg outline-none transition-colors focus-visible:ring-3 focus-visible:ring-primary/20"
      >
        {trigger}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-40 mt-2 min-w-52 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1.5 shadow-lg animate-in fade-in zoom-in-95",
            align === "end" ? "right-0" : "left-0",
            className,
          )}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </div>
  );
}

interface DropdownMenuItemProps extends React.ComponentProps<"button"> {
  variant?: "default" | "destructive";
  icon?: React.ReactNode;
}

function DropdownMenuItem({
  className,
  variant = "default",
  icon,
  children,
  ...props
}: DropdownMenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
        variant === "destructive"
          ? "text-red-600 hover:bg-red-50 focus-visible:bg-red-50"
          : "text-neutral-700 hover:bg-neutral-100 focus-visible:bg-neutral-100",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

function DropdownMenuSeparator() {
  return <div role="separator" className="my-1.5 h-px bg-neutral-200" />;
}

function DropdownMenuLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-400",
        className,
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
};
