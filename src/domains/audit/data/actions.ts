import {
  Activity,
  BookPlus,
  CheckCircle2,
  Eye,
  KeyRound,
  Lock,
  LockOpen,
  LogIn,
  LogOut,
  PauseCircle,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserCog,
  UserPlus,
  UserX,
  XCircle,
  type LucideIcon,
} from "lucide-react";

/**
 * One theme per action category. Each tone carries the chip classes used
 * by the timeline rail and the badge classes used by the detail dialog, so
 * an action reads the same colour everywhere it appears.
 */
export type ActionTone =
  | "create"
  | "assign"
  | "update"
  | "read"
  | "lock"
  | "suspend"
  | "deactivate"
  | "recover"
  | "auth"
  | "password"
  | "ledger"
  | "permission"
  | "neutral";

export interface ActionMeta {
  icon: LucideIcon;
  tone: ActionTone;
}

/** Icon-chip classes per tone (tinted fill + matching glyph). */
export const actionToneStyles: Record<ActionTone, string> = {
  create: "bg-emerald-50 text-emerald-600",
  assign: "bg-teal-50 text-teal-600",
  update: "bg-blue-50 text-blue-600",
  read: "bg-slate-100 text-slate-500",
  lock: "bg-amber-50 text-amber-600",
  suspend: "bg-orange-50 text-orange-600",
  deactivate: "bg-red-50 text-red-600",
  recover: "bg-green-50 text-green-600",
  auth: "bg-indigo-50 text-indigo-600",
  password: "bg-violet-50 text-violet-600",
  ledger: "bg-cyan-50 text-cyan-600",
  permission: "bg-purple-50 text-purple-600",
  neutral: "bg-neutral-100 text-neutral-500",
};

/**
 * Card wash per tone — a faint gradient from the theme colour into white,
 * used as the activity card background. The hover variant intensifies the
 * same tint so the card still signals interactivity.
 */
export const actionCardClasses: Record<ActionTone, string> = {
  create: "bg-gradient-to-br from-emerald-200/80 via-emerald-100/30 to-white",
  assign: "bg-gradient-to-br from-teal-200/80 via-teal-100/30 to-white",
  update: "bg-gradient-to-br from-blue-200/80 via-blue-100/30 to-white",
  read: "bg-gradient-to-br from-slate-300/80 via-slate-200/30 to-white",
  lock: "bg-gradient-to-br from-amber-200/80 via-amber-100/30 to-white",
  suspend: "bg-gradient-to-br from-orange-200/80 via-orange-100/30 to-white",
  deactivate: "bg-gradient-to-br from-red-200/80 via-red-100/30 to-white",
  recover: "bg-gradient-to-br from-green-200/80 via-green-100/30 to-white",
  auth: "bg-gradient-to-br from-indigo-200/80 via-indigo-100/30 to-white",
  password: "bg-gradient-to-br from-violet-200/80 via-violet-100/30 to-white",
  ledger: "bg-gradient-to-br from-cyan-200/80 via-cyan-100/30 to-white",
  permission: "bg-gradient-to-br from-purple-200/80 via-purple-100/30 to-white",
  neutral: "bg-gradient-to-br from-neutral-300/80 via-neutral-200/30 to-white",
};

export const actionCardHoverClasses: Record<ActionTone, string> = {
  create: "hover:from-emerald-300/80 hover:via-emerald-100/40 hover:to-white",
  assign: "hover:from-teal-300/80 hover:via-teal-100/40 hover:to-white",
  update: "hover:from-blue-300/80 hover:via-blue-100/40 hover:to-white",
  read: "hover:from-slate-400/80 hover:via-slate-200/40 hover:to-white",
  lock: "hover:from-amber-300/80 hover:via-amber-100/40 hover:to-white",
  suspend: "hover:from-orange-300/80 hover:via-orange-100/40 hover:to-white",
  deactivate: "hover:from-red-300/80 hover:via-red-100/40 hover:to-white",
  recover: "hover:from-green-300/80 hover:via-green-100/40 hover:to-white",
  auth: "hover:from-indigo-300/80 hover:via-indigo-100/40 hover:to-white",
  password: "hover:from-violet-300/80 hover:via-violet-100/40 hover:to-white",
  ledger: "hover:from-cyan-300/80 hover:via-cyan-100/40 hover:to-white",
  permission: "hover:from-purple-300/80 hover:via-purple-100/40 hover:to-white",
  neutral: "hover:from-neutral-400/80 hover:via-neutral-200/40 hover:to-white",
};

