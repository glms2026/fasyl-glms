import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, ClipboardCheck, Hourglass, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { TablePagination } from "@/components/common/TablePagination";
import { formatDateTime, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

import { ApprovalDecisionDialog } from "../components/ApprovalDecisionDialog";
import { ApprovalStatusBadge } from "../components/ApprovalStatusBadge";
import { ModuleHeader } from "../components/ModuleHeader";
import { useAccess } from "../hooks/useAccess";
import {
  useApproveRequest,
  useCancelRequest,
  useMyApprovalsQuery,
  usePendingApprovalsQuery,
  useRejectRequest,
} from "../hooks/useApprovals";
import type { UserApprovalRequest } from "../types";

type Tab = "pending" | "mine";

interface DecisionTarget {
  request: UserApprovalRequest;
  decision: "approve" | "reject";
}

export default function ApprovalsPage() {
  const access = useAccess();

  // The backend gates each queue by role: pending needs AUTHORIZER/ADMIN,
  // "mine" needs CONTROL/ADMIN. Only offer the tabs the user can actually
  // load, defaulting to the first permitted one.
  const tabs = (
    [
      { key: "pending", label: "Pending", icon: Hourglass, allowed: access.canReview },
      {
        key: "mine",
        label: "My requests",
        icon: ClipboardCheck,
        allowed: access.canMakeChanges,
      },
    ] as const
  ).filter((tab) => tab.allowed);

  const [tab, setTab] = useState<Tab>(() => tabs[0]?.key ?? "pending");

  const [pendingPage, setPendingPage] = useState(1);
  const [minePage, setMinePage] = useState(1);
  const pageSize = 12;

  // Each queue is role-gated server-side; skip the one the user can't load.
  const pendingQuery = usePendingApprovalsQuery(
    { page: pendingPage - 1, size: pageSize, sort: "requestedAt,desc" },
    access.canReview,
  );

  const mineQuery = useMyApprovalsQuery(
    { page: minePage - 1, size: pageSize, sort: "requestedAt,desc" },
    access.canMakeChanges,
  );

  const [decisionTarget, setDecisionTarget] = useState<DecisionTarget | null>(
    null,
  );
  const [cancelTarget, setCancelTarget] = useState<UserApprovalRequest | null>(
    null,
  );

  const approve = useApproveRequest({
    onSuccess: (request) => {
      toast.success(`Request #${request.id} approved.`);
      setDecisionTarget(null);
    },
  });

  const reject = useRejectRequest({
    onSuccess: (request) => {
      toast.success(`Request #${request.id} was rejected.`);
      setDecisionTarget(null);
    },
  });

  const cancel = useCancelRequest({
    onSuccess: (request) => {
      toast.success(`Request #${request.id} withdrawn.`);
      setCancelTarget(null);
    },
  });

  const isPending = tab === "pending";
  const query = isPending ? pendingQuery : mineQuery;
  const rows = query.data?.content ?? [];
  const totalRows = query.data?.totalElements ?? 0;
  const pageCount = Math.max(1, query.data?.totalPages ?? 1);
  const page = isPending ? pendingPage : minePage;
  const setPage = isPending ? setPendingPage : setMinePage;

  const columns: Array<DataTableColumn<UserApprovalRequest>> = [
    {
      id: "id",
      header: "Request",
      cell: (request) => (
        <span className="font-medium tabular-nums text-neutral-900">
          #{request.id}
        </span>
      ),
    },
    {
      id: "action",
      header: "Action",
      cell: (request) => (
        <Badge variant="outline">{titleCase(request.action)}</Badge>
      ),
    },
    {
      id: "user",
      header: "User",
      cell: (request) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-900">
            {request.username}
          </p>

          {request.roleNames.length > 0 && (
            <p className="truncate text-xs text-neutral-500">
              {request.roleNames.map(titleCase).join(", ")}
            </p>
          )}
        </div>
      ),
    },
    {
      id: "maker",
      header: "Requested by",
      hideBelow: "lg",
      cell: (request) => (
        <span className="text-neutral-600">{request.makerUsername}</span>
      ),
    },
    {
      id: "requestedAt",
      header: "Requested",
      hideBelow: "md",
      cell: (request) => (
        <span className="text-neutral-600">
          {formatDateTime(request.createdAt)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (request) => <ApprovalStatusBadge status={request.status} />,
    },
    {
      id: "reason",
      header: "Reason",
      hideBelow: "xl",
      cell: (request) =>
        request.reason ? (
          <span
            className="block max-w-56 truncate text-neutral-600"
            title={request.reason}
          >
            {request.reason}
          </span>
        ) : (
          <span className="text-neutral-300">—</span>
        ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      cell: (request) => (
        <div
          className="flex justify-end gap-1.5"
          onClick={(event) => event.stopPropagation()}
        >
          {request.status === "PENDING" &&
            (isPending ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDecisionTarget({ request, decision: "approve" })}
                >
                  <Check className="size-3.5" />
                  Approve
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setDecisionTarget({ request, decision: "reject" })}
                >
                  <X className="size-3.5" />
                  Reject
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelTarget(request)}
              >
                Withdraw
              </Button>
            ))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Approvals"
        description="Maker-checker queue. Sensitive changes only take effect once an authorizer approves them."
        eyebrow={
          <Link
            to="/users"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            Back to user management
          </Link>
        }
      />

      <nav
        aria-label="Approval queue sections"
        className="flex gap-1 border-b border-neutral-200"
      >
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key);
              setDecisionTarget(null);
            }}
            className={cn(
              "relative -mb-px inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === key
                ? "text-primary"
                : "text-neutral-500 hover:text-neutral-800",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}

            {tab === key && (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </nav>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <DataTable
          caption={`${tab === "pending" ? "Pending" : "My"} approval requests`}
          columns={columns}
          rows={rows}
          getRowId={(request) => request.id}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={query.refetch}
          empty={
            <EmptyState
              icon={Hourglass}
              title={
                tab === "pending"
                  ? "The queue is clear"
                  : "You haven't submitted any requests"
              }
              description={
                tab === "pending"
                  ? "No requests are waiting for approval right now."
                  : "User creation, role changes and access actions you submit will appear here."
              }
            />
          }
        />

        {!query.isLoading && !query.error && totalRows > 0 && (
          <TablePagination
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            totalRows={totalRows}
            onPageChange={setPage}
            onPageSizeChange={() => {
              setPage(1);
            }}
          />
        )}
      </div>

      <ApprovalDecisionDialog
        open={decisionTarget !== null}
        decision={decisionTarget?.decision ?? "approve"}
        description={
          decisionTarget
            ? `Request #${decisionTarget.request.id} — ${titleCase(decisionTarget.request.action)} for ${decisionTarget.request.username}, requested by ${decisionTarget.request.makerUsername}.`
            : undefined
        }
        onClose={() => setDecisionTarget(null)}
        isPending={
          (decisionTarget?.decision === "approve"
            ? approve.isPending
            : reject.isPending) ?? false
        }
        error={
          decisionTarget?.decision === "approve"
            ? approve.error
            : reject.error
        }
        onConfirm={(remark) => {
          if (!decisionTarget) return;

          if (decisionTarget.decision === "approve") {
            approve.mutate({ id: decisionTarget.request.id, remark });
          } else {
            reject.mutate({ id: decisionTarget.request.id, remark });
          }
        }}
      />

      <ConfirmDialog
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          if (!cancelTarget) return;
          cancel.mutate(cancelTarget.id);
        }}
        title="Withdraw this request?"
        description={
          cancelTarget
            ? `Request #${cancelTarget.id} (${titleCase(cancelTarget.action)}) will be cancelled and won't be reviewed.`
            : undefined
        }
        confirmLabel="Withdraw"
        isPending={cancel.isPending}
        error={cancel.error}
      />
    </div>
  );
}
