import {
  LayoutDashboard,
  Landmark,
  Plus,
  ClipboardCheck,
  UserCog,
  Shield,
  Settings,
} from "lucide-react";

import type { NavigationItem } from "./layout.types";

export const ledgerNavigation: NavigationItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Create new GL",
    href: "/create-gl",
    icon: Plus,
  },

  {
    title: "Chart of Accounts",
    href: "/chart-of-accounts",
    icon: Landmark,
  },
  {
    title: "Proposals",
    href: "/proposals",
    icon: ClipboardCheck,
  },
  {
    title: "User Management",
    href: "/user-management",
    icon: UserCog,
  },
  {
    title: "Audit Logs",
    href: "/ledger/audit-logs",
    icon: Shield,
  },
  {
    title: "Settings",
    href: "/ledger/settings",
    icon: Settings,
  },
];
