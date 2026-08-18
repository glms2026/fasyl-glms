/**
 * Created-credentials store.
 *
 * The backend never returns a user's password after creation (the maker
 * supplies it up front, and the API only ever echoes the username), so the
 * only way to offer "email the login credentials" from the users table is
 * to keep them locally on the machine that created the account. This store
 * scopes them per user id and only ever holds accounts created from this
 * browser.
 *
 * Lifecycle & access policy:
 * - The "Email credentials" action is restricted to CONTROL-role users (the
 *   row action gates on it; this store has no role knowledge itself).
 * - A saved password is a *temporary* password: it is spent the moment the
 *   account signs in, because the backend forces the change on first
 *   login. `consumeCreatedCredentials` wipes the plaintext on that event so
 *   nobody — CONTROL included — can email credentials that no longer work.
 *
 * Security note: these are plaintext credentials in localStorage, readable
 * by anyone with access to this machine/browser profile. That is the trade
 * this feature asks for; nothing here is ever sent back to the server.
 */

import type { ManagedUser } from "../types";

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
    if (Object.keys(map).length === 0) {
      // Last entry consumed — drop the key so no empty shell lingers.
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Storage full/unavailable — the credentials feature silently degrades.
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

/**
 * Removes stored credentials for a user. Called when the account first
 * signs in on this device: the temporary password is spent by then, so
 * keeping it would let someone email credentials that no longer work.
 */
export function consumeCreatedCredentials(userId: number): void {
  const map = readMap();

  if (!(userId in map)) return;

  delete map[userId];
  writeMap(map);
}

/** Formats credentials as the copyable "Username / Password" block. */
export function formatCredentials(credentials: CreatedCredentials): string {
  return `Username: ${credentials.username}\nPassword: ${credentials.password}`;
}

/** A pre-filled credential email ready to hand off to a mail client. */
export interface CredentialEmail {
  to: string;
  subject: string;
  body: string;
}

/**
 * Builds the welcome email sent to a newly created user. The plaintext
 * password is embedded exactly once, in the body, so the recipient can log
 * in and (per the copy) is told to change it on first sign-in.
 */
export function buildCredentialsEmail(
  user: Pick<ManagedUser, "firstName" | "lastName" | "username" | "email">,
  credentials: CreatedCredentials,
  signature: string,
  loginUrl: string,
): CredentialEmail {
  const fullName =
    `${user.firstName} ${user.lastName}`.trim() || user.username;

  const body = `Dear ${fullName},

You have been successfully added to the General Ledger Management System (GLMS).

Below are your login credentials:

Login Username: ${credentials.username}
Temporary Password: ${credentials.password}
GLMS Login URL: ${loginUrl}

For security purposes, you are required to change your password immediately upon your first-time login. Please do not share your login credentials with anyone.

Once you have successfully changed your password, you can proceed to access and use the GLMS platform.

If you experience any issues while logging in, please contact the system administrator for assistance.

Regards,
${signature}`;

  return { to: user.email, subject: "Your GLMS login credentials", body };
}

/**
 * Serialises an email into Gmail's web-compose URL (view=cm&fs=1). Gmail
 * opens a new compose window pre-filled with the to / subject / body when
 * the URL is visited, which is how the credentials reach the recipient
 * without exposing them through any server-side channel.
 */
export function buildGmailComposeUrl(email: CredentialEmail): string {
  return (
    "https://mail.google.com/mail/?view=cm&fs=1" +
    `&to=${encodeURIComponent(email.to)}` +
    `&su=${encodeURIComponent(email.subject)}` +
    `&body=${encodeURIComponent(email.body)}`
  );
}
