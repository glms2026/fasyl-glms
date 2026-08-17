import { ChevronRight } from "lucide-react";

import { formatDayLabel, formatTime, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  actionRowAccentClasses,
  actionRowClasses,
  actionRowHoverClasses,
  actionTextClasses,
  actionToneStyles,
  getActionMeta,
} from "../data/actions";
import type { AuditLogEntry } from "../types";
import { ActorAvatar } from "./ActorAvatar";

interface AuditTableProps {
  entries: AuditLogEntry[];
  onSelect: (entry: AuditLogEntry) => void;
}

const HEADERS = ["Action", "Actor", "Description", "When"];

/**
 * The activity trail as a table. Every row keeps the action's colour
 * identity — a tinted left accent, a horizontal gradient wash, a tone icon
 * chip and a colour-matched action name — so the feed's visual language
 * survives the move from timeline to table. Rows are clickable and open
 * the full record dialog.
 */
export function AuditTable({ entries, onSelect }: AuditTableProps) {
  return (
    <div className="w-full overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[52rem] border-separate border-spacing-y-2 text-sm">
        <caption className="sr-only">
          Audit trail — actions, actors, details and timestamps
        </caption>

        <thead>
          <tr>
            {HEADERS.map((header) => (
              <th
                key={header}
                scope="col"
                className="bg-gradient-to-b from-neutral-50 to-white px-6 py-3.5 text-left text-xs font-semibold tracking-wider whitespace-nowrap text-neutral-500 uppercase"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {entries.map((entry) => {
            const meta = getActionMeta(entry.action);
            const Icon = meta.icon;

            return (
              <tr
                key={entry.id}
                onClick={() => onSelect(entry)}
                className={cn(
                  "group cursor-pointer transition-colors outline-none",
                  actionRowClasses[meta.tone],
                  actionRowHoverClasses[meta.tone],
                )}
              >
                {/* Action — tone icon chip + tinted name. */}
                <td
                  className={cn(
                    "w-[16rem] border-l-[3px] py-3.5 pl-6 pr-4 align-middle",
                    actionRowAccentClasses[meta.tone],
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-white/80",
                        actionToneStyles[meta.tone],
                      )}
                    >
                      <Icon className="size-4" />
                    </span>

                    <span
                      className={cn(
                        "truncate text-sm font-semibold",
                        actionTextClasses[meta.tone],
                      )}
                    >
                      {titleCase(entry.action)}
                    </span>
                  </div>
                </td>

                {/* Actor — initials avatar + username. */}
                <td className="w-[13rem] py-3.5 pr-4 align-middle">
                  <div className="flex items-center gap-2.5">
                    <ActorAvatar username={entry.username} size="sm" />

                    <span className="truncate text-sm font-medium text-neutral-800">
                      {entry.username}
                    </span>
                  </div>
                </td>

                {/* Description. */}
                <td className="py-3.5 pr-4 align-middle">
                  <p className="line-clamp-2 text-sm leading-snug text-neutral-600">
                    {entry.description}
                  </p>
                </td>

                {/* When — date + clock time. */}
                <td className="py-3.5 pr-6 pl-4 align-middle">
                  <div className="flex items-center gap-1.5">
                    <div className="leading-tight">
                      <p className="text-sm font-medium whitespace-nowrap text-neutral-800 tabular-nums">
                        {formatDayLabel(entry.createdAt)}
                      </p>

                      <p className="text-xs whitespace-nowrap text-neutral-400 tabular-nums">
                        {formatTime(entry.createdAt)}
                      </p>
                    </div>

                    <ChevronRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-neutral-300 opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
