import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

interface DatePickerProps {
  /** yyyy-mm-dd (local) or "" when nothing is chosen. */
  value: string;
  onChange: (value: string) => void;
  /** Accessible name and placeholder for the trigger. */
  label: string;
  /** yyyy-mm-dd lower bound — dates before it are disabled. */
  min?: string;
  /** yyyy-mm-dd upper bound — dates after it are disabled. */
  max?: string;
  className?: string;
}

function toDate(value: string | undefined): Date | null {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function toValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const monthLabel = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});

/**
 * Styled calendar picker. The trigger matches the field styling (so it
 * sits naturally in filter bars) and the popup is a full month calendar
 * with navigation, today's ring, the project's navy selected state and
 * quick Today / Clear actions.
 */
function DatePicker({
  value,
  onChange,
  label,
  min,
  max,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date>(() => toDate(value) ?? new Date());

  const containerRef = useRef<HTMLDivElement>(null);

  const selected = toDate(value);
  const minDate = toDate(min);
  const maxDate = toDate(max);

  const openPicker = () => {
    // Jump the calendar to the chosen month whenever the picker opens.
    setView(toDate(value) ?? new Date());
    setOpen(true);
  };

  // Outside click and ESC close the popup (same pattern as DropdownMenu).
  useEffect(() => {
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

  const year = view.getFullYear();
  const month = view.getMonth();

  // Monday-first grid, blank cells before the 1st to keep weeks aligned.
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<number | null> = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const isDisabled = (day: number) => {
    const date = new Date(year, month, day);

    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;

    return false;
  };

  const isToday = (day: number) =>
    new Date(year, month, day).toDateString() === new Date().toDateString();

  const isSelected = (day: number) =>
    selected
      ? new Date(year, month, day).toDateString() === selected.toDateString()
      : false;

  const choose = (date: Date | null) => {
    onChange(date === null ? "" : toValue(date));
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
        onClick={() => (open ? setOpen(false) : openPicker())}
        className={cn(
          "inline-flex h-10 w-full items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 text-left text-sm transition-colors outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15",
          open && "border-primary ring-3 ring-primary/15",
        )}
      >
        <CalendarDays
          aria-hidden="true"
          className="size-4 shrink-0 text-neutral-400"
        />

        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            !value && "text-neutral-400",
          )}
        >
          {value ? formatDate(value) : label}
        </span>

        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 text-neutral-400 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute left-0 z-40 mt-2 w-72 rounded-xl border border-neutral-200 bg-white p-3 shadow-xl animate-in fade-in zoom-in-95"
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between px-1 pb-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setView(new Date(year, month - 1, 1))}
              className="flex size-8 items-center justify-center rounded-lg text-neutral-500 transition-colors outline-none hover:bg-neutral-100 hover:text-neutral-800 focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <ChevronLeft className="size-4" />
            </button>

            <p className="text-sm font-semibold tracking-tight text-neutral-900">
              {monthLabel.format(view)}
            </p>

            <button
              type="button"
              aria-label="Next month"
              onClick={() => setView(new Date(year, month + 1, 1))}
              className="flex size-8 items-center justify-center rounded-lg text-neutral-500 transition-colors outline-none hover:bg-neutral-100 hover:text-neutral-800 focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 pb-1">
            {WEEKDAYS.map((weekday) => (
              <span
                key={weekday}
                className="flex h-8 items-center justify-center text-[11px] font-medium text-neutral-400"
              >
                {weekday}
              </span>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, index) =>
              day === null ? (
                <span key={`blank-${index}`} className="size-8" />
              ) : (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled(day)}
                  aria-label={`${formatDate(toValue(new Date(year, month, day)))}`}
                  aria-pressed={isSelected(day)}
                  onClick={() => choose(new Date(year, month, day))}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg text-sm tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:pointer-events-none",
                    isSelected(day)
                      ? "bg-primary font-semibold text-white"
                      : isToday(day)
                        ? "font-semibold text-primary ring-1 ring-primary/40 ring-inset hover:bg-primary/5"
                        : "text-neutral-700 hover:bg-neutral-100",
                    isDisabled(day) && "text-neutral-300",
                  )}
                >
                  {day}
                </button>
              ),
            )}
          </div>

          {/* Quick actions */}
          <div className="mt-2 flex items-center justify-between border-t border-neutral-100 px-1 pt-2">
            <button
              type="button"
              onClick={() => choose(new Date())}
              className="rounded text-xs font-medium text-primary outline-none transition-colors hover:text-primary/80 hover:underline focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Today
            </button>

            {value && (
              <button
                type="button"
                onClick={() => choose(null)}
                className="rounded text-xs font-medium text-neutral-500 outline-none transition-colors hover:text-neutral-700 hover:underline focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { DatePicker };
