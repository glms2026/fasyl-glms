import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ClipboardCheck,
  FileText,
  Hourglass,
  Shield,
  TreePine,
  Users,
  X,
} from "lucide-react";
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

/* ------------------------------------------------------------------ */
/*  Action groupings                                                  */
/* ------------------------------------------------------------------ */

const USER_ACTIONS = new Set([
  "USER_CREATE",
  "USER_UPDATE",
  "USER_READ",
  "USER_DEACTIVATE",
  "USER_SUSPEND",
  "USER_LOCK",
  "USER_UNSUSPEND",
  "USER_DELETE",
  "ACTIVATE_USER",
]);

const LEDGER_ACTIONS = new Set(["LEDGER_CREATE", "LEDGER_UPDATE"]);

const ROLE_ACTIONS = new Set([
  "ASSIGN_ROLE",
  "ASSIGN_PERMISSION",
  "REMOVE_PERMISSION",
  "ROLE_ASSIGN_PERMISSION",
  "UPDATE_PERMISSION",
]);

function actionBelongsToTab(action: string, tab: DomainTab): boolean {
  switch (tab) {
    case "users":
      return USER_ACTIONS.has(action);
    case "ledgers":
      return LEDGER_ACTIONS.has(action);
    case "roles":
      return ROLE_ACTIONS.has(action);
    default:
      return false;
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function parsePayload(payloadJson?: string | null): Record<string, unknown> {
  if (!payloadJson) return {};
  try {
    return JSON.parse(payloadJson);
  } catch {
    return {};
  }
}

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type DomainTab = "users" | "ledgers" | "roles";
type QueueTab = "pending" | "mine";

interface DecisionTarget {
  request: UserApprovalRequest;
  decision: "approve" | "reject";
}

/* ------------------------------------------------------------------ */
/*  Tab definitions                                                   */
/* ------------------------------------------------------------------ */

const DOMAIN_TABS: Array<{
  key: DomainTab;
  label: string;
  icon: typeof Users;
}> = [
  { key: "users", label: "Users", icon: Users },
  { key: "ledgers", label: "Ledgers", icon: FileText },
  { key: "roles", label: "Roles & Permissions", icon: Shield },
];

/* ------------------------------------------------------------------ */
/*  Column factories                                                  */
/* ------------------------------------------------------------------ */

function commonColumns(
  isQueuePending: boolean,
  onApprove: (r: UserApprovalRequest) => void,
  onReject: (r: UserApprovalRequest) => void,
  onWithdraw: (r: UserApprovalRequest) => void,
): Array<DataTableColumn<UserApprovalRequest>> {
  return [
    {
      id: "id",
      header: "Request",
      cell: (r) => (
        <span className="font-medium tabular-nums text-neutral-900">
          #{r.id}
        </span>
      ),
    },
    {
      id: "action",
      header: "Action",
      cell: (r) => <Badge variant="outline">{titleCase(r.action)}</Badge>,
    },
    {
      id: "maker",
      header: "Requested by",
      hideBelow: "lg",
      cell: (r) => (
        <span className="text-neutral-600">{r.makerUsername}</span>
      ),
    },
    {
      id: "requestedAt",
      header: "Requested",
      hideBelow: "md",
      cell: (r) => (
        <span className="text-neutral-600">{formatDateTime(r.createdAt)}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (r) => <ApprovalStatusBadge status={r.status} />,
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      cell: (r) => (
        <div
          className="flex justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {r.status === "PENDING" &&
            (isQueuePending ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onApprove(r)}
                >
                  <Check className="size-3.5" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => onReject(r)}
                >
                  <X className="size-3.5" />
                  Reject
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onWithdraw(r)}
              >
                Withdraw
              </Button>
            ))}
        </div>
      ),
    },
  ];
}

function userColumns(): DataTableColumn<UserApprovalRequest>[] {
  return [
    {
      id: "user",
      header: "User",
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-900">
            {r.username}
          </p>
          {r.roleNames.length > 0 && (
            <p className="truncate text-xs text-neutral-500">
              {r.roleNames.map(titleCase).join(", ")}
            </p>
          )}
        </div>
      ),
    },
  ];
}

