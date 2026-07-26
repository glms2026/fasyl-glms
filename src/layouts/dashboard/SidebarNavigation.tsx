import { NavItem } from "./NavItem";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/layouts/store/useSidebarStore";

import type { NavigationItem } from "./layout.types";

interface SidebarNavigationProps {
  navigation: NavigationItem[];
}

export function SidebarNavigation({ navigation }: SidebarNavigationProps) {
  const collapsed = useSidebarStore((state) => state.collapsed);

  return (
    <nav
      className={cn(
        "flex flex-1 flex-col gap-2 py-6",
        collapsed ? "items-center px-0" : "px-4",
      )}
    >
      {navigation.map((item) => (
        <NavItem key={item.href} item={item} />
      ))}
    </nav>
  );
}
