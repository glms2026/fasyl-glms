import * as React from "react";
import { createPortal } from "react-dom";

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
 *
 * The open menu is portaled to <body> and positioned with `position: fixed`
 * relative to the trigger's bounding box. Tables wrap themselves in
 * `overflow-x-auto` scroll containers; an absolutely positioned menu would
 * be clipped by that container, so portaling keeps the menu floating above
 * the table no matter where it is opened.
 */
function DropdownMenu({
  trigger,
  children,
  align = "end",
  className,
  label = "Open menu",
}: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState<{
    top: number;
    left: number;
  } | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const close = React.useCallback(() => setOpen(false), []);

  const openMenu = () => {
    const triggerElement = triggerRef.current;
    if (!triggerElement) return;

    const rect = triggerElement.getBoundingClientRect();

    // Provisional placement — the layout effect below measures the real
    // menu size and clamps/flips it so it stays inside the viewport.
    setPosition({
      top: rect.bottom + 6,
      left: align === "end" ? rect.right - 208 : rect.left,
    });
    setOpen(true);
  };

  // Position the menu relative to the trigger once its real size is known,
  // keeping it fully inside the viewport (flipping upward or inward when
  // there is no room).
  React.useLayoutEffect(() => {
    if (!open || !position || !menuRef.current) return;

    const menu = menuRef.current;
    const width = menu.offsetWidth;
    const height = menu.offsetHeight;
    const margin = 8;

    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    let left = align === "end" ? rect.right - width : rect.left;
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));

    let top = rect.bottom + 6;
    if (top + height > window.innerHeight - margin) {
      top = Math.max(margin, window.innerHeight - height - margin);
    }

    setPosition((current) =>
      current && current.left === left && current.top === top
        ? current
        : { left, top },
    );
  }, [open, position, align]);

  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    // Any scroll (page or inner container) detaches the fixed menu from its
    // trigger, so close on scroll rather than float disconnected.
    const handleScroll = () => setOpen(false);

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={openMenu}
        className="inline-flex items-center rounded-lg outline-none transition-colors focus-visible:ring-3 focus-visible:ring-primary/20"
      >
        {trigger}
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: "fixed", top: position.top, left: position.left }}
            className={cn(
              "z-50 mt-0 min-w-52 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1.5 shadow-lg animate-in fade-in zoom-in-95",
              className,
            )}
          >
            {typeof children === "function" ? children(close) : children}
          </div>,
          document.body,
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
