import { cn } from "@/lib/utils";

import { SidebarFooter } from "./SidebarFooter";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarNavigation } from "./SidebarNavigation";

import { useSidebarStore } from "@/layouts/store/useSidebarStore";

import type { SidebarProps } from "./layout.types";

export function Sidebar({
  organization,
  subtitle,
  actionLabel,
  navigation,
}: SidebarProps) {
  const collapsed = useSidebarStore((state) => state.collapsed);

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-neutral-200 bg-[#001a42] transition-[width] duration-300 ease-in-out lg:flex",
        collapsed ? "w-20" : "w-72",
      )}
    >
      <SidebarHeader
        organization={organization}
        subtitle={subtitle}
        actionLabel={actionLabel}
      />

      <SidebarNavigation navigation={navigation} />

      <SidebarFooter />
    </aside>
  );
}
