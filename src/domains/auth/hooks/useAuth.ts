import { useShallow } from "zustand/react/shallow";

import { useAuthStore } from "../stores/authStore";

/** Read-and-act access to the current session. */
export const useAuth = () =>
  useAuthStore(
    useShallow((state) => ({
      user: state.user,
      initializing: state.initializing,
      isAuthenticated: state.isAuthenticated,
      login: state.login,
      logout: state.logout,
      initialize: state.initialize,
      refreshProfile: state.refreshProfile,
      clearAuth: state.clearAuth,
    })),
  );
