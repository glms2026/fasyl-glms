/**
 * ---------------------------------------------------------------------------
 * TEMPORARY SEED DATA
 * ---------------------------------------------------------------------------
 * The backend exposes no ledger reporting endpoints yet. These figures drive
 * the dashboard's financial widgets so the layout can be reviewed with
 * realistic shapes. Delete this file once real endpoints exist — only
 * `pages/DashboardPage.tsx` imports it.
 * ---------------------------------------------------------------------------
 */

export interface LedgerPoint {
  month: string;
  debits: number;
  credits: number;
}

export interface AccountMixSlice {
  label: string;
  value: number;
}

export interface SystemCheck {
  label: string;
  detail: string;
  state: "operational" | "degraded" | "down";
}

export const ledgerMovement: LedgerPoint[] = [
  { month: "Feb", debits: 42_000_000, credits: 39_400_000 },
  { month: "Mar", debits: 46_800_000, credits: 44_100_000 },
  { month: "Apr", debits: 44_200_000, credits: 45_600_000 },
  { month: "May", debits: 51_500_000, credits: 48_900_000 },
  { month: "Jun", debits: 57_300_000, credits: 54_200_000 },
  { month: "Jul", debits: 61_900_000, credits: 59_700_000 },
];

export const accountMix: AccountMixSlice[] = [
  { label: "Assets", value: 412 },
  { label: "Liabilities", value: 268 },
  { label: "Equity", value: 96 },
  { label: "Income", value: 184 },
  { label: "Expenses", value: 324 },
];

export const systemChecks: SystemCheck[] = [
  {
    label: "Ledger service",
    detail: "All postings processing normally",
    state: "operational",
  },
  {
    label: "Authentication",
    detail: "Token issuance healthy",
    state: "operational",
  },
  {
    label: "Reporting engine",
    detail: "Batch reports running 4 minutes behind",
    state: "degraded",
  },
  {
    label: "Reconciliation",
    detail: "Last run completed at 06:00",
    state: "operational",
  },
];

export const ledgerSummary = {
  totalAssets: "₦84.5B",
  assetsChange: "+12.6%",
  glAccounts: 1_284,
  glAccountsChange: "+48",
  journalEntries: 6_421,
  journalEntriesChange: "+231",
  unpostedEntries: 37,
};
