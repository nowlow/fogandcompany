export const HOST_EMAIL = (
  process.env.HOST_EMAIL ?? "nowlow77@gmail.com"
).toLowerCase();

/** Everything the app shows is anchored to the host's city. */
export const TIMEZONE = process.env.APP_TIMEZONE ?? "America/Los_Angeles";

export const APP_NAME = process.env.APP_NAME ?? "Fog & Company";
export const CITY = process.env.APP_CITY ?? "San Francisco";

const num = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

/** Guests may bring at most this many other people. */
export const MAX_COMPANIONS = num(process.env.MAX_COMPANIONS, 2);

/** How far ahead the calendar lets people book. */
export const BOOKING_HORIZON_DAYS = num(process.env.BOOKING_HORIZON_DAYS, 400);

/** Longest single stay a guest can request without asking the host directly. */
export const MAX_NIGHTS = num(process.env.MAX_NIGHTS, 30);

export function appUrl(path = "") {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
  return `${base.replace(/\/$/, "")}${path}`;
}
