/**
 * General ledger contract.
 *
 * NOTE: the Swagger contract covers `/api/auth` only — there is no GL
 * endpoint yet. These models describe what the Create GL screen submits, so
 * wiring it up later means editing `services/glService.ts` and nothing else.
 */

export const GlAccountType = {
  ASSET: "ASSET",
  LIABILITY: "LIABILITY",
  EQUITY: "EQUITY",
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
} as const;

export type GlAccountType =
  (typeof GlAccountType)[keyof typeof GlAccountType];

export const GlAccountCategory = {
  CURRENT: "CURRENT",
  NON_CURRENT: "NON_CURRENT",
  OPERATING: "OPERATING",
  NON_OPERATING: "NON_OPERATING",
} as const;

export type GlAccountCategory =
  (typeof GlAccountCategory)[keyof typeof GlAccountCategory];

export interface CreateGlAccountRequest {
  accountName: string;
  accountCode: string;
  accountType: GlAccountType;
  category: GlAccountCategory;
  currency: string;
  parentAccountCode?: string;
  description?: string;
  postingAllowed: boolean;
}

export interface GlAccount extends CreateGlAccountRequest {
  id: number;
  createdAt: string;
}
