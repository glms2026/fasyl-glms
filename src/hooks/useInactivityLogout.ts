import { useEffect, useRef } from "react";

import { useAuthStore } from "@/domains/auth/stores/authStore";

/** 7 minutes in milliseconds. */
const TIMEOUT_MS = 7 * 60 * 1000;

/**
 * Watches user activity (mouse, keyboard, click, scroll, touch) and
 * automatically logs out after `TIMEOUT_MS` of inactivity.
 *
 * Mount once near the top of the component tree (e.g. inside App).
 */
export function useInactivityLogout() {
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const resetTimer = () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void logout();
      }, TIMEOUT_MS);
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ];

    // Kick off immediately.
    resetTimer();

    for (const event of events) {
      window.addEventListener(event, resetTimer, { passive: true });
    }

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      for (const event of events) {
        window.removeEventListener(event, resetTimer);
      }
    };
  }, [isAuthenticated, logout]);
}
