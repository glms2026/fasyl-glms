import apiClient from "@/lib/apiClient";

import type {
  CreateGlAccountRequest,
  GlAccount,
  GlCodeLookupResponse,
  Page,
  PageRequest,
} from "../types";

/**
 * HTTP client for the `/api/ledgers` endpoints.
 */
export const glService = {
  /** POST /api/ledgers — create a new GL account. */
  async create(payload: CreateGlAccountRequest): Promise<GlAccount> {
    const response = await apiClient.post<GlAccount>("/ledgers", payload);

    return response.data;
  },

  /** GET /api/ledgers — paginated list of all GL accounts. */
  async list(params: PageRequest = {}): Promise<Page<GlAccount>> {
    const response = await apiClient.get<Page<GlAccount>>("/ledgers", {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 10,
        sort: params.sort,
      },
    });

    return response.data;
  },

  /**
   * GET /api/ledgers/lookup?code={code} — look up a GL_CODE in the
   * reference table and return the pre-filled fields.
   */
  async lookupByCode(code: string): Promise<GlCodeLookupResponse | null> {
    try {
      const response = await apiClient.get<GlCodeLookupResponse>(
        "/ledgers/lookup",
        { params: { code } },
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
};
