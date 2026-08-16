import { useCallback } from "react";

import { useApiMutation } from "@/hooks/useApiMutation";
import { useApiQuery } from "@/hooks/useApiQuery";

import { userService } from "../services/userService";
import type {
  AssignRoleRequest,
  CreateUserRequest,
  ManagedUser,
  Page,
  PageRequest,
  UpdateUserRequest,
  UserActionRequest,
} from "../types";

/** Query keys — prefix-matched, so invalidating "users" refreshes them all. */
export const userQueryKeys = {
  all: "users",
  list: "users:list",
  /** The full unfiltered list used by the overview screen. */
  allUsers: "users:all",
  detail: (id: number | string) => `users:detail:${id}`,
} as const;

interface ListParams extends PageRequest {
  page: number;
  size: number;
}

/** Server-paginated directory. Key embeds the params so changes refetch. */
export function useUsersQuery(params: ListParams) {
  const key = [
    userQueryKeys.list,
    params.page,
    params.size,
    params.sort ?? "createdAt,desc",
  ].join(":");

  return useApiQuery<Page<ManagedUser>>(key, () => userService.list(params));
}

/** Every user on one request — used where whole-population maths is needed. */
export function useAllUsersQuery() {
  return useApiQuery<ManagedUser[]>(userQueryKeys.allUsers, async () => {
    const page = await userService.list({ page: 0, size: 1000 });

    return page.content;
  });
}

export function useUserQuery(id: number | undefined) {
  const fetcher = useCallback(() => userService.getById(id as number), [id]);

  return useApiQuery<ManagedUser>(
    userQueryKeys.detail(id ?? "none"),
    fetcher,
    { enabled: typeof id === "number" && !Number.isNaN(id) },
  );
}

interface MutationCallbacks<TData> {
  onSuccess?: (data: TData) => void;
  onError?: (message: string) => void;
}

export function useCreateUser({ onSuccess, onError }: MutationCallbacks<ManagedUser> = {}) {
  return useApiMutation<CreateUserRequest, ManagedUser>(
    (payload) => userService.create(payload),
    { invalidates: [userQueryKeys.all], onSuccess, onError },
  );
}

export function useUpdateUser({ onSuccess, onError }: MutationCallbacks<unknown> = {}) {
  return useApiMutation<{ id: number; payload: UpdateUserRequest }, unknown>(
    ({ id, payload }) => userService.update(id, payload),
    { invalidates: [userQueryKeys.all], onSuccess, onError },
  );
}

export function useAssignRoles({ onSuccess, onError }: MutationCallbacks<unknown> = {}) {
  return useApiMutation<{ id: number; payload: AssignRoleRequest }, unknown>(
    ({ id, payload }) => userService.assignRoles(id, payload),
    { invalidates: [userQueryKeys.all], onSuccess, onError },
  );
}

export function useLockUser({ onSuccess, onError }: MutationCallbacks<unknown> = {}) {
  return useApiMutation<{ id: number; reason: string }, unknown>(
    ({ id, reason }) => userService.lock(id, { reason } satisfies UserActionRequest),
    { invalidates: [userQueryKeys.all], onSuccess, onError },
  );
}

export function useUnlockUser({ onSuccess, onError }: MutationCallbacks<string> = {}) {
  return useApiMutation<number, string>(
    (id) => userService.unlock(id),
    { invalidates: [userQueryKeys.all], onSuccess, onError },
  );
}

export function useSuspendUser({ onSuccess, onError }: MutationCallbacks<unknown> = {}) {
  return useApiMutation<{ id: number; reason: string }, unknown>(
    ({ id, reason }) => userService.suspend(id, { reason } satisfies UserActionRequest),
    { invalidates: [userQueryKeys.all], onSuccess, onError },
  );
}

export function useUnsuspendUser({ onSuccess, onError }: MutationCallbacks<unknown> = {}) {
  return useApiMutation<{ id: number; reason: string }, unknown>(
    ({ id, reason }) =>
      userService.unsuspend(id, { reason } satisfies UserActionRequest),
    { invalidates: [userQueryKeys.all], onSuccess, onError },
  );
}

/** DELETE /api/users/{id} — ADMIN-only, soft delete, immediate. */
export function useDeleteUser({ onSuccess, onError }: MutationCallbacks<void> = {}) {
  return useApiMutation<number, void>(
    (id) => userService.deleteUser(id),
    { invalidates: [userQueryKeys.all], onSuccess, onError },
  );
}

export function useActivateUser({ onSuccess, onError }: MutationCallbacks<string> = {}) {
  return useApiMutation<number, string>(
    (id) => userService.activate(id),
    { invalidates: [userQueryKeys.all], onSuccess, onError },
  );
}

export function useDeactivateUser({ onSuccess, onError }: MutationCallbacks<unknown> = {}) {
  return useApiMutation<{ id: number; reason: string }, unknown>(
    ({ id, reason }) => userService.deactivate(id, { reason } satisfies UserActionRequest),
    { invalidates: [userQueryKeys.all], onSuccess, onError },
  );
}
