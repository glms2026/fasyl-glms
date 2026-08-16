import { AxiosError } from "axios";
import { create } from "zustand";

import { setUnauthorizedHandler } from "@/lib/apiClient";
import { tokenStorage } from "@/lib/token";

import { consumeCreatedCredentials } from "@/domains/users/data/createdCredentials";

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

function toAuthUser(
  profile: ProfileResponse,
  fallbackRole?: string,
  mustChangePassword = false,
): AuthUser {
  return {
    ...profile,
    mustChangePassword,
    primaryRole: profile.roles?.[0] ?? fallbackRole ?? "USER",
  };
}

/**
 * The PasswordChangeFilter answers 403 "Password change required" for
 * everything except change-password / logout / refresh-token while the
 * account owes a first-login change. The profile endpoint is blocked too,
 * so a 403 there with a stored session means the flag is still set.
 */
function isPasswordChangeRequired(error: unknown): boolean {
  if (!(error instanceof AxiosError)) return false;
  if (error.response?.status !== 403) return false;

  const data = error.response.data;
  const message =
    typeof data === "string" ? data : (data as { message?: string } | null)?.message;

  return typeof message === "string" && /password change required/i.test(message);
}

/**
 * A successful sign-in on this device means the account's temporary
 * password — if it was created here and saved for the "Copy credentials"
 * action — is spent: the backend forces the change on first login. Wipe
 * the plaintext so the action disappears even for CONTROL users.
 */
function expireTemporaryCredentials(userId: number): void {
  if (userId > 0) consumeCreatedCredentials(userId);
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

      expireTemporaryCredentials(profile.id);

      set({
        user: toAuthUser(profile),
        isAuthenticated: true,
        initializing: false,
      });
    } catch (caught) {
      // Still owes the mandatory change: keep the session and let the
      // route guard send the user straight to the change screen.
      if (isPasswordChangeRequired(caught)) {
        set({
          user: {
            id: 0,
            username: tokenStorage.getUsername() ?? "",
            email: "",
            status: "ACTIVE",
            roles: [],
            mustChangePassword: true,
            primaryRole: "USER",
          },
          isAuthenticated: true,
          initializing: false,
        });
        return;
      }

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
      username: result.username,
    });

    // The profile endpoint is itself blocked by the PasswordChangeFilter
    // while the flag is set, so the flag comes from the login response and
    // survives even when the profile fetch 403s.
    const mustChangePassword = result.passwordChangeRequired === true;

    let user: AuthUser;

    try {
      user = toAuthUser(
        await authService.getProfile(),
        result.role,
        mustChangePassword,
      );
    } catch {
      user = {
        id: 0,
        username: result.username,
        email: "",
        status: "ACTIVE",
        roles: result.role ? [result.role] : [],
        mustChangePassword,
        primaryRole: result.role ?? "USER",
      };
    }

    expireTemporaryCredentials(user.id);

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

    expireTemporaryCredentials(profile.id);

    set((state) => ({
      user: toAuthUser(
        profile,
        state.user?.primaryRole,
        state.user?.mustChangePassword ?? false,
      ),
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
