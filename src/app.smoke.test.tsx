import { AxiosError, type AxiosResponse } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

// Stub the network layer: the smoke test proves the app mounts and routes,
// not that the backend is reachable. The mock returns backend-shaped
// responses keyed by URL so every screen gets data it can render.
const mockProfile = {
  id: 1,
  username: "aokonkwo",
  email: "a@fasyl.com",
  status: "ACTIVE",
  roles: ["ADMIN"],
};

function mockUsersPage() {
  const content = Array.from({ length: 10 }).map((_, index) => ({
    id: index + 1,
    firstName: `First${index + 1}`,
    lastName: `Last${index + 1}`,
    username: `user${index + 1}`,
    email: `user${index + 1}@fasyl.com`,
    status: "ACTIVE",
    roles: ["ADMIN"],
    active: true,
    failedLoginAttempts: 0,
    lockoutTime: null,
    suspendedAt: null,
    suspendedBy: null,
    lockedAt: null,
    lockedBy: null,
    lockReason: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }));

  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    size: content.length,
    number: 0,
    numberOfElements: content.length,
    first: true,
    last: true,
    empty: false,
  };
}

const emptyPage = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: 1,
  number: 0,
  numberOfElements: 0,
  first: true,
  last: true,
  empty: true,
};

// GET /api/roles — the role catalogue (id, name, permission names).
const mockRoles = [
  { id: 1, name: "ADMIN", permissions: ["USER_CREATE"] },
  { id: 2, name: "CONTROL", permissions: ["USER_CREATE", "USER_LOCK"] },
  { id: 3, name: "AUTHORIZER", permissions: ["USER_ACTIVATE"] },
  { id: 4, name: "CREATOR", permissions: ["LEDGER_CREATE"] },
];

vi.mock("@/lib/apiClient", () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url.includes("/user-approval-requests/pending")) {
        return Promise.resolve({ data: emptyPage });
      }

      if (url.includes("/roles")) {
        return Promise.resolve({ data: mockRoles });
      }

      if (url.includes("/users")) {
        return Promise.resolve({ data: mockUsersPage() });
      }

      return Promise.resolve({ data: mockProfile });
    }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  setUnauthorizedHandler: vi.fn(),
}));

import App from "@/App";
import apiClient from "@/lib/apiClient";
import { useAuthStore } from "@/domains/auth/stores/authStore";

// Auto-cleanup is off (globals: false), so unmount between cases.
afterEach(cleanup);

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.history.pushState({}, "", "/login");

  // The zustand store is module-level and outlives renders. Without this, a
  // session (e.g. a mustChangePassword flag) left by one test bleeds into the
  // next and its route guard redirects the wrong way.
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    initializing: true,
  });
});

describe("app smoke", () => {
  it("renders the sign-in screen for an anonymous visitor", async () => {
    render(<App />);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /sign in/i }),
      ).toBeDefined(),
    );

    expect(screen.getByLabelText(/username/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeDefined();
  });

  it("redirects an anonymous visitor away from a protected route", async () => {
    window.history.pushState({}, "", "/users/list");

    render(<App />);

    await waitFor(() => expect(window.location.pathname).toBe("/login"));
  });

  it("renders the dashboard shell when a session exists", async () => {
    localStorage.setItem("glms.accessToken", "fake-token");
    window.history.pushState({}, "", "/dashboard");

    render(<App />);

    await waitFor(
      () =>
        expect(
          screen.getByRole("navigation", { name: /main/i }),
        ).toBeDefined(),
      { timeout: 5000 },
    );

    // Scoped to the sidebar: "Create GL" also appears as a page action.
    const sidebar = screen.getByRole("navigation", { name: /main/i });
    const links = Array.from(sidebar.querySelectorAll("a")).map(
      (link) => link.textContent,
    );

    expect(links).toEqual([
      "Dashboard",
      "Create GL",
      "User Management",
      "Approvals",
      "Roles & Permissions",
    ]);
  });

  it("locks a first-login user to the mandatory password change screen", async () => {
    localStorage.setItem("glms.accessToken", "fake-token");
    window.history.pushState({}, "", "/dashboard");

    const mockedGet = vi.mocked(apiClient.get);
    const original = mockedGet.getMockImplementation();

    try {
      // While mustChangePassword is set, the backend's PasswordChangeFilter
      // answers 403 to every endpoint — including /auth/profile.
      mockedGet.mockImplementation((url: string) => {
        if (url.includes("/auth/profile")) {
          return Promise.reject(
            new AxiosError(
              "Password change required",
              "ERR_BAD_REQUEST",
              undefined,
              undefined,
              {
                status: 403,
                data: { message: "Password change required" },
              } as unknown as AxiosResponse,
            ),
          );
        }

        return Promise.resolve({ data: mockProfile });
      });

      render(<App />);

      await waitFor(
        () =>
          expect(
            screen.getByRole("heading", { name: /set a new password/i }),
          ).toBeDefined(),
        { timeout: 5000 },
      );

      // The shell (and everything behind it) is unreachable while the flag is set.
      expect(screen.queryByRole("navigation", { name: /main/i })).toBeNull();
    } finally {
      if (original) {
        mockedGet.mockImplementation(original);
      }
    }
  });

  it("sends an authorizer away from the create-user screen", async () => {
    localStorage.setItem("glms.accessToken", "fake-token");
    window.history.pushState({}, "", "/users/new");

    const mockedGet = vi.mocked(apiClient.get);
    const original = mockedGet.getMockImplementation();

    try {
      // An AUTHORIZER session: can review, but cannot make changes.
      mockedGet.mockImplementation((url: string) => {
        if (url.includes("/auth/profile")) {
          return Promise.resolve({
            data: { ...mockProfile, roles: ["AUTHORIZER"] },
          });
        }

        if (url.includes("/user-approval-requests/pending")) {
          return Promise.resolve({ data: emptyPage });
        }

        if (url.includes("/roles")) {
          return Promise.resolve({ data: mockRoles });
        }

        if (url.includes("/users")) {
          return Promise.resolve({ data: mockUsersPage() });
        }

        return Promise.resolve({ data: mockProfile });
      });

      render(<App />);

      await waitFor(
        () => expect(window.location.pathname).toBe("/users/list"),
        { timeout: 5000 },
      );

      // The create form never renders for a viewer-only role.
      expect(screen.queryByRole("heading", { name: /create user/i })).toBeNull();
    } finally {
      if (original) {
        mockedGet.mockImplementation(original);
      }
    }
  });

  it("lists users with pagination once the directory loads", async () => {
    localStorage.setItem("glms.accessToken", "fake-token");
    window.history.pushState({}, "", "/users/list");

    render(<App />);

    await waitFor(
      () =>
        expect(document.querySelectorAll("tbody tr").length).toBe(10),
      { timeout: 5000 },
    );

    expect(screen.getByRole("searchbox", { name: /search users/i })).toBeDefined();
    expect(screen.getByLabelText(/rows per page/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /next page/i })).toBeDefined();
  });
});
