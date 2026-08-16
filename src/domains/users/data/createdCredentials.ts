/**
 * Created-credentials store.
 *
 * The backend never returns a user's password after creation (the maker
 * supplies it up front, and the API only ever echoes the username), so the
 * only way to offer "copy the login credentials" from the users table is to
 * keep them locally on the machine that created the account. This store
 * scopes them per user id and only ever holds accounts created from this
 * browser.
 *
 * Security note: these are plaintext credentials in localStorage, readable
 * by anyone with access to this machine/browser profile. That is the trade
 * this feature asks for; nothing here is ever sent back to the server.
 */

const STORAGE_KEY = "glms:created-credentials:v1";

export interface CreatedCredentials {
  username: string;
  password: string;
  /** When the account was created, ISO string. */
  createdAt: string;
}

interface CredentialsMap {
  [userId: number]: CreatedCredentials;
}

function readMap(): CredentialsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    return raw ? (JSON.parse(raw) as CredentialsMap) : {};
  } catch {
    return {};
  }
}

function writeMap(map: CredentialsMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Storage full/unavailable — the copy feature silently degrades.
  }
}

/** Records the login credentials of a freshly created user. */
export function saveCreatedCredentials(
  userId: number,
  username: string,
  password: string,
): void {
  const map = readMap();

  map[userId] = {
    username,
    password,
    createdAt: new Date().toISOString(),
  };

  writeMap(map);
}

/** Returns the stored credentials for a user, or null if none were saved. */
export function getCreatedCredentials(
  userId: number,
): CreatedCredentials | null {
  return readMap()[userId] ?? null;
}

/** Formats credentials as the copyable "Username / Password" block. */
export function formatCredentials(credentials: CreatedCredentials): string {
  return `Username: ${credentials.username}\nPassword: ${credentials.password}`;
}
