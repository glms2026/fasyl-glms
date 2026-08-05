import { create } from "zustand";

interface SidebarState {
  /** Desktop rail collapsed to icons only. */
  collapsed: boolean;
  /** Mobile drawer visibility. */
  mobileOpen: boolean;

  toggleCollapsed: () => void;
  openMobile: () => void;
  closeMobile: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: false,
  mobileOpen: false,

  toggleCollapsed: () =>
    set((state) => ({ collapsed: !state.collapsed })),

  openMobile: () => set({ mobileOpen: true }),

  closeMobile: () => set({ mobileOpen: false }),
}));
