import { CircleHelp, LogOut } from "lucide-react";

import { Tooltip } from "@/components/ui/Tooltips";
import { config } from "@/lib/config";
import { cn } from "@/lib/utils";
import logo from "@/domains/dashboard/assests/FasylLogo.svg";

import { NavItem } from "./NavItem";
import { primaryNavigation } from "./navigation";

interface SidebarPanelProps {
  collapsed: boolean;
  onSignOut: () => void;
  /** Closes the drawer after tapping an item on mobile. */
  onNavigate?: () => void;
}

/**
 * Sidebar contents, shared by the fixed desktop rail and the mobile drawer,
 * so the two can never drift apart.
 */
export function SidebarPanel({
  collapsed,
  onSignOut,
  onNavigate,
}: SidebarPanelProps) {
  const actionClass = cn(
    "flex h-11 items-center rounded-xl text-sm font-medium text-white/80 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60",
    collapsed ? "size-11 justify-center" : "w-full gap-3 px-4",
  );

  const signOutButton = (
    <button type="button" onClick={onSignOut} className={actionClass}>
      <LogOut className="size-5 shrink-0" aria-hidden="true" />
      {!collapsed && <span>Logout</span>}
    </button>
  );

  const supportButton = (
    <a
      href="mailto:support@fasyl.com"
      className={actionClass}
      onClick={onNavigate}
    >
      <CircleHelp className="size-5 shrink-0" aria-hidden="true" />
      {!collapsed && <span>Support</span>}
    </a>
  );

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className={cn("px-6 py-6", collapsed && "px-4")}>
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt=""
            aria-hidden="true"
            className="size-10 shrink-0"
          />

          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-xl font-bold text-white">
                {config.appName}
              </p>

              <p className="truncate text-xs text-white/60">
                {config.appSubtitle}
              </p>
            </div>
          )}
        </div>
      </div>

      <nav
        aria-label="Main"
        className={cn(
          "flex flex-1 flex-col gap-1.5 py-4",
          collapsed ? "items-center px-2" : "px-4",
        )}
      >
        {primaryNavigation.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div
        className={cn(
          "flex flex-col gap-1.5 border-t border-white/10 py-4",
          collapsed ? "items-center px-2" : "px-4",
        )}
      >
        {collapsed ? (
          <>
            <Tooltip content="Support">{supportButton}</Tooltip>
            <Tooltip content="Logout">{signOutButton}</Tooltip>
          </>
        ) : (
          <>
            {supportButton}
            {signOutButton}
          </>
        )}
      </div>
    </div>
  );
}
