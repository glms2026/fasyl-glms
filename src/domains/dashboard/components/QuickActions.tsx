import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ChevronRight, KeyRound, Plus, UserPlus, Users } from "lucide-react";

import { useAccess } from "@/domains/users/hooks/useAccess";

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  /** Only makers (CONTROL/ADMIN) may reach the destination. */
  makerOnly?: boolean;
  /** If set, only these roles see the action. */
  allowedRoles?: readonly string[];
}

/** Every destination here is a mounted route — no dead links. */
const actions: QuickAction[] = [
  {
    label: "Create GL account",
    description: "Open a new ledger account",
    href: "/create-gl",
    icon: Plus,
    allowedRoles: ["ADMIN", "CREATOR"],
  },
  {
    label: "Add a user",
    description: "Invite a colleague and set access",
    href: "/users/new",
    icon: UserPlus,
    makerOnly: true,
  },
  {
    label: "Manage users",
    description: "Review roles, locks and suspensions",
    href: "/users/list",
    icon: Users,
    allowedRoles: ["ADMIN", "CONTROL", "AUTHORIZER"],
  },
  {
    label: "Change your password",
    description: "Update your sign-in credentials",
    href: "/change-password",
    icon: KeyRound,
  },
];

export function QuickActions() {
  const { canMakeChanges, roles } = useAccess();

  const visible = actions.filter((action) => {
    if (action.makerOnly && !canMakeChanges) return false;
    if (action.allowedRoles) return action.allowedRoles.some((r) => roles.includes(r));
    return true;
  });

  return (
    <ul className="space-y-2">
      {visible.map(({ label, description, href, icon: Icon }) => (
        <li key={href}>
          <Link
            to={href}
            className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3 transition-colors hover:border-primary/30 hover:bg-neutral-50"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-neutral-900">
                {label}
              </span>

              <span className="block truncate text-xs text-neutral-500">
                {description}
              </span>
            </span>

            <ChevronRight
              className="size-4 shrink-0 text-neutral-300"
              aria-hidden="true"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
