/**
 * Role pill colours.
 *
 * Every role chip gets a colour of its own so a glance at the roles field
 * distinguishes the access each account holds. Known seed roles map to a
 * colour that matches their job (red for the most privileged, green for the
 * makers, amber for the checker gate…); any other role name gets a stable
 * colour picked deterministically from the palette, so the same role always
 * renders the same colour.
 */

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "border-red-200 bg-red-50 text-red-700",
  CONTROL: "border-sky-200 bg-sky-50 text-sky-700",
  AUTHORIZER: "border-amber-200 bg-amber-50 text-amber-700",
  CREATOR: "border-emerald-200 bg-emerald-50 text-emerald-700",
  VIEWER: "border-neutral-200 bg-neutral-100 text-neutral-700",
};

const PALETTE = [
  "border-violet-200 bg-violet-50 text-violet-700",
  "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
  "border-teal-200 bg-teal-50 text-teal-700",
  "border-orange-200 bg-orange-50 text-orange-700",
  "border-indigo-200 bg-indigo-50 text-indigo-700",
  "border-rose-200 bg-rose-50 text-rose-700",
  "border-lime-200 bg-lime-50 text-lime-700",
  "border-cyan-200 bg-cyan-50 text-cyan-700",
] as const;

/** Coloured pill classes (border + tint + text) for a role name. */
export function roleColorClass(role: string): string {
  const key = role.trim().toUpperCase();

  const fixed = ROLE_COLORS[key];
  if (fixed) return fixed;

  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }

  return PALETTE[hash % PALETTE.length];
}
