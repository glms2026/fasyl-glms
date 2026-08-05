import { AxiosError } from "axios";

/**
 * The backend returns bare strings for most failures and, for validation
 * errors, a Spring-style body. This normalises all of it into one message
 * the UI can show.
 */

interface SpringErrorBody {
  message?: string;
  error?: string;
  detail?: string;
  errors?: Array<string | { defaultMessage?: string; message?: string }>;
}

const FALLBACK = "Something went wrong. Please try again.";

export function getApiErrorMessage(error: unknown, fallback = FALLBACK): string {
  if (error instanceof AxiosError) {
    if (error.code === "ERR_NETWORK") {
      return "Can't reach the server. Check your connection and try again.";
    }

    const data = error.response?.data;

    if (typeof data === "string" && data.trim()) {
      return data.trim();
    }

    if (data && typeof data === "object") {
      const body = data as SpringErrorBody;

      if (Array.isArray(body.errors) && body.errors.length > 0) {
        const first = body.errors[0];

        if (typeof first === "string") return first;

        const nested = first.defaultMessage ?? first.message;
        if (nested) return nested;
      }

      const message = body.message ?? body.detail ?? body.error;
      if (message) return message;
    }

    if (error.response?.status === 401) {
      return "Your username or password is incorrect.";
    }

    if (error.response?.status === 403) {
      return "You don't have permission to do that.";
    }

    return error.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
