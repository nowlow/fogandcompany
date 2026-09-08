import { addDays } from "./dates";
import { getSettings, saveSettings } from "./settings";
import { APP_NAME, CITY, appUrl } from "./constants";
import type { Companion } from "./schema";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const API = "https://www.googleapis.com/calendar/v3";

export const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function googleClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID;
  const clientSecret =
    process.env.GOOGLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET;
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function calendarRedirectUri(): string {
  return appUrl("/api/google/callback");
}

export function calendarAuthorizeUrl(state: string): string | null {
  const client = googleClient();
  if (!client) return null;
  const params = new URLSearchParams({
    client_id: client.clientId,
    redirect_uri: calendarRedirectUri(),
    response_type: "code",
    scope: CALENDAR_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_URL}?${params}`;
}

/** Swap the one-time code for a refresh token and remember who granted it. */
export async function exchangeCodeForRefreshToken(code: string) {
  const client = googleClient();
  if (!client) throw new Error("Google OAuth client is not configured.");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: client.clientId,
      client_secret: client.clientSecret,
      redirect_uri: calendarRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);

  const data = (await res.json()) as {
    refresh_token?: string;
    access_token?: string;
  };
  if (!data.refresh_token) {
    throw new Error(
      "Google did not return a refresh token. Remove this app at myaccount.google.com/permissions and connect again.",
    );
  }

  let email: string | null = null;
  if (data.access_token) {
    const who = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    if (who.ok) email = ((await who.json()) as { email?: string }).email ?? null;
  }
  return { refreshToken: data.refresh_token, email };
}

/* ----------------------------- access tokens ----------------------------- */

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string | null> {
  const client = googleClient();
  if (!client) return null;

  // Read the grant first: a disconnected calendar must stop working straight
  // away, not when the cached token happens to expire.
  const stored = await getSettings();
  const refreshToken =
    stored.googleRefreshToken ?? process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;
  if (!refreshToken) {
    cachedToken = null;
    return null;
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000)
    return cachedToken.value;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: client.clientId,
      client_secret: client.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("[calendar] refresh failed:", detail);
    // A revoked grant is permanent, clear it so the UI prompts to reconnect.
    if (detail.includes("invalid_grant") && stored.googleRefreshToken) {
      await saveSettings({ googleRefreshToken: null, googleAccountEmail: null });
    }
    return null;
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

export function forgetCachedToken() {
  cachedToken = null;
}

export async function calendarConnected(): Promise<boolean> {
  const stored = await getSettings();
  return Boolean(
    googleClient() &&
      (stored.googleRefreshToken ?? process.env.GOOGLE_CALENDAR_REFRESH_TOKEN),
  );
}

/* -------------------------------- calendars ------------------------------- */

export type CalendarChoice = { id: string; name: string; primary: boolean };

export async function listCalendars(): Promise<CalendarChoice[]> {
  const token = await accessToken();
  if (!token) return [];
  const res = await fetch(
    `${API}/users/me/calendarList?minAccessRole=writer&maxResults=100`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    console.error("[calendar] list failed:", await res.text());
    return [];
  }
  const data = (await res.json()) as {
    items?: { id: string; summary: string; primary?: boolean }[];
  };
  return (data.items ?? []).map((c) => ({
    id: c.id,
    name: c.summary,
    primary: Boolean(c.primary),
  }));
}

/* --------------------------------- events -------------------------------- */

export type EventInput = {
  tripId: string;
  guestName: string;
  guestEmail?: string | null;
  companions: Companion[];
  startDate: string;
  endDate: string;
  note?: string | null;
};

export type CalendarResult =
  | { ok: true; eventId: string }
  | { ok: false; error: string };

function buildEvent(input: EventInput, address?: string | null) {
  const party = [input.guestName, ...input.companions.map((c) => c.name)].filter(
    Boolean,
  );
  const extras = party.length - 1;
  const attendees = [
    input.guestEmail,
    ...input.companions.map((c) => c.email),
  ]
    .filter((e): e is string => Boolean(e && e.includes("@")))
    .map((email) => ({ email }));

  const description = [
    `${party.join(", ")} staying in ${CITY}.`,
    input.note ? `\nNote from the guest:\n${input.note}` : "",
    `\nManage this stay: ${appUrl("/host")}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    summary: `${input.guestName}${extras > 0 ? ` +${extras}` : ""} in ${CITY}`,
    description,
    location: address ?? undefined,
    // Google treats all-day `end.date` as exclusive; +1 makes the departure
    // day visible on the calendar.
    start: { date: input.startDate },
    end: { date: addDays(input.endDate, 1) },
    attendees,
    guestsCanModify: false,
    source: { title: APP_NAME, url: appUrl("/host") },
    extendedProperties: { private: { tripId: input.tripId } },
  };
}

export async function createTripEvent(
  input: EventInput,
): Promise<CalendarResult> {
  const token = await accessToken();
  if (!token) return { ok: false, error: "Google Calendar is not connected." };

  const stored = await getSettings();
  const calendarId = stored.calendarId ?? "primary";

  const res = await fetch(
    `${API}/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildEvent(input, stored.address)),
    },
  );

  if (!res.ok) {
    const error = await res.text();
    console.error("[calendar] create failed:", error);
    return { ok: false, error: `Google Calendar rejected the event: ${res.status}` };
  }
  const data = (await res.json()) as { id: string };
  return { ok: true, eventId: data.id };
}

export async function updateTripEvent(
  eventId: string,
  input: EventInput,
): Promise<CalendarResult> {
  const token = await accessToken();
  if (!token) return { ok: false, error: "Google Calendar is not connected." };

  const stored = await getSettings();
  const calendarId = stored.calendarId ?? "primary";

  const res = await fetch(
    `${API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildEvent(input, stored.address)),
    },
  );
  if (!res.ok) {
    const error = await res.text();
    console.error("[calendar] update failed:", error);
    return { ok: false, error: `Google Calendar rejected the update: ${res.status}` };
  }
  return { ok: true, eventId };
}

export async function deleteTripEvent(eventId: string): Promise<CalendarResult> {
  const token = await accessToken();
  if (!token) return { ok: false, error: "Google Calendar is not connected." };

  const stored = await getSettings();
  const calendarId = stored.calendarId ?? "primary";

  const res = await fetch(
    `${API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
  );

  // 410 = already gone, which is the state we wanted anyway.
  if (res.ok || res.status === 410 || res.status === 404)
    return { ok: true, eventId };

  const error = await res.text();
  console.error("[calendar] delete failed:", error);
  return { ok: false, error: `Google Calendar rejected the deletion: ${res.status}` };
}