/** Left accent bar per tone — a thin coloured edge on the row's first cell. */
export const actionRowAccentClasses: Record<ActionTone, string> = {
  create: "border-l-emerald-400",
  assign: "border-l-teal-400",
  update: "border-l-blue-400",
  read: "border-l-slate-300",
  lock: "border-l-amber-400",
  suspend: "border-l-orange-400",
  deactivate: "border-l-red-400",
  recover: "border-l-green-400",
  auth: "border-l-indigo-400",
  password: "border-l-violet-400",
  ledger: "border-l-cyan-400",
  permission: "border-l-purple-400",
  neutral: "border-l-neutral-300",
};

/** Row wash per tone — a symmetrical horizontal gradient that washes the
 *  theme colour in from both edges and fades toward the centre, so each
 *  table row keeps the card's colour identity on both sides. */
export const actionRowClasses: Record<ActionTone, string> = {
  create: "bg-gradient-to-r from-emerald-100/70 via-white to-emerald-100/70",
  assign: "bg-gradient-to-r from-teal-100/70 via-white to-teal-100/70",
  update: "bg-gradient-to-r from-blue-100/70 via-white to-blue-100/70",
  read: "bg-gradient-to-r from-slate-200/60 via-white to-slate-200/60",
  lock: "bg-gradient-to-r from-amber-100/70 via-white to-amber-100/70",
  suspend: "bg-gradient-to-r from-orange-100/70 via-white to-orange-100/70",
  deactivate: "bg-gradient-to-r from-red-100/70 via-white to-red-100/70",
  recover: "bg-gradient-to-r from-green-100/70 via-white to-green-100/70",
  auth: "bg-gradient-to-r from-indigo-100/70 via-white to-indigo-100/70",
  password: "bg-gradient-to-r from-violet-100/70 via-white to-violet-100/70",
  ledger: "bg-gradient-to-r from-cyan-100/70 via-white to-cyan-100/70",
  permission: "bg-gradient-to-r from-purple-100/70 via-white to-purple-100/70",
  neutral: "bg-gradient-to-r from-neutral-200/60 via-white to-neutral-200/60",
};

/** Hover intensification of the row wash, deepened on both edges. */
export const actionRowHoverClasses: Record<ActionTone, string> = {
  create: "hover:from-emerald-200/60 hover:to-emerald-200/60",
  assign: "hover:from-teal-200/60 hover:to-teal-200/60",
  update: "hover:from-blue-200/60 hover:to-blue-200/60",
  read: "hover:from-slate-300/50 hover:to-slate-300/50",
  lock: "hover:from-amber-200/60 hover:to-amber-200/60",
  suspend: "hover:from-orange-200/60 hover:to-orange-200/60",
  deactivate: "hover:from-red-200/60 hover:to-red-200/60",
  recover: "hover:from-green-200/60 hover:to-green-200/60",
  auth: "hover:from-indigo-200/60 hover:to-indigo-200/60",
  password: "hover:from-violet-200/60 hover:to-violet-200/60",
  ledger: "hover:from-cyan-200/60 hover:to-cyan-200/60",
  permission: "hover:from-purple-200/60 hover:to-purple-200/60",
  neutral: "hover:from-neutral-300/50 hover:to-neutral-300/50",
};

/** Action-name text colour per tone, used inside table cells. */
export const actionTextClasses: Record<ActionTone, string> = {
  create: "text-emerald-700",
  assign: "text-teal-700",
  update: "text-blue-700",
  read: "text-slate-600",
  lock: "text-amber-700",
  suspend: "text-orange-700",
  deactivate: "text-red-700",
  recover: "text-green-700",
  auth: "text-indigo-700",
  password: "text-violet-700",
  ledger: "text-cyan-700",
  permission: "text-purple-700",
  neutral: "text-neutral-600",
};

