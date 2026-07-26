// src/store/useSidebarStore.ts

import { create } from "zustand";

interface SidebarState {
  collapsed: boolean;
  mobileOpen: boolean;

  toggleCollapsed: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: false,

  mobileOpen: false,

  toggleCollapsed: () =>
    set((state) => ({
      collapsed: !state.collapsed,
    })),

  toggleMobile: () =>
    set((state) => ({
      mobileOpen: !state.mobileOpen,
    })),

  closeMobile: () =>
    set({
      mobileOpen: false,
    }),
}));