function ledgerColumns(): DataTableColumn<UserApprovalRequest>[] {
  return [
    {
      id: "ledger",
      header: "Ledger",
      cell: (r) => {
        const ledger = parsePayload(r.payloadJson);
        const code = ledger.ledgerCode as string | undefined;
        if (!code) return <span className="text-neutral-300">—</span>;
        const isLeaf = (ledger.leaf as string)?.toUpperCase() === "Y";
        return (
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-indigo-700">
                {code}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  isLeaf
                    ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/60"
                    : "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200/60",
                )}
              >
                {isLeaf ? (
                  <TreePine className="size-2.5" />
                ) : (
                  <FileText className="size-2.5" />
                )}
                {(ledger.leaf as string)?.toUpperCase() ?? "—"}
              </span>
            </div>
            {ledger.description ? (
              <p className="mt-0.5 truncate text-xs text-neutral-500">
                {String(ledger.description)}
              </p>
            ) : null}
          </div>
        );
      },
    },
  ];
}

function roleColumns(): DataTableColumn<UserApprovalRequest>[] {
  return [
    {
      id: "user",
      header: "User",
      cell: (r) => (
        <span className="truncate font-medium text-neutral-900">
          {r.username}
        </span>
      ),
    },
    {
      id: "details",
      header: "Details",
      hideBelow: "lg",
      cell: (r) => {
        const hasRoles = r.roleNames.length > 0;
        const hasPerms = r.permissions.length > 0;
        if (!hasRoles && !hasPerms) return <span className="text-neutral-300">—</span>;
        return (
          <div className="min-w-0 space-y-1">
            {hasRoles && (
              <div className="flex flex-wrap gap-1">
                {r.roleNames.map((role) => (
                  <Badge key={role} variant="outline" className="text-[10px]">
                    {titleCase(role)}
                  </Badge>
                ))}
              </div>
            )}
            {hasPerms && (
              <p className="truncate text-xs text-neutral-500" title={r.permissions.join(", ")}>
                {String(r.permissions.length)} permission{r.permissions.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        );
      },
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function ApprovalsPage() {
  const access = useAccess();

  /* ---- State ---- */
  const [domainTab, setDomainTab] = useState<DomainTab>("users");
  const [queueTab, setQueueTab] = useState<QueueTab>("pending");
  const [decisionTarget, setDecisionTarget] = useState<DecisionTarget | null>(null);
  const [cancelTarget, setCancelTarget] = useState<UserApprovalRequest | null>(null);

  const [pendingPage, setPendingPage] = useState(1);
  const [minePage, setMinePage] = useState(1);
  const pageSize = 12;

  /* ---- Queries ---- */
  const pendingQuery = usePendingApprovalsQuery(
    { page: pendingPage - 1, size: 500, sort: "requestedAt,desc" },
    access.canReview,
  );

  const mineQuery = useMyApprovalsQuery(
    { page: minePage - 1, size: 500, sort: "requestedAt,desc" },
    access.canMakeChanges,
  );

  const isPendingQueue = queueTab === "pending";
  const rawQuery = isPendingQueue ? pendingQuery : mineQuery;

  /* ---- Filter rows by domain ---- */
  const allRows = rawQuery.data?.content ?? [];
  const filteredRows = useMemo(
    () => allRows.filter((r) => actionBelongsToTab(r.action, domainTab)),
    [allRows, domainTab],
  );

  /* ---- Client-side pagination ---- */
  const page = isPendingQueue ? pendingPage : minePage;
  const setPage = isPendingQueue ? setPendingPage : setMinePage;
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedRows = filteredRows.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  /* ---- Action handlers ---- */
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

  /* ---- Build columns for current domain ---- */
  const common = commonColumns(
    isPendingQueue,
    (r) => setDecisionTarget({ request: r, decision: "approve" }),
    (r) => setDecisionTarget({ request: r, decision: "reject" }),
    (r) => setCancelTarget(r),
  );

  // Insert domain-specific columns after "action" (index 1)
  const domainCols =
    domainTab === "users"
      ? userColumns()
      : domainTab === "ledgers"
        ? ledgerColumns()
        : roleColumns();

  const columns: Array<DataTableColumn<UserApprovalRequest>> = [
    common[0], // Request #
    common[1], // Action
    ...domainCols,
    ...common.slice(2), // Maker, Requested, Status, Actions
  ];

  /* ---- Queue tabs the user can see ---- */
  const queueTabs = [
    { key: "pending" as QueueTab, label: "Pending", icon: Hourglass, allowed: access.canReview },
    { key: "mine" as QueueTab, label: "My requests", icon: ClipboardCheck, allowed: access.canMakeChanges },
  ].filter((t) => t.allowed);

  /* ---- Domain tab counts (pending requests only) ---- */
  const pendingRows = pendingQuery.data?.content ?? [];
  const domainCounts = useMemo(() => ({
    users: pendingRows.filter((r) => USER_ACTIONS.has(r.action)).length,
    ledgers: pendingRows.filter((r) => LEDGER_ACTIONS.has(r.action)).length,
    roles: pendingRows.filter((r) => ROLE_ACTIONS.has(r.action)).length,
  }), [pendingRows]);

  /* ---- Empty state per domain ---- */
  const emptyTitle =
    domainTab === "users"
      ? "No user approvals"
      : domainTab === "ledgers"
        ? "No ledger approvals"
        : "No role & permission approvals";

  const emptyDesc =
    isPendingQueue
      ? "No requests are waiting for approval in this category."
      : "Requests you submitted in this category will appear here.";

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

      {/* ---- Domain tabs ---- */}
      <nav
        aria-label="Approval domains"
        className="flex gap-1 border-b border-neutral-200"
      >
        {DOMAIN_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setDomainTab(key);
              setDecisionTarget(null);
            }}
            className={cn(
              "relative -mb-px inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
              domainTab === key
                ? "text-primary"
                : "text-neutral-500 hover:text-neutral-800",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
            {domainCounts[key] > 0 && (
              <span
                className={cn(
                  "inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                  domainTab === key
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-neutral-100 text-neutral-500",
                )}
              >
                {domainCounts[key]}
              </span>
            )}
            {domainTab === key && (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </nav>

      {/* ---- Queue sub-tabs ---- */}
      {queueTabs.length > 1 && (
        <div className="flex gap-1" role="tablist">
          {queueTabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={queueTab === key}
              onClick={() => {
                setQueueTab(key);
                setPage(1);
                setDecisionTarget(null);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                queueTab === key
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ---- Table ---- */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <DataTable
          caption={`${domainTab} approval requests — ${queueTab}`}
          columns={columns}
          rows={pagedRows}
          getRowId={(r) => r.id}
          isLoading={rawQuery.isLoading}
          error={rawQuery.error}
          onRetry={rawQuery.refetch}
          empty={
            <EmptyState
              icon={Hourglass}
              title={emptyTitle}
              description={emptyDesc}
            />
          }
        />

        {!rawQuery.isLoading && !rawQuery.error && filteredRows.length > 0 && (
          <TablePagination
            page={safePage}
            pageCount={pageCount}
            pageSize={pageSize}
            totalRows={filteredRows.length}
            onPageChange={setPage}
            onPageSizeChange={() => setPage(1)}
          />
        )}
      </div>

      {/* ---- Approve / Reject dialog ---- */}
      <ApprovalDecisionDialog
        open={decisionTarget !== null}
        decision={decisionTarget?.decision ?? "approve"}
        description={
          decisionTarget
            ? `Request #${decisionTarget.request.id} — ${titleCase(decisionTarget.request.action)} for ${decisionTarget.request.username ?? "N/A"}, requested by ${decisionTarget.request.makerUsername}.`
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

      {/* ---- Withdraw dialog ---- */}
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
