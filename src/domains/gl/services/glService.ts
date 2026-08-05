import type { CreateGlAccountRequest, GlAccount } from "../types";

/**
 * ===========================================================================
 * STUB SERVICE — NOT WIRED TO THE BACKEND
 * ===========================================================================
 * No GL endpoints exist in the current Swagger contract. This resolves after
 * a short delay so the screen exercises its real submitting and success
 * states. Replace the body with an `apiClient.post("/gl/accounts", payload)`
 * call once the endpoint ships; the page needs no changes.
 * ===========================================================================
 */

let nextId = 1;

export const glService = {
  async create(payload: CreateGlAccountRequest): Promise<GlAccount> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      ...payload,
      id: nextId++,
      createdAt: new Date().toISOString(),
    };
  },
};
