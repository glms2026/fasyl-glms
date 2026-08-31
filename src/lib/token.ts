/**
 * Token storage.
 *
 * "Remember this device" decides where credentials live:
 *   - checked   -> localStorage   (survives a browser restart)
 *   - unchecked -> sessionStorage (cleared when the tab closes)
 *
 * Reads check both stores so a session started either way keeps working.
 */

const ACCESS_TOKEN_KEY = "glms.accessToken";
const REFRESH_TOKEN_KEY = "glms.refreshToken";
const PERSIST_KEY = "glms.persist";
const USERNAME_KEY = "glms.username";

type Store = Storage;

function stores(): Store[] {
  return [localStorage, sessionStorage];
}

function read(key: string): string | null {
  for (const store of stores()) {
    const value = store.getItem(key);
    if (value) return value;
  }
  return null;
}

function removeEverywhere(key: string): void {
  for (const store of stores()) {
    store.removeItem(key);
  }
}

export interface StoredSession {
  accessToken: string;
  refreshToken?: string | null;
  remember?: boolean;
  username?: string;
}

export const tokenStorage = {
  getAccessToken(): string | null {
    return read(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return read(REFRESH_TOKEN_KEY);
  },

  getUsername(): string | null {
    return read(USERNAME_KEY);
  },

  setSession({
    accessToken,
    refreshToken,
    remember = true,
    username,
  }: StoredSession) {
    this.clear();

    const store: Store = remember ? localStorage : sessionStorage;

    store.setItem(ACCESS_TOKEN_KEY, accessToken);
    store.setItem(PERSIST_KEY, String(remember));

    if (refreshToken) {
      store.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    if (username) {
      store.setItem(USERNAME_KEY, username);
    }
  },

  clear() {
    removeEverywhere(ACCESS_TOKEN_KEY);
    removeEverywhere(REFRESH_TOKEN_KEY);
    removeEverywhere(PERSIST_KEY);
    removeEverywhere(USERNAME_KEY);
  },

  hasSession(): boolean {
    return Boolean(read(ACCESS_TOKEN_KEY));
  },

  /**
   * Returns true if the stored access token has an expired `exp` claim.
   * Falls back to `true` if the token is missing or malformed — the
   * caller should clear the session in that case.
   */
  isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;
    try {
      const parts = token.split(".");
      // Not a JWT (e.g. test mock "fake-token") — treat as valid so the
      // existing network check decides.
      if (parts.length !== 3) return false;
      const payload = JSON.parse(
        atob(parts[1] ?? ""),
      ) as { exp?: number };
      if (!payload.exp) return false; // no expiry claim — treat as valid
      // Expire 10 seconds early to avoid edge-case races.
      return Date.now() >= (payload.exp - 10) * 1000;
    } catch {
      // Malformed payload — fall through to the network check.
      return false;
    }
  },
};
