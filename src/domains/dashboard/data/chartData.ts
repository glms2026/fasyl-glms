/**
 * Derive chart-ready data from live API responses.
 *
 * All functions are pure — they take the raw arrays from
 * `useAllUsersQuery` and `usePendingApprovalsQuery` and return
 * recharts-friendly shapes. No mock data involved.
 */

import type { ManagedUser, UserApprovalRequest } from "@/domains/users/types";

/* ── helpers ──────────────────────────────────────────────────────── */

function monthKey(dateStr: string | null): string {
  if (!dateStr) return "Unknown";
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

function countBy<T>(items: T[], fn: (item: T) => string): Record<string, number> {
  const map: Record<string, number> = {};
  for (const item of items) {
    const key = fn(item);
    map[key] = (map[key] ?? 0) + 1;
  }
  return map;
}

/* ── user charts ──────────────────────────────────────────────────── */

export interface GrowthPoint {
  month: string;
  total: number;
  added: number;
}

/** Cumulative user growth month-by-month, derived from `createdAt`. */
export function deriveUserGrowth(users: ManagedUser[]): GrowthPoint[] {
  const sorted = [...users].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const byMonth = new Map<string, number>();
  for (const u of sorted) {
    const key = monthKey(u.createdAt);
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }

  let cumulative = 0;
  const points: GrowthPoint[] = [];

  for (const [month, added] of byMonth) {
    cumulative += added;
    points.push({ month, total: cumulative, added });
  }

  return points;
}

export interface DistributionSlice {
  label: string;
  value: number;
}

/** User status distribution for a donut chart. */
export function deriveStatusDistribution(users: ManagedUser[]): DistributionSlice[] {
  const counts = countBy(users, (u) => u.status);
  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/** User role distribution for a bar chart (flattens multi-role users). */
export function deriveRoleDistribution(users: ManagedUser[]): DistributionSlice[] {
  const counts: Record<string, number> = {};
  for (const u of users) {
    for (const role of u.roles) {
      counts[role] = (counts[role] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/* ── approval charts ──────────────────────────────────────────────── */

export interface ApprovalTrendPoint {
  month: string;
  pending: number;
  approved: number;
  rejected: number;
}

/** Approval activity month-by-month, grouped by status. */
export function deriveApprovalTrend(
  approvals: UserApprovalRequest[],
): ApprovalTrendPoint[] {
  const byMonth = new Map<string, { pending: number; approved: number; rejected: number }>();

  for (const a of approvals) {
    const key = monthKey(a.createdAt ?? a.requestedAt);
    if (!byMonth.has(key)) {
      byMonth.set(key, { pending: 0, approved: 0, rejected: 0 });
    }
    const bucket = byMonth.get(key)!;
    const status = a.status.toUpperCase();
    if (status === "APPROVED") bucket.approved += 1;
    else if (status === "REJECTED") bucket.rejected += 1;
    else if (status === "PENDING") bucket.pending += 1;
  }

  return Array.from(byMonth.entries()).map(([month, data]) => ({
    month,
    ...data,
  }));
}

/** Approval action type distribution for a pie chart. */
export function deriveApprovalActionDistribution(
  approvals: UserApprovalRequest[],
): DistributionSlice[] {
  const counts = countBy(approvals, (a) => a.action.replace(/_/g, " "));
  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}
