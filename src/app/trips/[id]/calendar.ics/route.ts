import { notFound } from "next/navigation";
import { currentUser, isHost } from "@/lib/session";
import { tripWithGuest } from "@/lib/availability";
import { getSettings } from "@/lib/settings";
import { getDict } from "@/lib/i18n";
import { buildIcs } from "@/lib/ics";
import { describeTrip } from "@/lib/trip-text";
import { APP_NAME, appUrl } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) notFound();

  const [row, settings, t] = await Promise.all([
    tripWithGuest(id),
    getSettings(),
    getDict(),
  ]);
  if (!row) notFound();
  if (row.trip.userId !== user.id && !isHost(user)) notFound();

  const { title, description } = describeTrip(row.trip, row.guest, t);
  const host = new URL(appUrl("/")).hostname;
  // Colons and spaces make for awkward downloads on Windows and macOS alike.
  const filename = `${APP_NAME.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${row.trip.startDate}.ics`;

  const ics = buildIcs(
    {
      uid: `trip-${row.trip.id}@${host}`,
      title,
      description,
      location: settings.address,
      start: row.trip.startDate,
      end: row.trip.endDate,
    },
    APP_NAME,
  );

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
