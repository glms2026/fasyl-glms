import { seedActivity, seedUsers } from "../data/users.mock";
import type {
  CreateUserRequest,
  LockUserRequest,
  ManagedUser,
  SuspendUserRequest,
  UpdateUserRequest,
  UserAnalytics,
  UserMetrics,
  UserRole,
  UserStatus,
} from "../types";

/**
 * ===========================================================================
 * STUB SERVICE — NOT WIRED TO THE BACKEND
 * ===========================================================================
 * The Swagger contract currently covers `/api/auth` only. Every method below
 * mimics the shape and latency of a real endpoint against an in-memory store
 * so the UI has genuine loading, error and empty states to exercise.
 *
 * To integrate for real, replace each body with an `apiClient` call. The
 * signatures, request models and return types are already what the screens
 * consume, so nothing outside this file needs to change:
 *
 *   async list(): Promise<ManagedUser[]> {
 *     const response = await apiClient.get<ManagedUser[]>("/users");
 *     return response.data;
 *   }
 * ===========================================================================
 */

const LATENCY_MS = 420;

/** Mutable copy so create/edit/lock actions persist for the session. */
let users: ManagedUser[] = seedUsers.map((user) => ({ ...user }));

let nextId = Math.max(...users.map((user) => user.id)) + 1;

function delay<T>(value: T, ms = LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function clone(user: ManagedUser): ManagedUser {
  return { ...user, permissions: [...user.permissions] };
}

function findOrThrow(id: number): ManagedUser {
  const user = users.find((candidate) => candidate.id === id);

  if (!user) {
    throw new Error("That user no longer exists.");
  }

  return user;
}

function monthLabel(offset: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - offset);

  return date.toLocaleDateString("en-US", { month: "short" });
}

function dayLabel(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() - offset);

  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export const userService = {
  async list(): Promise<ManagedUser[]> {
    return delay(users.map(clone));
  },

  async getById(id: number): Promise<ManagedUser> {
    await delay(null, 260);

    return clone(findOrThrow(id));
  },

  async create(payload: CreateUserRequest): Promise<ManagedUser> {
    await delay(null);

    const duplicate = users.some(
      (user) =>
        user.username.toLowerCase() === payload.username.toLowerCase() ||
        user.email.toLowerCase() === payload.email.toLowerCase(),
    );

    if (duplicate) {
      throw new Error("That username or email is already in use.");
    }

    const created: ManagedUser = {
      id: nextId++,
      fullName: payload.fullName,
      username: payload.username,
      email: payload.email,
      role: payload.role,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      permissions: [...payload.permissions],
      lockedUntil: null,
      suspensionReason: null,
    };

    users = [created, ...users];

    return clone(created);
  },

  async update(payload: UpdateUserRequest): Promise<ManagedUser> {
    await delay(null);

    const user = findOrThrow(payload.id);

    Object.assign(user, {
      fullName: payload.fullName,
      username: payload.username,
      email: payload.email,
      role: payload.role,
      status: payload.status,
      permissions: [...payload.permissions],
    });

    return clone(user);
  },

  async lock({ id, durationMinutes }: LockUserRequest): Promise<ManagedUser> {
    await delay(null);

    const user = findOrThrow(id);
    const until = new Date(Date.now() + durationMinutes * 60_000);

    user.status = "LOCKED";
    user.lockedUntil = until.toISOString();

    return clone(user);
  },

  async suspend({ id, reason }: SuspendUserRequest): Promise<ManagedUser> {
    await delay(null);

    const user = findOrThrow(id);

    user.status = "SUSPENDED";
    user.suspensionReason = reason?.trim() || null;
    user.lockedUntil = null;

    return clone(user);
  },

  async activate(id: number): Promise<ManagedUser> {
    await delay(null);

    const user = findOrThrow(id);

    user.status = "ACTIVE";
    user.lockedUntil = null;
    user.suspensionReason = null;

    return clone(user);
  },

  /** Triggers a reset email. No endpoint yet — resolves with a message. */
  async resetPassword(id: number): Promise<string> {
    await delay(null);

    const user = findOrThrow(id);

    return `A password reset link has been sent to ${user.email}.`;
  },

  async getMetrics(): Promise<UserMetrics> {
    await delay(null, 320);

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const countByStatus = (status: UserStatus) =>
      users.filter((user) => user.status === status).length;

    const newThisMonth = users.filter(
      (user) => new Date(user.createdAt).getTime() >= thirtyDaysAgo,
    ).length;

    const previousTotal = users.length - newThisMonth;

    return {
      total: users.length,
      active: countByStatus("ACTIVE"),
      suspended: countByStatus("SUSPENDED"),
      locked: countByStatus("LOCKED"),
      newThisMonth,
      administrators: users.filter((user) => user.role === "ADMIN").length,
      totalChange:
        previousTotal === 0
          ? 0
          : Math.round((newThisMonth / previousTotal) * 1000) / 10,
    };
  },

  async getAnalytics(): Promise<UserAnalytics> {
    await delay(null, 380);

    const roles: UserRole[] = ["ADMIN", "MAKER", "CHECKER", "AUDITOR", "VIEWER"];
    const statuses: UserStatus[] = [
      "ACTIVE",
      "SUSPENDED",
      "LOCKED",
      "INACTIVE",
      "PENDING",
    ];

    // Growth is reconstructed from creation dates so the chart always agrees
    // with the directory it sits above.
    const growth = Array.from({ length: 6 }).map((_, index) => {
      const offset = 5 - index;

      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - offset);
      cutoff.setDate(new Date(cutoff.getFullYear(), cutoff.getMonth() + 1, 0).getDate());

      const windowStart = new Date();
      windowStart.setMonth(windowStart.getMonth() - offset);
      windowStart.setDate(1);

      const total = users.filter(
        (user) => new Date(user.createdAt) <= cutoff,
      ).length;

      const added = users.filter((user) => {
        const created = new Date(user.createdAt);
        return created >= windowStart && created <= cutoff;
      }).length;

      return { month: monthLabel(offset), total, added };
    });

    const loginTrend = Array.from({ length: 7 }).map((_, index) => {
      const offset = 6 - index;
      const base = 18 + ((offset * 7) % 11);

      return {
        day: dayLabel(offset),
        logins: base + users.length,
        failed: Math.max(1, (offset * 3) % 5),
      };
    });

    return {
      growth,
      loginTrend,
      roleDistribution: roles
        .map((role) => ({
          label: role,
          value: users.filter((user) => user.role === role).length,
        }))
        .filter((slice) => slice.value > 0),
      statusDistribution: statuses
        .map((status) => ({
          label: status,
          value: users.filter((user) => user.status === status).length,
        }))
        .filter((slice) => slice.value > 0),
      recentActivity: seedActivity,
    };
  },
};
