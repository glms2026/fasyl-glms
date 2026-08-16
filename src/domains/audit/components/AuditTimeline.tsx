import { motion } from "framer-motion";

import { formatDate, formatDateTime, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  actionCardClasses,
  actionCardHoverClasses,
  actionToneStyles,
  getActionMeta,
} from "../data/actions";
import type { AuditLogEntry } from "../types";
import { ActorAvatar } from "./ActorAvatar";

interface AuditTimelineProps {
  entries: AuditLogEntry[];
  onSelect: (entry: AuditLogEntry) => void;
}

function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function groupLabel(value: string): string {
  const date = new Date(value);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (sameDay(date, new Date())) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";

  return formatDate(value);
}

interface DayGroup {
  key: string;
  label: string;
  entries: AuditLogEntry[];
}

function groupByDay(entries: AuditLogEntry[]): DayGroup[] {
  const groups: DayGroup[] = [];

  for (const entry of entries) {
    const date = new Date(entry.createdAt);
    const key = date.toDateString();
    const last = groups[groups.length - 1];

    if (last && last.key === key) {
      last.entries.push(entry);
    } else {
      groups.push({ key, label: groupLabel(entry.createdAt), entries: [entry] });
    }
  }

  return groups;
}

/**
 * Activity feed in the style of the reference design: one quiet sentence
 * per row with a coloured icon on a thin rail. Events are grouped by day —
 * Today / Yesterday / the calendar date — and every row shows the clock
 * time the event was recorded.
 */
export function AuditTimeline({ entries, onSelect }: AuditTimelineProps) {
  const groups = groupByDay(entries);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="relative"
    >
      {/* Thin rail; the icon chips sit centred on it and mask it. */}
      <div
        aria-hidden="true"
        className="absolute inset-y-1 left-[11px] w-px bg-neutral-200"
      />

      {groups.map((group) => (
        <section key={group.key} aria-label={group.label}>
          <div className="flex items-center gap-2.5 pt-4 pb-1 pl-10">
            <span className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">
              {group.label}
            </span>

            <span aria-hidden="true" className="h-px flex-1 bg-neutral-100" />
          </div>

          <ol className="space-y-2">
            {group.entries.map((entry) => {
              const meta = getActionMeta(entry.action);
              const Icon = meta.icon;

              return (
                <li key={entry.id} className="relative pl-10">
                  <span
                    aria-hidden="true"
                    className={`absolute top-3.5 left-0 flex size-6 items-center justify-center rounded-md ring-1 ring-white ${actionToneStyles[meta.tone]}`}
                  >
                    <Icon className="size-3.5" />
                  </span>

                  <button
                    type="button"
                    onClick={() => onSelect(entry)}
                    aria-label={`View ${entry.action} event by ${entry.username}`}
                    title={`${entry.action} — ${formatDateTime(entry.createdAt)}`}
                    className={cn(
                      "group inline-flex max-w-full items-start gap-2.5 rounded-xl border border-neutral-200 py-3 pr-4 pl-3.5 text-left transition-colors outline-none hover:border-neutral-300 focus-visible:ring-2 focus-visible:ring-primary/30",
                      actionCardClasses[meta.tone],
                      actionCardHoverClasses[meta.tone],
                    )}
                  >
                    <ActorAvatar
                      username={entry.username}
                      size="sm"
                      className="mt-px"
                    />

                    <span className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm leading-snug text-neutral-700">
                        <span className="font-medium text-neutral-900">
                          {entry.username}
                        </span>{" "}
                        {entry.description}
                      </p>

                      <p className="mt-0.5 text-xs text-neutral-400 tabular-nums">
                        {formatTime(entry.createdAt)}
                      </p>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </motion.div>
  );
}
