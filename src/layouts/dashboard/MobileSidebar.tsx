import { X } from "lucide-react";

import { Sidebar } from "./Sidebar";

import { useSidebarStore } from "@/layouts/store/useSidebarStore";

import { ledgerNavigation } from "./navigation";

export function MobileSidebar() {
  const mobileOpen = useSidebarStore((state) => state.mobileOpen);

  const closeMobile = useSidebarStore((state) => state.closeMobile);

  if (!mobileOpen) return null;

  return (
    <>
      <div
        onClick={closeMobile}
        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
      />

      <div className="fixed left-0 top-0 z-50 h-screen w-72 bg-white lg:hidden">
        <button onClick={closeMobile} className="absolute right-4 top-4">
          <X />
        </button>

        <Sidebar
          organization="Finance Ops"
          subtitle="Institutional Division"
          actionLabel="New Entry"
          navigation={ledgerNavigation}
        />
      </div>
    </>
  );
}
