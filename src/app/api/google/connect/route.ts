import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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
  const jar = await cookies();
  jar.set("gcal_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(calendarAuthorizeUrl(state)!);
}
