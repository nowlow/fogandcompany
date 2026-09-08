import { NextResponse, type NextRequest } from "next/server";
import { currentUser, isHost } from "@/lib/session";
import {
  exchangeCodeForRefreshToken,
  forgetCachedToken,
  listCalendars,
} from "@/lib/calendar";
import { getSettings, saveSettings } from "@/lib/settings";
import { appUrl } from "@/lib/constants";

export const dynamic = "force-dynamic";

function finish(path: string) {
  const response = NextResponse.redirect(appUrl(path));
  response.cookies.delete("gcal_state");
  return response;
}

export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!isHost(user)) return NextResponse.redirect(appUrl("/"));

  const params = request.nextUrl.searchParams;
  const expected = request.cookies.get("gcal_state")?.value;

  if (params.get("error")) return finish("/host/settings?calendar=denied");

  const state = params.get("state");
  const code = params.get("code");
  if (!code || !state || !expected || state !== expected) {
    return finish("/host/settings?calendar=state");
  }

  try {
    const { refreshToken, email } = await exchangeCodeForRefreshToken(code);
    await saveSettings({
      googleRefreshToken: refreshToken,
      googleAccountEmail: email,
    });
    forgetCachedToken();

    // Default to the account's primary calendar so the host can accept a stay
    // immediately without a second setup step.
    const current = await getSettings();
    if (!current.calendarId) {
      const calendars = await listCalendars();
      const primary = calendars.find((c) => c.primary) ?? calendars[0];
      if (primary)
        await saveSettings({ calendarId: primary.id, calendarName: primary.name });
    }

    return finish("/host?calendar=connected");
  } catch (error) {
    console.error("[google] connect failed:", error);
    return finish("/host/settings?calendar=failed");
  }
}
