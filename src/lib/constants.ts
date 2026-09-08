/**
 * `??` only falls back on undefined, so an environment variable set to an
 * empty string would win and blank out the name of the place. Treat empty and
 * whitespace-only as "not set".
 */
function env(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

export const HOST_EMAIL = env("HOST_EMAIL", "nowlow77@gmail.com").toLowerCase();

/** Everything the app shows is anchored to the host's city. */
export const TIMEZONE = env("APP_TIMEZONE", "America/Los_Angeles");

export const APP_NAME = env("APP_NAME", "Fog & Company");
export const CITY = env("APP_CITY", "San Francisco");

function num(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Guests may bring at most this many other people. */
export const MAX_COMPANIONS = num("MAX_COMPANIONS", 2);

/** How far ahead the calendar lets people book. */
export const BOOKING_HORIZON_DAYS = num("BOOKING_HORIZON_DAYS", 400);

/** Longest single stay a guest can request without asking the host directly. */
export const MAX_NIGHTS = num("MAX_NIGHTS", 30);

export function appUrl(path = "") {
  const explicit = env("NEXT_PUBLIC_APP_URL", "");
  const production = env("VERCEL_PROJECT_PRODUCTION_URL", "");
  const preview = env("VERCEL_URL", "");
  const base =
    explicit ||
    (production ? `https://${production}` : "") ||
    (preview ? `https://${preview}` : "") ||
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}
