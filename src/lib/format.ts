/** Presentation helpers shared across domains. */

export function initials(value: string | null | undefined): string {
  if (!value) return "?";

  const parts = value.trim().split(/[\s._-]+/).filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * The backend is a Spring Boot app that serialises `LocalDateTime` fields
 * without a zone suffix (e.g. "2026-08-16T19:36:00"), and the server runs
 * on UTC. JavaScript parses such strings as *local* time, so they land an
 * hour off for any user east of UTC. This normalises them to UTC before
 * formatting; strings that already carry a zone ("Z" or a ±HH:MM offset)
 * pass through untouched.
 */
const HAS_ZONE_SUFFIX = /(?:Z|[+-]\d{2}:?\d{2})$/;

function toUtcDate(value: string): Date {
  const normalized =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) && !HAS_ZONE_SUFFIX.test(value)
      ? `${value}Z`
      : value;

  return new Date(normalized);
}

/** Intl emits lowercase "am"/"pm" for some locales — display them uppercase. */
const AM_PM = /\b(?:am|pm)\b/g;

function withAmPm(value: string): string {
  return value.replace(AM_PM, (match) => match.toUpperCase());
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const dateTimeFullFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZoneName: "short",
  hour12: true,
});

export function formatDate(value?: string | null): string {
  if (!value) return "—";

  const date = toUtcDate(value);
  if (Number.isNaN(date.getTime())) return "—";

  return dateFormatter.format(date);
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";

  const date = toUtcDate(value);
  if (Number.isNaN(date.getTime())) return "—";

  return withAmPm(dateTimeFormatter.format(date));
}

/** Clock time only, e.g. "8:36 PM" — pairs with a day label for context. */
export function formatTime(value?: string | null): string {
  if (!value) return "—";

  const date = toUtcDate(value);
  if (Number.isNaN(date.getTime())) return "—";

  return withAmPm(timeFormatter.format(date));
}

/** Seconds + timezone precision, for audit detail views. */
export function formatDateTimeFull(value?: string | null): string {
  if (!value) return "—";

  const date = toUtcDate(value);
  if (Number.isNaN(date.getTime())) return "—";

  return withAmPm(dateTimeFullFormatter.format(date));
}

export function formatRelative(value?: string | null): string {
  if (!value) return "—";

  const date = toUtcDate(value);
  if (Number.isNaN(date.getTime())) return "—";

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return formatDate(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
