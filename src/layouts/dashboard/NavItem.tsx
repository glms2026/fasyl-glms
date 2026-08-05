import { NavLink } from "react-router-dom";

import { Tooltip } from "@/components/ui/Tooltips";
import { cn } from "@/lib/utils";

import type { NavigationItem } from "./navigation";

interface NavItemProps {
  item: NavigationItem;
  collapsed: boolean;
  onNavigate?: () => void;
}

export function NavItem({ item, collapsed, onNavigate }: NavItemProps) {
  const Icon = item.icon;

  const link = (
    <NavLink
      to={item.href}
      end={!item.matchNested}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center rounded-xl outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/60",
          collapsed ? "size-11 justify-center" : "h-11 w-full gap-3 px-4",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-white/80 hover:bg-white/10 hover:text-white",
        )
      }
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />

      {!collapsed && (
        <span className="truncate text-sm font-medium">{item.title}</span>
      )}
    </NavLink>
  );

  return collapsed ? <Tooltip content={item.title}>{link}</Tooltip> : link;
}
