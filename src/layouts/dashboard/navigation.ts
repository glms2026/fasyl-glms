import {
  ClipboardCheck,
  LayoutDashboard,
  Plus,
  ScrollText,
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
  },
  {
    title: "User Management",
    href: "/users",
    icon: UserCog,
    matchNested: true,
  },
  {
    title: "Approvals",
    href: "/approvals",
    icon: ClipboardCheck,
  },
  {
    title: "Roles & Permissions",
    href: "/roles-permissions",
    icon: ShieldCheck,
  },
  {
    title: "Audit Logs",
    href: "/audit-logs",
    icon: ScrollText,
    adminOnly: true,
  },
];
