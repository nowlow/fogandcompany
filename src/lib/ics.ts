import { addDays, type ISODate } from "./dates";

export type CalendarEvent = {
  uid: string;
  title: string;
  description: string;
  location?: string | null;
  /** arrival day */
  start: ISODate;
  /** departure day — shown inclusively, so the block covers the whole stay */
  end: ISODate;
};

const compact = (iso: ISODate) => iso.replace(/-/g, "");

/** RFC 5545 §3.3.11: backslash, semicolon, comma and newlines are special. */
function esc(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * RFC 5545 §3.1: lines are folded at 75 octets, continued with a leading
 * space. Folding by characters would break multi-byte accents, so this
 * measures the encoded length.
 */
function fold(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;

  // Escape pairs like \, must not be split across a fold, so walk tokens
  // rather than characters.
  const tokens: string[] = [];
  const chars = [...line];
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === "\\" && i + 1 < chars.length) {
      tokens.push(chars[i] + chars[i + 1]);
      i++;
    } else {
      tokens.push(chars[i]);
    }
  }

  const out: string[] = [];
  let current = "";
  let width = 0;
  for (const token of tokens) {
    const size = Buffer.byteLength(token, "utf8");
    const limit = out.length === 0 ? 75 : 74; // continuations lose one to the space
    if (width + size > limit) {
      out.push(current);
      current = "";
      width = 0;
    }
    current += token;
    width += size;
  }
  if (current) out.push(current);
  return out.join("\r\n ");
}

export function buildIcs(event: CalendarEvent, prodId: string): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${esc(prodId)}//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compact(event.start)}`,
    // all-day DTEND is exclusive
    `DTEND;VALUE=DATE:${compact(addDays(event.end, 1))}`,
    `SUMMARY:${esc(event.title)}`,
    `DESCRIPTION:${esc(event.description)}`,
    ...(event.location ? [`LOCATION:${esc(event.location)}`] : []),
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(fold).join("\r\n") + "\r\n";
}

/** "Add to Google Calendar" prefilled compose link. */
export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${compact(event.start)}/${compact(addDays(event.end, 1))}`,
    details: event.description,
    ...(event.location ? { location: event.location } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** Outlook.com / Microsoft 365 compose link. */
export function outlookCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    allday: "true",
    subject: event.title,
    startdt: event.start,
    enddt: addDays(event.end, 1),
    body: event.description,
    ...(event.location ? { location: event.location } : {}),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params}`;
}
