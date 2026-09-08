import { TIMEZONE } from "./constants";

/** All dates in this app are plain `YYYY-MM-DD` strings — no timezone drift. */
export type ISODate = string;

const DAY = 86_400_000;

export function isISODate(value: unknown): value is ISODate {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function toUTC(iso: ISODate): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function fromUTC(d: Date): ISODate {
  return d.toISOString().slice(0, 10);
}

/** Today, as it is right now in the host's city. */
export function today(): ISODate {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function addDays(iso: ISODate, days: number): ISODate {
  return fromUTC(new Date(toUTC(iso).getTime() + days * DAY));
}

/** Nights between arrival and departure. */
export function nightsBetween(start: ISODate, end: ISODate): number {
  return Math.round((toUTC(end).getTime() - toUTC(start).getTime()) / DAY);
}

/** Every night occupied by a stay: arrival day up to (not including) departure. */
export function nightsIn(start: ISODate, end: ISODate): ISODate[] {
  const out: ISODate[] = [];
  for (let d = start; d < end; d = addDays(d, 1)) out.push(d);
  return out;
}

export function startOfMonth(iso: ISODate): ISODate {
  return `${iso.slice(0, 7)}-01`;
}

export function addMonths(iso: ISODate, n: number): ISODate {
  const [y, m] = iso.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
}

export function daysInMonth(iso: ISODate): number {
  const [y, m] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/**
 * Weeks of a month, Monday-first, padded with nulls so the grid stays square.
 */
export function monthGrid(month: ISODate): (ISODate | null)[][] {
  const first = startOfMonth(month);
  const total = daysInMonth(first);
  const lead = (toUTC(first).getUTCDay() + 6) % 7; // Monday = 0
  const cells: (ISODate | null)[] = Array(lead).fill(null);
  for (let i = 0; i < total; i++) cells.push(addDays(first, i));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (ISODate | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/* ------------------------------- formatting ------------------------------ */

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { ...opts, timeZone: "UTC" });

export function formatDay(iso: ISODate): string {
  return fmt({ weekday: "short", month: "short", day: "numeric" }).format(
    toUTC(iso),
  );
}

export function formatFull(iso: ISODate): string {
  return fmt({
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(toUTC(iso));
}

export function formatMonthLabel(iso: ISODate): string {
  return fmt({ month: "long", year: "numeric" }).format(toUTC(iso));
}

/** "Sep 12 – 16, 2026" / "Dec 29, 2026 – Jan 3, 2027" */
export function formatRange(start: ISODate, end: ISODate): string {
  const s = toUTC(start);
  const e = toUTC(end);
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  const sameMonth = sameYear && start.slice(0, 7) === end.slice(0, 7);
  const left = sameYear
    ? fmt({ month: "short", day: "numeric" }).format(s)
    : fmt({ month: "short", day: "numeric", year: "numeric" }).format(s);
  const right = sameMonth
    ? fmt({ day: "numeric" }).format(e)
    : fmt({ month: "short", day: "numeric" }).format(e);
  return `${left} – ${right}, ${end.slice(0, 4)}`;
}

export function nightsLabel(start: ISODate, end: ISODate): string {
  const n = nightsBetween(start, end);
  return `${n} night${n === 1 ? "" : "s"}`;
}

/** "in 3 days" / "today" / "2 weeks ago" — coarse on purpose. */
export function relativeToToday(iso: ISODate): string {
  const days = nightsBetween(today(), iso);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days > 0)
    return days < 14
      ? `in ${days} days`
      : `in ${Math.round(days / 7)} weeks`;
  const past = -days;
  return past < 14 ? `${past} days ago` : `${Math.round(past / 7)} weeks ago`;
}
