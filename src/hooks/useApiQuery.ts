import { useCallback, useEffect, useRef, useState } from "react";
import { AxiosError } from "axios";

import { getApiErrorMessage } from "@/lib/errors";
import { subscribeToQueryKey } from "@/lib/queryCache";

/**
 * Backoff schedule for transient network failures. The hosted backend sleeps
 * when idle and takes 60-90s to cold-start, so a request can fail or hang
 * once before the instance is warm. Only network-level failures retry;
 * HTTP 4xx/5xx responses are surfaced immediately.
 */
const RETRY_DELAYS = [2_000, 5_000, 10_000];

function isTransientNetworkError(caught: unknown): boolean {
  if (!(caught instanceof AxiosError)) return false;

  return (
    caught.code === "ERR_NETWORK" ||
    caught.code === "ECONNABORTED" ||
    caught.code === "ETIMEDOUT" ||
    caught.response === undefined
  );
}

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

    const attempt = async (retryIndex: number): Promise<void> => {
      // Ignore responses a newer request has already superseded.
      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      try {
        const result = await fetcherRef.current();

        if (!mountedRef.current || requestId !== requestIdRef.current) return;

        setDataState(result);
        onSuccessRef.current?.(result);
        setHasLoaded(true);
        setIsFetching(false);
      } catch (caught) {
        if (!mountedRef.current || requestId !== requestIdRef.current) return;

        const delay = RETRY_DELAYS[retryIndex];

        // Transient network failure (backend cold-starting, connection
        // dropped): retry with backoff, keeping the fetching flag set so
        // the UI doesn't flash an error state between attempts.
        if (isTransientNetworkError(caught) && delay !== undefined) {
          window.setTimeout(() => {
            void attempt(retryIndex + 1);
          }, delay);
          return;
        }

        const message = getApiErrorMessage(caught);

        setError(message);
        onErrorRef.current?.(message);
        setHasLoaded(true);
        setIsFetching(false);
      }
    };

    await attempt(0);
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
