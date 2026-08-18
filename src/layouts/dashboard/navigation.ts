import {
  ClipboardCheck,
  LayoutDashboard,
  Plus,
  ScrollText,
  Settings,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavigationItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Keeps the item active on nested routes such as /users/new. */
  matchNested?: boolean;
  /** Hidden from every role but ADMIN (backend: /api/admin/*). */
  adminOnly?: boolean;
  /** If set, only these roles see the item. Undefined means everyone. */
  allowedRoles?: readonly string[];
}

/**
 * Sidebar destinations. Every entry here must resolve to a mounted route —
 * screens without a backing route were removed rather than left dangling.
 * Sign out lives in the sidebar footer since it's an action, not a page.
 */
export const primaryNavigation: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Create GL",
    href: "/create-gl",
    icon: Plus,
    allowedRoles: ["ADMIN", "CREATOR"],
  },
  {
    title: "User Management",
    href: "/users",
    icon: UserCog,
    matchNested: true,
    allowedRoles: ["ADMIN", "CONTROL", "AUTHORIZER"],
  },
  {
    title: "Approvals",
    href: "/approvals",
    icon: ClipboardCheck,
    allowedRoles: ["ADMIN", "AUTHORIZER"],
  },
  {
    title: "Roles & Permissions",
    href: "/roles-permissions",
    icon: ShieldCheck,
    allowedRoles: ["ADMIN", "CONTROL"],
  },
  {
    title: "Audit Logs",
    href: "/audit-logs",
    icon: ScrollText,
    adminOnly: true,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];