/** Pill classes per tone for the ActionBadge in dialogs and summaries. */
export const actionBadgeClasses: Record<ActionTone, string> = {
  create: "border-transparent bg-emerald-50 text-emerald-700",
  assign: "border-transparent bg-teal-50 text-teal-700",
  update: "border-transparent bg-blue-50 text-blue-700",
  read: "border-neutral-200 bg-neutral-50 text-neutral-600",
  lock: "border-transparent bg-amber-50 text-amber-700",
  suspend: "border-transparent bg-orange-50 text-orange-700",
  deactivate: "border-transparent bg-red-50 text-red-700",
  recover: "border-transparent bg-green-50 text-green-700",
  auth: "border-transparent bg-indigo-50 text-indigo-700",
  password: "border-transparent bg-violet-50 text-violet-700",
  ledger: "border-transparent bg-cyan-50 text-cyan-700",
  permission: "border-transparent bg-purple-50 text-purple-700",
  neutral: "border-neutral-200 bg-neutral-50 text-neutral-600",
};

/** Exact-name wins over pattern matching (e.g. LOGIN vs LOGIN_FAILED). */
const OVERRIDES: Record<string, ActionMeta> = {
  LOGIN: { icon: LogIn, tone: "auth" },
  LOGOUT: { icon: LogOut, tone: "neutral" },
  LOGIN_FAILED: { icon: LogIn, tone: "deactivate" },
  APPROVE: { icon: CheckCircle2, tone: "recover" },
  REJECT: { icon: XCircle, tone: "deactivate" },
};

/**
 * Picks an icon + colour theme for an audit action. The backend action
 * names are free-form strings, so this matches the well-known set by
 * keyword and falls back to a neutral marker for anything newer than this
 * client.
 */
export function getActionMeta(action: string): ActionMeta {
  const key = action.toUpperCase();
  const override = OVERRIDES[key];

  if (override) return override;

  // Order matters: "DEACTIVATE" contains "ACTIVATE" and "UNSUSPEND"
  // contains "SUSPEND", so the more specific (and negative) terms must
  // be tested before the positive ones they contain.
  if (key.includes("DEACTIVATE")) return { icon: UserX, tone: "deactivate" };
  if (key.includes("DELETE") || key.includes("REMOVE")) {
    return { icon: Trash2, tone: "deactivate" };
  }
  if (key.includes("UNLOCK") || key.includes("UNSUSPEND")) {
    return { icon: LockOpen, tone: "recover" };
  }
  if (key.includes("CREATE")) return { icon: Plus, tone: "create" };
  if (key.includes("ASSIGN")) return { icon: ShieldCheck, tone: "assign" };
  if (key.includes("ACTIVATE")) return { icon: CheckCircle2, tone: "recover" };
  if (key.includes("UPDATE")) return { icon: Pencil, tone: "update" };
  if (key.includes("LOCK")) return { icon: Lock, tone: "lock" };
  if (key.includes("SUSPEND")) return { icon: PauseCircle, tone: "suspend" };
  if (key.includes("READ")) return { icon: Eye, tone: "read" };
  if (key.includes("PASSWORD")) return { icon: KeyRound, tone: "password" };
  if (key.includes("PERMISSION") || key.includes("ROLE")) {
    return { icon: UserCog, tone: "permission" };
  }
  if (key.includes("LEDGER")) return { icon: BookPlus, tone: "ledger" };
  if (key.includes("USER")) return { icon: UserPlus, tone: "update" };

  return { icon: Activity, tone: "neutral" };
}

/**
 * The action names offered by the filter dropdown. Order matters: it's the
 * curated display order, roughly grouped by what the action does.
 */
export const knownAuditActions: readonly string[] = [
  "USER_CREATE",
  "USER_UPDATE",
  "USER_READ",
  "USER_DEACTIVATE",
  "USER_SUSPEND",
  "USER_LOCK",
  "USER_UNSUSPEND",
  "ACTIVATE_USER",
  "ASSIGN_ROLE",
  "ASSIGN_PERMISSION",
  "REMOVE_PERMISSION",
  "UPDATE_PERMISSION",
  "ROLE_ASSIGN_PERMISSION",
  "LEDGER_CREATE",
  "LEDGER_UPDATE",
  "APPROVE",
  "REJECT",
  "LOGIN",
  "LOGOUT",
  "LOGIN_FAILED",
  "PASSWORD_CHANGE",
  "PASSWORD_RESET",
];
