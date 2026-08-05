/**
 * Runtime configuration.
 *
 * `VITE_API_BASE_URL` should point at the backend origin (no trailing slash).
 * Every endpoint in the Swagger contract is namespaced under `/api`, so the
 * prefix is appended once here rather than repeated in every service.
 */

const rawBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://localhost:8080";

export const config = {
  apiBaseUrl: `${rawBaseUrl}/api`,
  appName: "FASYL GL",
  appSubtitle: "Management System",
} as const;
