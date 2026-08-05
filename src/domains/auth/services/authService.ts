import apiClient from "@/lib/apiClient";

import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  ProfileResponse,
  ResetPasswordRequest,
} from "../types/auth";

/**
 * One method per endpoint in the Swagger auth contract.
 * Write endpoints answer with a plain string message.
 */
export const authService = {
  /** POST /api/auth/login */
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      "/auth/login",
      payload,
    );

    return response.data;
  },

  /** POST /api/auth/logout — the Authorization header is added by the interceptor. */
  async logout(): Promise<string> {
    const response = await apiClient.post<string>("/auth/logout");

    return response.data;
  },

  /** GET /api/auth/profile */
  async getProfile(): Promise<ProfileResponse> {
    const response = await apiClient.get<ProfileResponse>("/auth/profile");

    return response.data;
  },

  /** POST /api/auth/change-password */
  async changePassword(payload: ChangePasswordRequest): Promise<string> {
    const response = await apiClient.post<string>(
      "/auth/change-password",
      payload,
    );

    return response.data;
  },

  /** POST /api/auth/forgot-password */
  async forgotPassword(payload: ForgotPasswordRequest): Promise<string> {
    const response = await apiClient.post<string>(
      "/auth/forgot-password",
      payload,
    );

    return response.data;
  },

  /** POST /api/auth/reset-password */
  async resetPassword(payload: ResetPasswordRequest): Promise<string> {
    const response = await apiClient.post<string>(
      "/auth/reset-password",
      payload,
    );

    return response.data;
  },
};
