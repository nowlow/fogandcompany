import { NextResponse } from "next/server";
import { currentUser, isHost } from "@/lib/session";
import { calendarAuthorizeUrl, googleClient } from "@/lib/calendar";
import { appUrl } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!isHost(user)) return NextResponse.redirect(appUrl("/"));

  if (!googleClient()) {
    return NextResponse.redirect(
      appUrl("/host/settings?calendar=missing-client"),
    );
  }

  const state = crypto.randomUUID();
  const response = NextResponse.redirect(calendarAuthorizeUrl(state)!);

  // Cookies must be set on the response itself; `cookies().set()` is dropped
  // when a route handler returns a redirect it built separately.
  response.cookies.set("gcal_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  // Remember that we've asked, so declining doesn't bounce the host straight
  // back into the same consent screen on the next page load.
  response.cookies.set("gcal_asked", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
