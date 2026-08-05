import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { config } from "./config";
import { tokenStorage } from "./token";

/**
 * Single axios instance for the whole app.
 *
 * The backend issues a refresh token at login but exposes no refresh
 * endpoint, so an expired access token cannot be silently renewed: any 401
 * on an authenticated request ends the session and sends the user back to
 * the sign-in screen. If a refresh endpoint is added later, the retry logic
 * belongs in the response interceptor below.
 */

const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

/** Requests that are expected to 401 on bad input rather than a dead session. */
const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/forgot-password",
  "/auth/reset-password",
];

interface TaggedRequest extends InternalAxiosRequestConfig {
  /** Set by callers that handle their own 401 instead of ending the session. */
  skipAuthRedirect?: boolean;
}

type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;

/** Lets the auth store clear its state when the session dies mid-request. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

apiClient.interceptors.request.use((request) => {
  const token = tokenStorage.getAccessToken();

  if (token) {
    request.headers.set("Authorization", `Bearer ${token}`);
  }

  return request;
});

apiClient.interceptors.response.use(
  (response) => response,

  (error: AxiosError) => {
    const request = error.config as TaggedRequest | undefined;

    const isPublic =
      !request?.url || PUBLIC_PATHS.some((path) => request.url?.includes(path));

    const sessionExpired =
      error.response?.status === 401 &&
      !isPublic &&
      !request?.skipAuthRedirect &&
      tokenStorage.hasSession();

    if (sessionExpired) {
      tokenStorage.clear();
      onUnauthorized?.();

      if (window.location.pathname !== "/login") {
        window.location.replace("/login?reason=session-expired");
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
