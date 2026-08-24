/**
 * General ledger contract — mirrors the `/api/ledgers` endpoints.
 *
 * Field names match the Swagger schema:
 *   ledgerCode, description, ledgerType, leaf, status
 */

/* ------------------------------------------------------------------ */
/*  Request bodies                                                    */
/* ------------------------------------------------------------------ */

export interface CreateLedgerRequest {
  ledgerCode: string;
  description: string;
  ledgerType: string;
  leaf: string;
}

export interface UpdateLedgerRequest {
  ledgerType: string;
}

/* ------------------------------------------------------------------ */
/*  Response objects                                                  */
/* ------------------------------------------------------------------ */

export type LedgerStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUBMITTED"
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED";

export interface LedgerResponse {
  id: number;
  ledgerCode: string;
  leaf: string;
  description: string;
  ledgerType: string;
  status: LedgerStatus;
  createdById: number;
  createdByUsername: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Response from the chart-of-accounts lookup endpoint.
 * `GET /api/ledgers/lookup/{ledgerCode}`
 */
export interface LedgerReference {
  /** Lookup returns `glCode`, mapped to `ledgerCode` by the service. */
  glCode: string;
  /** Lookup returns `glDesc`, mapped to `description` by the service. */
  glDesc: string;
  leaf: string;
}

/* ------------------------------------------------------------------ */
/*  Pagination helpers                                                */
/* ------------------------------------------------------------------ */

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
