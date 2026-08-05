import { create } from "zustand";

import { setUnauthorizedHandler } from "@/lib/apiClient";
import { tokenStorage } from "@/lib/token";

import { authService } from "../services/authService";
import type {
  AuthUser,
  LoginRequest,
  ProfileResponse,
} from "../types/auth";

interface AuthState {
  user: AuthUser | null;
  /** True until the stored session has been checked on boot. */
  initializing: boolean;
  isAuthenticated: boolean;

  initialize: () => Promise<void>;
  login: (payload: LoginRequest, remember: boolean) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearAuth: () => void;
}

function toAuthUser(profile: ProfileResponse, fallbackRole?: string): AuthUser {
  return {
    ...profile,
    primaryRole: profile.roles?.[0] ?? fallbackRole ?? "USER",
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  initializing: true,
  isAuthenticated: false,

  /**
   * Runs once at boot. A stored token is only trusted if the profile
   * endpoint accepts it — there is no refresh endpoint to fall back on.
   */
  initialize: async () => {
    if (!tokenStorage.hasSession()) {
      set({ user: null, isAuthenticated: false, initializing: false });
      return;
    }

    try {
      const profile = await authService.getProfile();

      set({
        user: toAuthUser(profile),
        isAuthenticated: true,
        initializing: false,
      });
    } catch {
      tokenStorage.clear();

      set({ user: null, isAuthenticated: false, initializing: false });
    }
  },

  login: async (payload, remember) => {
    const result = await authService.login(payload);

    tokenStorage.setSession({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      remember,
    });

    // Login returns only username and role, so the full profile is fetched
    // straight away. A failure here shouldn't undo a valid sign-in.
    let user: AuthUser;

    try {
      user = toAuthUser(await authService.getProfile(), result.role);
    } catch {
      user = {
        id: 0,
        username: result.username,
        email: "",
        status: "ACTIVE",
        roles: result.role ? [result.role] : [],
        primaryRole: result.role ?? "USER",
      };
    }

    set({ user, isAuthenticated: true, initializing: false });

    return user;
  },

  /** Always clears local state, even if the server call fails. */
  logout: async () => {
    try {
      if (tokenStorage.hasSession()) {
        await authService.logout();
      }
    } catch {
      // The session is ending regardless of what the server says.
    } finally {
      get().clearAuth();
    }
  },

  refreshProfile: async () => {
    if (!tokenStorage.hasSession()) return;

    const profile = await authService.getProfile();

    set((state) => ({
      user: toAuthUser(profile, state.user?.primaryRole),
      isAuthenticated: true,
    }));
  },

  clearAuth: () => {
    tokenStorage.clear();

    set({ user: null, isAuthenticated: false, initializing: false });
  },
}));

// Lets the axios interceptor drop auth state when a request 401s mid-session.
setUnauthorizedHandler(() => {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    initializing: false,
  });
});
