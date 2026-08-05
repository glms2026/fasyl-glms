import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

// Stub the network layer: the smoke test proves the app mounts and routes,
// not that the backend is reachable.
vi.mock("@/lib/apiClient", () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        id: 1,
        username: "aokonkwo",
        email: "a@fasyl.com",
        status: "ACTIVE",
        roles: ["ADMIN"],
      },
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

// Auto-cleanup is off (globals: false), so unmount between cases.
afterEach(cleanup);

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.history.pushState({}, "", "/login");
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

    expect(links).toEqual(["Dashboard", "Create GL", "User Management"]);
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
