/**
 * General ledger contract — mirrors the `/api/ledgers` endpoints.
 */

export interface CreateGlAccountRequest {
  /** GL_CODE — unique chart-of-accounts code (max 9 chars). */
  accountCode: string;
  /** GL_DESC — human-readable description of the account. */
  accountName: string;
  /** GL_TYPE — e.g. ASSET, LIABILITY, EQUITY, INCOME, EXPENSE. */
  accountType: string;
  /** LEAF — "Y" if the account is a leaf (postings allowed), "N" for header. */
  leaf: string;
}

export interface GlAccount {
  id: number;
  accountCode: string;
  accountName: string;
  accountType: string;
  leaf: string;
  createdAt: string;
}

/**
 * Response from the chart-of-accounts lookup endpoint.
 */
export interface GlCodeLookupResponse {
  accountCode: string;
  accountName: string;
  accountType: string;
  leaf: string;
}

/** Spring Page wrapper returned by list endpoints. */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

/** Query params understood by the pageable endpoints. */
export interface PageRequest {
  page?: number;
  size?: number;
  sort?: string;
}
