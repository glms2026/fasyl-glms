import { Link } from "react-router-dom";
import { FileText, Hourglass, TreePine } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { formatDateTime, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

import { ApprovalStatusBadge } from "./ApprovalStatusBadge";
import type { UserApprovalRequest } from "../types";

/** Parse ledger details from the payloadJson field. */
function parseLedgerPayload(payloadJson?: string | null): {
  ledgerCode?: string;
  description?: string;
  leaf?: string;
} {
  if (!payloadJson) return {};
  try {
    const parsed = JSON.parse(payloadJson);
    return {
      ledgerCode: parsed.ledgerCode,
      description: parsed.description,
      leaf: parsed.leaf,
    };
  } catch {
    return {};
  }
}

interface PendingApprovalsListProps {
  requests: UserApprovalRequest[] | undefined;
  isLoading: boolean;
}

/** Compact queue preview shared by the users overview and the dashboard. */
export function PendingApprovalsList({
  requests,
  isLoading,
}: PendingApprovalsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-12 animate-pulse rounded-lg bg-neutral-100"
          />
        ))}
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <EmptyState
        icon={Hourglass}
        title="Queue is clear"
        description="No requests are waiting for approval right now."
        className="py-10"
      />
    );
  }

  return (
    <ul className="divide-y divide-neutral-100">
      {requests.map((request) => (
        <li
          key={request.id}
          className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            {(() => {
              const isLedgerAction =
                request.action === "LEDGER_CREATE" ||
                request.action === "LEDGER_UPDATE";
              const ledger = parseLedgerPayload(request.payloadJson);

              if (isLedgerAction && ledger.ledgerCode) {
                const isLeaf = ledger.leaf?.toUpperCase() === "Y";
                return (
                  <>
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {titleCase(request.action)}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-indigo-700">
                        {ledger.ledgerCode}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                          isLeaf
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-indigo-100 text-indigo-700",
                        )}
                      >
                        {isLeaf ? (
                          <TreePine className="size-2.5" />
                        ) : (
                          <FileText className="size-2.5" />
                        )}
                        {ledger.leaf?.toUpperCase() ?? "—"}
                      </span>
                    </div>
                    {ledger.description && (
                      <p className="mt-0.5 truncate text-xs text-neutral-500">
                        {ledger.description}
                      </p>
                    )}
                  </>
                );
              }

              return (
                <>
                  <p className="truncate text-sm font-medium text-neutral-900">
                    {titleCase(request.action)}
                    <span className="font-normal text-neutral-500">
                      {" "}
                      for {request.username}
                    </span>
                  </p>
                  <p className="text-xs text-neutral-500">
                    Requested by {request.makerUsername} ·{" "}
                    {formatDateTime(request.createdAt)}
                  </p>
                </>
              );
            })()}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ApprovalStatusBadge status={request.status} />

            <Link
              to="/approvals"
              className="text-xs font-medium text-primary hover:underline"
            >
              Review
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
