import { ChevronDown, KeyRound, LogOut, Menu, PanelLeftClose, PanelLeftOpen, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { initials, titleCase } from "@/lib/format";
import { useSidebarStore } from "@/layouts/store/useSidebarStore";

interface TopBarProps {
  onSignOut: () => void;
}

export function TopBar({ onSignOut }: TopBarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const collapsed = useSidebarStore((state) => state.collapsed);
  const toggleCollapsed = useSidebarStore((state) => state.toggleCollapsed);
  const openMobile = useSidebarStore((state) => state.openMobile);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-neutral-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={openMobile}
          aria-label="Open navigation"
          className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100 lg:hidden"
        >
          <Menu className="size-5" />
        </button>

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100 lg:block"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-5" />
          ) : (
            <PanelLeftClose className="size-5" />
          )}
        </button>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-neutral-900">
            GLMS Enterprise
          </p>

          <p className="hidden truncate text-xs text-neutral-500 sm:block">
            General Ledger Management System
          </p>
        </div>
      </div>

      <DropdownMenu
        label="Open profile menu"
        trigger={
          <span className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-100">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
              {initials(user?.username)}
            </span>

            <span className="hidden text-left lg:block">
              <span className="block max-w-40 truncate text-sm font-semibold text-neutral-900">
                {user?.username ?? "Signed in"}
              </span>

              <span className="block max-w-40 truncate text-xs text-neutral-500">
                {user?.primaryRole ? titleCase(user.primaryRole) : "—"}
              </span>
            </span>

            <ChevronDown
              className="hidden size-4 text-neutral-500 lg:block"
              aria-hidden="true"
            />
          </span>
        }
      >
        {(close) => (
          <>
            <DropdownMenuLabel>Signed in as</DropdownMenuLabel>

            <div className="space-y-1.5 px-3.5 pb-3">
              <p className="truncate text-sm font-medium text-neutral-900">
                {user?.username ?? "—"}
              </p>

              {user?.email && (
                <p className="truncate text-xs text-neutral-500">
                  {user.email}
                </p>
              )}

              {user?.status && (
                <Badge
                  variant={user.status === "ACTIVE" ? "success" : "warning"}
                >
                  {titleCase(user.status)}
                </Badge>
              )}
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              icon={<UserRound />}
              onClick={() => {
                close();
                navigate("/profile");
              }}
            >
              My profile
            </DropdownMenuItem>

            <DropdownMenuItem
              icon={<KeyRound />}
              onClick={() => {
                close();
                navigate("/change-password");
              }}
            >
              Change password
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              icon={<LogOut />}
              variant="destructive"
              onClick={() => {
                close();
                onSignOut();
              }}
            >
              Logout
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenu>
    </header>
  );
}
