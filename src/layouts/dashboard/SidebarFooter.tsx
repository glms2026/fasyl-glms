import { CircleHelp, LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/Tooltips";
import { useSidebarStore } from "@/layouts/store/useSidebarStore";

export function SidebarFooter() {
  const collapsed = useSidebarStore((state) => state.collapsed);

  const buttonClass = cn(
    "flex h-11 w-full items-center rounded-lg text-sm font-medium text-gray-200 transition-colors hover:bg-blue-100 hover:text-[#001a42]",
    collapsed ? "justify-center px-0" : "gap-3 px-4",
  );

  const supportButton = (
    <button className={buttonClass}>
      <CircleHelp className="h-5 w-5 shrink-0 " />

      {!collapsed && <span>Support</span>}
    </button>
  );

  const logoutButton = (
    <button className={buttonClass}>
      <LogOut className="h-5 w-5 shrink-0 " />

      {!collapsed && <span className="">Sign Out</span>}
    </button>
  );

  return (
    <div className="space-y-2  p-4">
      {collapsed ? (
        <>
          <Tooltip content="Support">{supportButton}</Tooltip>

          <Tooltip content="Sign Out">{logoutButton}</Tooltip>
        </>
      ) : (
        <>
          {supportButton}
          {logoutButton}
        </>
      )}
    </div>
  );
}
