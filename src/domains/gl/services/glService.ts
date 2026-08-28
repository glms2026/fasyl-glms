import apiClient from "@/lib/apiClient";

import type {
  CreateLedgerRequest,
  LedgerReference,
  LedgerResponse,
  Page,
  PageRequest,
  UpdateLedgerRequest,
} from "../types";

/**
 * HTTP client for the `/api/ledgers` endpoints.
 */
export const glService = {
  /** POST /api/ledgers — create a new ledger. */
  async create(payload: CreateLedgerRequest): Promise<LedgerResponse> {
    const response = await apiClient.post<LedgerResponse>("/ledgers", payload);
    return response.data;
  },

  /** GET /api/ledgers — paginated list of all ledgers. */
  async list(params: PageRequest = {}): Promise<Page<LedgerResponse>> {
    const response = await apiClient.get<Page<LedgerResponse>>("/ledgers", {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 10,
        sort: params.sort,
      },
    });
    return response.data;
  },

  /** GET /api/ledgers/{id} — get a single ledger by ID. */
  async getById(id: number): Promise<LedgerResponse> {
    const response = await apiClient.get<LedgerResponse>(`/ledgers/${id}`);
    return response.data;
  },

  /** PUT /api/ledgers/{id} — update a ledger. */
  async update(
    id: number,
    payload: UpdateLedgerRequest,
  ): Promise<LedgerResponse> {
    const response = await apiClient.put<LedgerResponse>(
      `/ledgers/${id}`,
      payload,
    );
    return response.data;
  },

  /** DELETE /api/ledgers/{id} — delete a ledger. */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/ledgers/${id}`);
  },

  /**
   * GET /api/ledgers/reference-data
   * Fetch all ledger reference data (flat array, not paginated).
   */
  async getReferenceData(): Promise<LedgerReference[]> {
    const response = await apiClient.get<LedgerReference[]>("/ledgers/reference-data");
    return response.data;
  },

  /**
   * GET /api/ledgers/lookup/{ledgerCode}
   * Look up a ledger code in the reference table and return pre-filled fields.
   */
  async lookupByCode(code: string): Promise<LedgerReference | null> {
    try {
      const response = await apiClient.get<LedgerReference>(
        `/ledgers/lookup/${encodeURIComponent(code)}`,
      );
      return response.data;
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { status?: number } }).response?.status ===
          "number" &&
        (error as { response: { status: number } }).response.status === 404
      ) {
        return null;
      }
      throw error;
    }
  },

  /**
   * GET /api/ledgers/my-ledgers
   * Get ledgers created by the current user (paginated).
   */
  async getMyLedgers(params: PageRequest = {}): Promise<Page<LedgerResponse>> {
    const response = await apiClient.get<Page<LedgerResponse>>(
      "/ledgers/my-ledgers",
      {
        params: {
          page: params.page ?? 0,
          size: params.size ?? 10,
          sort: params.sort,
        },
      },
    );
    return response.data;
  },

  /**
   * GET /api/ledgers/search?keyword=&page=&size=
   * Search the current user's ledgers by keyword.
   */
  async search(
    keyword: string,
    params: PageRequest = {},
  ): Promise<Page<LedgerResponse>> {
    const response = await apiClient.get<Page<LedgerResponse>>(
      "/ledgers/search",
      {
        params: {
          keyword,
          page: params.page ?? 0,
          size: params.size ?? 10,
          sort: params.sort,
        },
      },
    );
    return response.data;
  },

  /**
   * GET /api/ledgers/search/all?keyword=&page=&size=
   * Search all ledgers by keyword (admin / privileged users).
   */
  async searchAll(
    keyword: string,
    params: PageRequest = {},
  ): Promise<Page<LedgerResponse>> {
    const response = await apiClient.get<Page<LedgerResponse>>(
      "/ledgers/search/all",
      {
        params: {
          keyword,
          page: params.page ?? 0,
          size: params.size ?? 10,
          sort: params.sort,
        },
      },
    );
    return response.data;
  },
};
