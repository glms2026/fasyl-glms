import { Bell, ChevronDown, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";
import { topNavigation } from "./topNavigate";
import { SidebarToggle } from "./SidebarToggle";

export function TopNavbar() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-8">
      {/* Left Section */}
      <div className="flex items-center gap-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <SidebarToggle />

          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              GLMS Enterprise
            </h1>

            <p className="text-xs text-neutral-500">
              General Ledger Management System
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex h-16 items-center">
          {topNavigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "relative flex h-full items-center px-5 text-sm font-medium transition-colors",
                  isActive
                    ? "text-[#001A42]"
                    : "text-neutral-500 hover:text-black",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.title}

                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[3px] rounded-full bg-[#001A42]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-neutral-100">
          <Bell size={20} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* Settings */}
        <button className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-neutral-100">
          <Settings size={20} />
        </button>

        {/* Divider */}
        <div className="mx-1 h-8 w-px bg-neutral-200" />

        {/* User */}
        <button className="flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-neutral-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#001A42] font-semibold text-white">
            FO
          </div>

          <div className="hidden text-left lg:block">
            <p className="text-sm font-semibold text-neutral-900">
              Femi Olaleye
            </p>

            <p className="text-xs text-neutral-500">System Administrator</p>
          </div>

          <ChevronDown size={18} className="hidden text-neutral-500 lg:block" />
        </button>
      </div>
    </header>
  );
}
