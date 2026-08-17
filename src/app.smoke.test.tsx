import { AxiosError, type AxiosResponse } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

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

function mockAuditPage() {
  const actions = ["USER_CREATE", "ASSIGN_ROLE", "LOGIN", "USER_LOCK"];
  const content = Array.from({ length: 8 }).map((_, index) => ({
    id: index + 1,
    username: index % 2 === 0 ? "aokonkwo" : "jdoe",
    action: actions[index % actions.length],
    description: `Sample audit description ${index + 1}`,
    createdAt: new Date(Date.now() - index * 3_600_000).toISOString(),
  }));

  return {
    content,
    page: {
      size: 25,
      number: 0,
      totalElements: content.length,
      totalPages: 1,
    },
  };
}

// The backend answers approval-request lists with a PagedModel envelope —
// `{ content, page: { size, number, totalElements, totalPages } }` — not the
// flat Spring Page used elsewhere, so the mocks mirror the real shape.
const emptyApprovalsPage = {
  content: [],
  page: { size: 1, number: 0, totalElements: 0, totalPages: 0 },
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
        return Promise.resolve({ data: emptyApprovalsPage });
      }

      if (url.includes("/roles")) {
        return Promise.resolve({ data: mockRoles });
      }

      if (url.includes("/users")) {
        return Promise.resolve({ data: mockUsersPage() });
      }

      if (url.includes("/admin/audit-logs")) {
        return Promise.resolve({ data: mockAuditPage() });
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
      "Audit Logs",
      "Settings",
    ]);
  });

  it("shows the queued-approvals count on the sidebar for an ADMIN", async () => {
    localStorage.setItem("glms.accessToken", "fake-token");
    window.history.pushState({}, "", "/dashboard");

    const mockedGet = vi.mocked(apiClient.get);
    const original = mockedGet.getMockImplementation();

    try {
      mockedGet.mockImplementation((url: string) => {
        if (url.includes("/auth/profile")) {
          return Promise.resolve({ data: mockProfile });
        }

        // PagedModel envelope, matching the real backend: 3 queued requests.
        if (url.includes("/user-approval-requests/pending")) {
          return Promise.resolve({
            data: {
              content: [
                {
                  id: 1,
                  userId: 2,
                  username: "jdoe",
                  makerId: 1,
                  makerUsername: "aokonkwo",
                  action: "USER_LOCK",
                  status: "PENDING",
                  roleNames: [],
                  permissions: [],
                  reason: "Investigation",
                  remark: null,
                  createdAt: "2026-08-17T00:00:00Z",
                },
              ],
              page: { size: 1, number: 0, totalElements: 3, totalPages: 3 },
            },
          });
        }

        if (url.includes("/roles")) {
          return Promise.resolve({ data: mockRoles });
        }

        if (url.includes("/users")) {
          return Promise.resolve({ data: mockUsersPage() });
        }

        if (url.includes("/admin/audit-logs")) {
          return Promise.resolve({ data: mockAuditPage() });
        }

        return Promise.resolve({ data: mockProfile });
      });

      render(<App />);

      const sidebar = await screen.findByRole("navigation", { name: /main/i });

      // The Approvals item renders the queued count as a badge pill.
      await waitFor(() => {
        const approvalsLink = Array.from(sidebar.querySelectorAll("a")).find(
          (link) => link.textContent?.includes("Approvals"),
        );

        expect(approvalsLink?.textContent).toContain("3");
      });
    } finally {
      if (original) {
        mockedGet.mockImplementation(original);
      }
    }
  });

  it("renders the settings page with the change-password form", async () => {
    localStorage.setItem("glms.accessToken", "fake-token");
    window.history.pushState({}, "", "/settings");

    render(<App />);

    await waitFor(
      () =>
        expect(screen.getByRole("heading", { name: /settings/i })).toBeDefined(),
      { timeout: 5000 },
    );

    // The signed-in account summary (mock profile) renders — the username
    // also appears in the top bar, so allow both occurrences.
    await waitFor(
      () =>
        expect(screen.getAllByText("aokonkwo").length).toBeGreaterThan(0),
      { timeout: 5000 },
    );

    // …and the change-password form is present and interactive.
    expect(screen.getByLabelText("Current password")).toBeDefined();
    expect(screen.getByLabelText("New password")).toBeDefined();
    expect(screen.getByLabelText("Confirm new password")).toBeDefined();
    expect(
      screen.getByRole("button", { name: /update password/i }),
    ).toBeDefined();
  });

  it("renders the audit trail for an administrator", async () => {
    localStorage.setItem("glms.accessToken", "fake-token");
    window.history.pushState({}, "", "/audit-logs");

    render(<App />);

    await waitFor(
      () =>
        expect(
          screen.getByRole("heading", { name: /audit log/i }),
        ).toBeDefined(),
      { timeout: 5000 },
    );

    // The trail renders as a table — one body row per audit event, each
    // showing the action name, actor and a timestamp.
    await waitFor(
      () => expect(document.querySelectorAll("tbody tr").length).toBe(8),
      { timeout: 5000 },
    );

    const body = document.querySelector("tbody");
    expect(body).not.toBeNull();
    expect(body?.textContent).toMatch(/User Create/);
    expect(body?.textContent).toMatch(/aokonkwo/);
    expect(body?.textContent).toMatch(/Sample audit description 1/);
  });

  it("keeps the audit trail out of reach for non-admin roles", async () => {
    localStorage.setItem("glms.accessToken", "fake-token");
    window.history.pushState({}, "", "/audit-logs");

    const mockedGet = vi.mocked(apiClient.get);
    const original = mockedGet.getMockImplementation();

    try {
      mockedGet.mockImplementation((url: string) => {
        if (url.includes("/auth/profile")) {
          return Promise.resolve({
            data: { ...mockProfile, roles: ["AUTHORIZER"] },
          });
        }

        if (url.includes("/user-approval-requests/pending")) {
          return Promise.resolve({ data: emptyApprovalsPage });
        }

        if (url.includes("/roles")) {
          return Promise.resolve({ data: mockRoles });
        }

        return Promise.resolve({ data: mockProfile });
      });

      render(<App />);

      // The admin-only guard bounces the visitor back to the dashboard.
      await waitFor(
        () => expect(window.location.pathname).toBe("/dashboard"),
        { timeout: 5000 },
      );

      // And the sidebar never advertises the entry.
      const sidebar = await waitFor(
        () => screen.getByRole("navigation", { name: /main/i }),
        { timeout: 5000 },
      );
      const labels = Array.from(sidebar.querySelectorAll("a")).map(
        (link) => link.textContent,
      );

      expect(labels).not.toContain("Audit Logs");
    } finally {
      if (original) {
        mockedGet.mockImplementation(original);
      }
    }
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
        }        if (url.includes("/user-approval-requests/pending")) {
          return Promise.resolve({ data: emptyApprovalsPage });
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

  /** Signs a session in, seeds one saved credential for user #2, and opens
   *  that user's row menu. Returns whether the copy item rendered. (The
   *  signed-in profile is id 1, so boot never consumes the id-2 entry.) */
  async function rowMenuHasCopyAction(roles: string[]): Promise<boolean> {
    localStorage.setItem("glms.accessToken", "fake-token");
    localStorage.setItem(
      "glms:created-credentials:v1",
      JSON.stringify({
        2: {
          username: "user2",
          password: "Temp@1234",
          createdAt: "2026-08-16T00:00:00.000Z",
        },
      }),
    );
    window.history.pushState({}, "", "/users/list");

    const mockedGet = vi.mocked(apiClient.get);
    const original = mockedGet.getMockImplementation();

    try {
      mockedGet.mockImplementation((url: string) => {
        if (url.includes("/auth/profile")) {
          return Promise.resolve({
            data: { ...mockProfile, roles },
          });
        }        if (url.includes("/user-approval-requests/pending")) {
          return Promise.resolve({ data: emptyApprovalsPage });
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
        () =>
          expect(document.querySelectorAll("tbody tr").length).toBe(10),
        { timeout: 5000 },
      );

      fireEvent.click(
        screen.getByRole("button", { name: "Actions for First2 Last2" }),
      );

      await waitFor(
        () => expect(screen.getByRole("menu")).toBeDefined(),
        { timeout: 5000 },
      );

      return (
        screen.queryByRole("menuitem", {
          name: /copy login credentials/i,
        }) !== null
      );
    } finally {
      if (original) {
        mockedGet.mockImplementation(original);
      }
    }
  }

  it("lets a CONTROL user copy a newly created user's login credentials", async () => {
    await expect(rowMenuHasCopyAction(["CONTROL"])).resolves.toBe(true);
  });

  it("hides the copy-credentials action for non-CONTROL roles", async () => {
    await expect(rowMenuHasCopyAction(["AUTHORIZER"])).resolves.toBe(false);
  });

  it("wipes saved credentials once the account signs in on this device", async () => {
    localStorage.setItem("glms.accessToken", "fake-token");
    localStorage.setItem(
      "glms:created-credentials:v1",
      JSON.stringify({
        1: {
          username: "user1",
          password: "Temp@1234",
          createdAt: "2026-08-16T00:00:00.000Z",
        },
      }),
    );

    // Simulate the stored-session boot: initialize() fetches the profile
    // (mock user id 1) and should consume the credentials saved for id 1.
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      initializing: true,
    });

    await useAuthStore.getState().initialize();

    expect(localStorage.getItem("glms:created-credentials:v1")).toBeNull();
  });
});
