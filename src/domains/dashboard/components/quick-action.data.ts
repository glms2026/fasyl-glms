import { FilePlus2, Landmark, FileSpreadsheet, Users } from "lucide-react";

import type { LucideIcon } from "lucide-react";

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
}

export const quickActions: QuickAction[] = [
  {
    id: "gl",
    title: "New GL",
    description: "Create a GL",
    icon: FilePlus2,
    href: "/create-gl",
  },

  {
    id: "report",
    title: "Reports",
    description: "Generate reports",
    icon: FileSpreadsheet,
    href: "/reports",
  },
  {
    id: "users",
    title: "Users",
    description: "Manage users",
    icon: Users,
    href: "/users",
  },
];
