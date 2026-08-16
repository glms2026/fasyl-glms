import { Link } from "react-router-dom";
import { Hourglass } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { formatDateTime, titleCase } from "@/lib/format";

import { ApprovalStatusBadge } from "./ApprovalStatusBadge";
import type { UserApprovalRequest } from "../types";

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
