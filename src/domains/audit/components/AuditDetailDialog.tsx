import type { ReactNode } from "react";
import { Hash, UserRound } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { formatDateTimeFull } from "@/lib/format";
import { cn } from "@/lib/utils";

import { actionCardClasses, getActionMeta } from "../data/actions";
import type { AuditLogEntry } from "../types";
import { ActionBadge } from "./ActionBadge";
import { ActorAvatar } from "./ActorAvatar";

interface AuditDetailDialogProps {
  entry: AuditLogEntry | null;
  onClose: () => void;
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <dt className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
          {label}
        </dt>

        <dd className="mt-0.5 text-sm text-neutral-800">{children}</dd>
      </div>
    </div>
  );
}

/** Full record for one audited event. Data is already in the list row, so
 *  this renders from the selected entry — no extra fetch needed. */
export function AuditDetailDialog({ entry, onClose }: AuditDetailDialogProps) {
  return (
    <Modal
      open={entry !== null}
      onClose={onClose}
      title="Audit event"
      description="The complete record for this action."
      size="md"
    >
      {entry && (
        <div>
          <div
            className={cn(
              "flex items-center gap-4 rounded-xl border border-neutral-200/70 p-4",
              actionCardClasses[getActionMeta(entry.action).tone],
            )}
          >
            <ActorAvatar username={entry.username} size="md" />

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-neutral-900">
                {entry.username}
              </p>

              <p className="text-xs text-neutral-500">
                {formatDateTimeFull(entry.createdAt)}
              </p>
            </div>

            <ActionBadge
              action={entry.action}
              size="md"
              className="ml-auto shrink-0"
            />
          </div>

          <p className="mt-4 text-sm leading-relaxed text-neutral-700">
            {entry.description}
          </p>

          <dl className="mt-4 divide-y divide-neutral-100 border-t border-neutral-100">
            <DetailRow icon={<UserRound className="size-4" />} label="Actor">
              <span className="font-medium">{entry.username}</span>
            </DetailRow>

            <DetailRow icon={<Hash className="size-4" />} label="Event ID">
              <span className="tabular-nums">#{entry.id}</span>
            </DetailRow>

            <DetailRow icon={<Hash className="size-4" />} label="Recorded at">
              <span className="tabular-nums">
                {formatDateTimeFull(entry.createdAt)}
              </span>
            </DetailRow>
          </dl>
        </div>
      )}
    </Modal>
  );
}
