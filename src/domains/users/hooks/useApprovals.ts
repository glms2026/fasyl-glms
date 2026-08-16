import { useApiMutation } from "@/hooks/useApiMutation";
import { useApiQuery } from "@/hooks/useApiQuery";

import { approvalService } from "../services/approvalService";
import type { PageRequest, UserApprovalRequest } from "../types";

export const approvalQueryKeys = {
  all: "approvals",
  pending: "approvals:pending",
  mine: "approvals:mine",
  detail: (id: number | string) => `approvals:detail:${id}`,
} as const;

interface ListParams extends PageRequest {
  page: number;
  size: number;
}

export function usePendingApprovalsQuery(params: ListParams, enabled = true) {
  const key = [
    approvalQueryKeys.pending,
    params.page,
    params.size,
    params.sort ?? "requestedAt,desc",
  ].join(":");

  return useApiQuery(key, () => approvalService.listPending(params), { enabled });
}

export function useMyApprovalsQuery(params: ListParams, enabled = true) {
  const key = [
    approvalQueryKeys.mine,
    params.page,
    params.size,
    params.sort ?? "requestedAt,desc",
  ].join(":");

  return useApiQuery(key, () => approvalService.listMine(params), { enabled });
}

/**
 * Lightweight pending count for nav badges — fetches one row, reads total.
 * The pending queue is AUTHORIZER/ADMIN only, so callers outside those
 * roles pass `enabled = false` to avoid a guaranteed 403.
 */
export function usePendingApprovalsCount(enabled = true) {
  const query = useApiQuery(
    `${approvalQueryKeys.pending}:count`,
    () => approvalService.listPending({ page: 0, size: 1 }),
    { enabled },
  );

  return {
    ...query,
    count: query.data?.totalElements ?? 0,
  };
}

interface MutationCallbacks {
  onSuccess?: (data: UserApprovalRequest) => void;
  onError?: (message: string) => void;
}

export function useApproveRequest({ onSuccess, onError }: MutationCallbacks = {}) {
  return useApiMutation<{ id: number; remark?: string }, UserApprovalRequest>(
    ({ id, remark }) => approvalService.approve(id, { remark }),
    { invalidates: [approvalQueryKeys.all, "users"], onSuccess, onError },
  );
}

export function useRejectRequest({ onSuccess, onError }: MutationCallbacks = {}) {
  return useApiMutation<{ id: number; remark?: string }, UserApprovalRequest>(
    ({ id, remark }) => approvalService.reject(id, { remark }),
    { invalidates: [approvalQueryKeys.all, "users"], onSuccess, onError },
  );
}

export function useCancelRequest({ onSuccess, onError }: MutationCallbacks = {}) {
  return useApiMutation<number, UserApprovalRequest>(
    (id) => approvalService.cancel(id),
    { invalidates: [approvalQueryKeys.all, "users"], onSuccess, onError },
  );
}

export function useAssignRoleApproval({ onSuccess, onError }: MutationCallbacks = {}) {
  return useApiMutation<{ userId: number; roles: string[]; reason: string }, UserApprovalRequest>(
    ({ userId, roles, reason }) => approvalService.assignRole({ userId, roles, reason }),
    { invalidates: [approvalQueryKeys.all], onSuccess, onError },
  );
}
