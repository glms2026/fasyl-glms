import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/Tooltips";
import { useSidebarStore } from "@/layouts/store/useSidebarStore";

import type { NavigationItem } from "./layout.types";

interface NavItemProps {
  item: NavigationItem;
}

export function NavItem({ item }: NavItemProps) {
  const collapsed = useSidebarStore((state) => state.collapsed);

  const Icon = item.icon;

  const link = (
    <NavLink
      to={item.href}
      end
      className={({ isActive }) =>
        cn(
          "flex items-center rounded-xl transition-all duration-200",
          collapsed ? "mx-auto h-11 w-11 justify-center" : "h-11 gap-3 px-4",
          isActive
            ? "bg-blue-100 text-[#001A42]"
            : "text-white hover:bg-blue-100 hover:text-[#001A42]",
        )
      }
    >
      <Icon className="h-5 w-5 shrink-0 text-current" />

      {!collapsed && (
        <span className="text-sm font-medium text-current">{item.title}</span>
      )}
    </NavLink>
  );

  return collapsed ? <Tooltip content={item.title}>{link}</Tooltip> : link;
}
