/**
 * Role-specific mock data for dashboards.
 * Each role has different metrics and data relevant to their responsibilities.
 */

export interface UserMetric {
  label: string;
  value: number | string;
  change?: string;
  trend?: "up" | "down" | "flat";
  caption?: string;
}

export interface RecentActivity {
  id: number;
  action: string;
  user: string;
  target?: string;
  timestamp: string;
  status?: "success" | "pending" | "failed";
}

export interface ApprovalRequest {
  id: number;
  username: string;
  action: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  makerUsername: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD DATA
// ─────────────────────────────────────────────────────────────────────────────

export const adminMetrics: UserMetric[] = [
  {
    label: "Total Users",
    value: 47,
    change: "+5",
    trend: "up",
    caption: "vs last month",
  },
  {
    label: "Active Users",
    value: 42,
    change: "+3",
    trend: "up",
    caption: "currently active",
  },
  {
    label: "Pending Approvals",
    value: 8,
    change: "+2",
    trend: "up",
    caption: "awaiting review",
  },
  {
    label: "Audit Events",
    value: 1_247,
    change: "+89",
    trend: "up",
    caption: "this month",
  },
];

export const adminRecentActivity: RecentActivity[] = [
  {
    id: 1,
    action: "USER_CREATE",
    user: "aokonkwo",
    target: "jdoe",
    timestamp: "2026-08-18T10:30:00Z",
    status: "success",
  },
  {
    id: 2,
    action: "ASSIGN_ROLE",
    user: "aokonkwo",
    target: "jdoe → AUTHORIZER",
    timestamp: "2026-08-18T10:32:00Z",
    status: "success",
  },
  {
    id: 3,
    action: "USER_LOCK",
    user: "aokonkwo",
    target: "testuser",
    timestamp: "2026-08-18T09:15:00Z",
    status: "success",
  },
  {
    id: 4,
    action: "USER_ACTIVATE",
    user: "jdoe",
    target: "newuser",
    timestamp: "2026-08-18T08:45:00Z",
    status: "success",
  },
  {
    id: 5,
    action: "LOGIN",
    user: "aokonkwo",
    timestamp: "2026-08-18T08:00:00Z",
    status: "success",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CONTROL DASHBOARD DATA
// ─────────────────────────────────────────────────────────────────────────────

export const controlMetrics: UserMetric[] = [
  {
    label: "Users Created",
    value: 12,
    change: "+3",
    trend: "up",
    caption: "this month",
  },
  {
    label: "Pending Approvals",
    value: 5,
    change: "+1",
    trend: "up",
    caption: "awaiting authorization",
  },
  {
    label: "Locked Accounts",
    value: 3,
    change: "-1",
    trend: "down",
    caption: "currently locked",
  },
  {
    label: "Suspended Accounts",
    value: 2,
    change: "0",
    trend: "flat",
    caption: "currently suspended",
  },
];

export const controlRecentUsers = [
  {
    id: 1,
    username: "jdoe",
    fullName: "John Doe",
    email: "jdoe@fasyl.com",
    roles: ["AUTHORIZER"],
    status: "ACTIVE",
    createdAt: "2026-08-17T14:20:00Z",
  },
  {
    id: 2,
    username: "newuser",
    fullName: "New User",
    email: "newuser@fasyl.com",
    roles: ["CREATOR"],
    status: "PENDING",
    createdAt: "2026-08-16T09:10:00Z",
  },
  {
    id: 3,
    username: "testuser",
    fullName: "Test User",
    email: "testuser@fasyl.com",
    roles: ["CONTROL"],
    status: "LOCKED",
    createdAt: "2026-08-15T11:30:00Z",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// AUTHORIZER DASHBOARD DATA
// ─────────────────────────────────────────────────────────────────────────────

export const authorizerMetrics: UserMetric[] = [
  {
    label: "Pending Approvals",
    value: 8,
    change: "+2",
    trend: "up",
    caption: "awaiting your review",
  },
  {
    label: "Approved Today",
    value: 4,
    change: "+1",
    trend: "up",
    caption: "requests approved",
  },
  {
    label: "Rejected Today",
    value: 1,
    change: "0",
    trend: "flat",
    caption: "requests rejected",
  },
  {
    label: "Avg Response Time",
    value: "2.4h",
    change: "-0.3h",
    trend: "down",
    caption: "faster than yesterday",
  },
];

export const authorizerPendingApprovals: ApprovalRequest[] = [
  {
    id: 1,
    username: "jdoe",
    action: "USER_CREATE",
    status: "PENDING",
    createdAt: "2026-08-18T10:30:00Z",
    makerUsername: "aokonkwo",
  },
  {
    id: 2,
    username: "newuser",
    action: "USER_CREATE",
    status: "PENDING",
    createdAt: "2026-08-18T09:15:00Z",
    makerUsername: "aokonkwo",
  },
  {
    id: 3,
    username: "testuser",
    action: "USER_LOCK",
    status: "PENDING",
    createdAt: "2026-08-18T08:45:00Z",
    makerUsername: "aokonkwo",
  },
  {
    id: 4,
    username: "anotheruser",
    action: "ASSIGN_ROLE",
    status: "PENDING",
    createdAt: "2026-08-17T16:20:00Z",
    makerUsername: "aokonkwo",
  },
  {
    id: 5,
    username: "thirduser",
    action: "USER_SUSPEND",
    status: "PENDING",
    createdAt: "2026-08-17T14:10:00Z",
    makerUsername: "aokonkwo",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CREATOR DASHBOARD DATA
// ─────────────────────────────────────────────────────────────────────────────

export const creatorMetrics: UserMetric[] = [
  {
    label: "GL Accounts",
    value: 1_284,
    change: "+48",
    trend: "up",
    caption: "total accounts",
  },
  {
    label: "Created This Month",
    value: 48,
    change: "+12",
    trend: "up",
    caption: "new accounts",
  },
  {
    label: "Journal Entries",
    value: 6_421,
    change: "+231",
    trend: "up",
    caption: "total entries",
  },
  {
    label: "Unposted Entries",
    value: 37,
    change: "-5",
    trend: "down",
    caption: "awaiting posting",
  },
];

export const creatorRecentEntries = [
  {
    id: 1,
    accountCode: "1001",
    accountName: "Cash and Cash Equivalents",
    type: "Asset",
    balance: "₦12,450,000",
    lastUpdated: "2026-08-18T10:30:00Z",
  },
  {
    id: 2,
    accountCode: "2001",
    accountName: "Trade Payables",
    type: "Liability",
    balance: "₦8,230,000",
    lastUpdated: "2026-08-18T09:15:00Z",
  },
  {
    id: 3,
    accountCode: "3001",
    accountName: "Share Capital",
    type: "Equity",
    balance: "₦50,000,000",
    lastUpdated: "2026-08-17T16:20:00Z",
  },
  {
    id: 4,
    accountCode: "4001",
    accountName: "Revenue - Services",
    type: "Income",
    balance: "₦24,680,000",
    lastUpdated: "2026-08-17T14:10:00Z",
  },
];
