import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { currentUser, isHost } from "@/lib/session";
import { exchangeCodeForRefreshToken, forgetCachedToken, listCalendars } from "@/lib/calendar";
import { getSettings, saveSettings } from "@/lib/settings";
import { appUrl } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!isHost(user)) return NextResponse.redirect(appUrl("/"));

  const params = request.nextUrl.searchParams;
  const jar = await cookies();
  const expected = jar.get("gcal_state")?.value;
  jar.delete("gcal_state");

  if (params.get("error")) {
    return NextResponse.redirect(appUrl("/host/settings?calendar=denied"));
  }
  const state = params.get("state");
  const code = params.get("code");
  if (!code || !state || !expected || state !== expected) {
    return NextResponse.redirect(appUrl("/host/settings?calendar=state"));
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

    return NextResponse.redirect(appUrl("/host/settings?calendar=connected"));
  } catch (error) {
    console.error("[google] connect failed:", error);
    return NextResponse.redirect(appUrl("/host/settings?calendar=failed"));
  }
}
