import { useCallback } from "react";

import { useApiMutation } from "@/hooks/useApiMutation";
import { useApiQuery } from "@/hooks/useApiQuery";

import { userService } from "../services/userService";
import type {
  CreateUserRequest,
  LockUserRequest,
  ManagedUser,
  SuspendUserRequest,
  UpdateUserRequest,
} from "../types";

/** Query keys — prefix-matched, so invalidating "users" refreshes them all. */
export const userQueryKeys = {
  all: "users",
  list: "users:list",
  metrics: "users:metrics",
  analytics: "users:analytics",
  detail: (id: number | string) => `users:detail:${id}`,
} as const;

export function useUsersQuery() {
  return useApiQuery<ManagedUser[]>(userQueryKeys.list, () =>
    userService.list(),
  );
}

export function useUserQuery(id: number | undefined) {
  const fetcher = useCallback(() => userService.getById(id as number), [id]);

  return useApiQuery<ManagedUser>(
    userQueryKeys.detail(id ?? "none"),
    fetcher,
    { enabled: typeof id === "number" && !Number.isNaN(id) },
  );
}

export function useUserMetricsQuery() {
  return useApiQuery(userQueryKeys.metrics, () => userService.getMetrics());
}

export function useUserAnalyticsQuery() {
  return useApiQuery(userQueryKeys.analytics, () => userService.getAnalytics());
}

interface MutationCallbacks {
  onSuccess?: (user: ManagedUser) => void;
  onError?: (message: string) => void;
}

export function useCreateUser({ onSuccess, onError }: MutationCallbacks = {}) {
  return useApiMutation<CreateUserRequest, ManagedUser>(
    (payload) => userService.create(payload),
    { invalidates: [userQueryKeys.all], onSuccess, onError },
  );
}

export function useUpdateUser({ onSuccess, onError }: MutationCallbacks = {}) {
  return useApiMutation<UpdateUserRequest, ManagedUser>(
    (payload) => userService.update(payload),
    { invalidates: [userQueryKeys.all], onSuccess, onError },
  );
}

export function useLockUser({ onSuccess, onError }: MutationCallbacks = {}) {
  return useApiMutation<LockUserRequest, ManagedUser>(
    (payload) => userService.lock(payload),
    { invalidates: [userQueryKeys.all], onSuccess, onError },
  );
}

export function useSuspendUser({ onSuccess, onError }: MutationCallbacks = {}) {
  return useApiMutation<SuspendUserRequest, ManagedUser>(
    (payload) => userService.suspend(payload),
    { invalidates: [userQueryKeys.all], onSuccess, onError },
  );
}

export function useActivateUser({ onSuccess, onError }: MutationCallbacks = {}) {
  return useApiMutation<number, ManagedUser>((id) => userService.activate(id), {
    invalidates: [userQueryKeys.all],
    onSuccess,
    onError,
  });
}

export function useResetUserPassword(options: {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
} = {}) {
  return useApiMutation<number, string>(
    (id) => userService.resetPassword(id),
    options,
  );
}
