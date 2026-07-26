import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { useSidebarStore } from "@/layouts/store/useSidebarStore";

export function SidebarToggle() {
  const collapsed = useSidebarStore((state) => state.collapsed);

  const toggleCollapsed = useSidebarStore((state) => state.toggleCollapsed);

  const toggleMobile = useSidebarStore((state) => state.toggleMobile);

  return (
    <>
      {/* Mobile */}

      <button onClick={toggleMobile} className="rounded-lg p-2 lg:hidden">
        <Menu />
      </button>

      {/* Desktop */}

      <button
        onClick={toggleCollapsed}
        className="hidden rounded-lg p-2 hover:bg-neutral-100 lg:block"
      >
        {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
      </button>
    </>
  );
}
