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
  create: "bg-gradient-to-br from-emerald-100/70 via-white to-emerald-50/25",
  assign: "bg-gradient-to-br from-teal-100/70 via-white to-teal-50/25",
  update: "bg-gradient-to-br from-blue-100/70 via-white to-blue-50/25",
  read: "bg-gradient-to-br from-slate-200/70 via-white to-slate-100/25",
  lock: "bg-gradient-to-br from-amber-100/70 via-white to-amber-50/25",
  suspend: "bg-gradient-to-br from-orange-100/70 via-white to-orange-50/25",
  deactivate: "bg-gradient-to-br from-red-100/70 via-white to-red-50/25",
  recover: "bg-gradient-to-br from-green-100/70 via-white to-green-50/25",
  auth: "bg-gradient-to-br from-indigo-100/70 via-white to-indigo-50/25",
  password: "bg-gradient-to-br from-violet-100/70 via-white to-violet-50/25",
  ledger: "bg-gradient-to-br from-cyan-100/70 via-white to-cyan-50/25",
  permission: "bg-gradient-to-br from-purple-100/70 via-white to-purple-50/25",
  neutral: "bg-gradient-to-br from-neutral-200/70 via-white to-neutral-100/25",
};

export const actionCardHoverClasses: Record<ActionTone, string> = {
  create: "hover:from-emerald-200/60 hover:via-white hover:to-emerald-50/40",
  assign: "hover:from-teal-200/60 hover:via-white hover:to-teal-50/40",
  update: "hover:from-blue-200/60 hover:via-white hover:to-blue-50/40",
  read: "hover:from-slate-300/60 hover:via-white hover:to-slate-100/40",
  lock: "hover:from-amber-200/60 hover:via-white hover:to-amber-50/40",
  suspend: "hover:from-orange-200/60 hover:via-white hover:to-orange-50/40",
  deactivate: "hover:from-red-200/60 hover:via-white hover:to-red-50/40",
  recover: "hover:from-green-200/60 hover:via-white hover:to-green-50/40",
  auth: "hover:from-indigo-200/60 hover:via-white hover:to-indigo-50/40",
  password: "hover:from-violet-200/60 hover:via-white hover:to-violet-50/40",
  ledger: "hover:from-cyan-200/60 hover:via-white hover:to-cyan-50/40",
  permission: "hover:from-purple-200/60 hover:via-white hover:to-purple-50/40",
  neutral: "hover:from-neutral-300/60 hover:via-white hover:to-neutral-100/40",
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
  "USER_UNLOCK",
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
