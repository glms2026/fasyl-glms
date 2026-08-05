import { useCallback, useEffect, useRef, useState } from "react";

import { getApiErrorMessage } from "@/lib/errors";
import { invalidateQueries } from "@/lib/queryCache";

export interface UseApiMutationOptions<TVariables, TData> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (message: string, variables: TVariables) => void;
  onSettled?: () => void;
  /** Query keys to refetch once the mutation succeeds. */
  invalidates?: string[];
}

export interface UseApiMutationResult<TVariables, TData> {
  /** Runs the mutation and rethrows on failure. */
  mutateAsync: (variables: TVariables) => Promise<TData>;
  /** Fire-and-forget variant: errors surface through `onError` / `error`. */
  mutate: (variables: TVariables) => void;
  isPending: boolean;
  error: string | null;
  data: TData | undefined;
  reset: () => void;
}

/** Wraps a write operation with pending / error state and query invalidation. */
export function useApiMutation<TVariables = void, TData = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseApiMutationOptions<TVariables, TData> = {},
): UseApiMutationResult<TVariables, TData> {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TData | undefined>(undefined);

  const mutationRef = useRef(mutationFn);
  const optionsRef = useRef(options);

  // Synced after commit rather than during render so the mutation always
  // sees the latest callbacks without refs being written mid-render.
  useEffect(() => {
    mutationRef.current = mutationFn;
    optionsRef.current = options;
  });

  const mutateAsync = useCallback(async (variables: TVariables) => {
    const { onSuccess, onError, invalidates } = optionsRef.current;

    setIsPending(true);
    setError(null);

    try {
      const result = await mutationRef.current(variables);

      setData(result);

      if (invalidates?.length) {
        invalidateQueries(...invalidates);
      }

      onSuccess?.(result, variables);

      return result;
    } catch (caught) {
      const message = getApiErrorMessage(caught);

      setError(message);
      onError?.(message, variables);

      throw caught;
    } finally {
      setIsPending(false);
      optionsRef.current.onSettled?.();
    }
  }, []);

  const mutate = useCallback(
    (variables: TVariables) => {
      void mutateAsync(variables).catch(() => {
        // Errors are already surfaced through state and the onError callback.
      });
    },
    [mutateAsync],
  );

  const reset = useCallback(() => {
    setError(null);
    setData(undefined);
    setIsPending(false);
  }, []);

  return { mutateAsync, mutate, isPending, error, data, reset };
}
