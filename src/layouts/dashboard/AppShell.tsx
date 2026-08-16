import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { useAccess } from "@/domains/users/hooks/useAccess";
import { usePendingApprovalsCount } from "@/domains/users/hooks/useApprovals";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/layouts/store/useSidebarStore";

import { SidebarPanel } from "./SidebarPanel";
import { TopBar } from "./TopBar";

/**
 * Authenticated chrome: fixed sidebar, top bar and the routed page body.
 * Rendered once as a layout route so navigation never remounts the shell.
 */
export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const collapsed = useSidebarStore((state) => state.collapsed);
  const mobileOpen = useSidebarStore((state) => state.mobileOpen);
  const closeMobile = useSidebarStore((state) => state.closeMobile);

  const access = useAccess();
  const pendingApprovals = usePendingApprovalsCount(access.canReview).count;

  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // The drawer should never survive a route change.
  useEffect(() => {
    closeMobile();
  }, [location.pathname, closeMobile]);

  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobile();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, closeMobile]);

  const handleSignOut = async () => {
    setSigningOut(true);

    try {
      await logout();
      toast.success("You've been signed out.");
      navigate("/login", { replace: true });
    } finally {
      setSigningOut(false);
      setSignOutOpen(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-neutral">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 transition-[width] duration-300 ease-in-out lg:block",
          collapsed ? "w-20" : "w-72",
        )}
      >
        <SidebarPanel
          collapsed={collapsed}
          onSignOut={() => setSignOutOpen(true)}
          pendingApprovals={pendingApprovals}
        />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="lg:hidden">
          <div
            onClick={closeMobile}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-neutral-950/50 animate-in fade-in"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="fixed inset-y-0 left-0 z-50 w-72 shadow-xl animate-in slide-in-from-left"
          >
            <button
              type="button"
              onClick={closeMobile}
              aria-label="Close navigation"
              className="absolute right-3 top-5 z-10 rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" />
            </button>

            <SidebarPanel
              collapsed={false}
              onSignOut={() => {
                closeMobile();
                setSignOutOpen(true);
              }}
              onNavigate={closeMobile}
              pendingApprovals={pendingApprovals}
            />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar onSignOut={() => setSignOutOpen(true)} />

        <main className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
          <div className="mx-auto min-h-full w-full max-w-[100rem] p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      <ConfirmDialog
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        onConfirm={handleSignOut}
        title="Sign out of GLMS?"
        description="You'll need your credentials to sign back in."
        confirmLabel="Logout"
        isPending={signingOut}
        tone="destructive"
      />
    </div>
  );
}
