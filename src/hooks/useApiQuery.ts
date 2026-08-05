import { useCallback, useEffect, useRef, useState } from "react";

import { getApiErrorMessage } from "@/lib/errors";
import { subscribeToQueryKey } from "@/lib/queryCache";

export interface UseApiQueryOptions<T> {
  /** Skip the request until this becomes true (e.g. waiting on a route param). */
  enabled?: boolean;
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (message: string) => void;
}

export interface UseApiQueryResult<T> {
  data: T | undefined;
  error: string | null;
  /** True only for the first load, so skeletons don't flash on refetch. */
  isLoading: boolean;
  /** True for any in-flight request, including background refetches. */
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;
  setData: (updater: T | ((previous: T | undefined) => T)) => void;
}

/**
 * Reads data from a service function and exposes loading / error / success
 * state. Refetches whenever `key` changes or the key is invalidated.
 */
export function useApiQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseApiQueryOptions<T> = {},
): UseApiQueryResult<T> {
  const { enabled = true, initialData, onSuccess, onError } = options;

  const [data, setDataState] = useState<T | undefined>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Callbacks live in refs so changing their identity never refires the
  // request. The sync effect is declared first, so refs are current before
  // the fetch effect below runs on mount.
  const fetcherRef = useRef(fetcher);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);

  useEffect(() => {
    fetcherRef.current = fetcher;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setIsFetching(true);
    setError(null);

    try {
      const result = await fetcherRef.current();

      // Ignore responses a newer request has already superseded.
      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      setDataState(result);
      onSuccessRef.current?.(result);
    } catch (caught) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      const message = getApiErrorMessage(caught);

      setError(message);
      onErrorRef.current?.(message);
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setIsFetching(false);
        setHasLoaded(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Queued rather than called inline: `run` flips the fetching flag, and
    // doing that synchronously inside the effect body cascades an extra
    // render on every mount.
    queueMicrotask(() => {
      void run();
    });
  }, [enabled, key, run]);

  useEffect(() => {
    if (!enabled) return;

    return subscribeToQueryKey(key, () => {
      void run();
    });
  }, [enabled, key, run]);

  const setData = useCallback(
    (updater: T | ((previous: T | undefined) => T)) => {
      setDataState((previous) =>
        typeof updater === "function"
          ? (updater as (value: T | undefined) => T)(previous)
          : updater,
      );
    },
    [],
  );

  return {
    data,
    error,
    isLoading: enabled && !hasLoaded,
    isFetching: enabled && isFetching,
    isError: error !== null,
    refetch: run,
    setData,
  };
}
