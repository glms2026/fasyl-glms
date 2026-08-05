/**
 * Minimal query-invalidation bus.
 *
 * The project deliberately stays on plain services + zustand rather than a
 * data-fetching library, so this supplies the one thing that is genuinely
 * hard to hand-roll per screen: telling every mounted query with a given key
 * to refetch after a mutation.
 *
 * Keys are namespaced with ":" and matched by prefix, so invalidating
 * "users" also refreshes "users:list" and "users:detail:12".
 */

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();

export function subscribeToQueryKey(key: string, listener: Listener): () => void {
  const existing = listeners.get(key) ?? new Set<Listener>();

  existing.add(listener);
  listeners.set(key, existing);

  return () => {
    existing.delete(listener);

    if (existing.size === 0) {
      listeners.delete(key);
    }
  };
}

export function invalidateQueries(...keys: string[]): void {
  for (const key of keys) {
    for (const [registeredKey, registeredListeners] of listeners) {
      const matches =
        registeredKey === key || registeredKey.startsWith(`${key}:`);

      if (!matches) continue;

      for (const listener of registeredListeners) {
        listener();
      }
    }
  }
}
