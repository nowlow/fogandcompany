import Link from "next/link";
import { notFound } from "next/navigation";
import { requireApproved, isHost } from "@/lib/session";
import { Shell } from "@/components/Shell";
import { TripDetailsForm } from "@/components/TripDetailsForm";
import { CancelTrip, EditTrip } from "@/components/TripActions";
import { StatusChip, SectionHeading } from "@/components/ui";
import { tripWithGuest } from "@/lib/availability";
import { getSettings } from "@/lib/settings";
import { getDict } from "@/lib/i18n";
import { formatRange, formatFull, nightsBetween } from "@/lib/dates";
import { describeTrip } from "@/lib/trip-text";
import { googleCalendarUrl, outlookCalendarUrl } from "@/lib/ics";
import { parseFlight } from "@/lib/flights";

export const dynamic = "force-dynamic";


export async function generateMetadata() {
  const t = await getDict();
  return { title: t.trip.title };
}

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireApproved();

  const [t, row, settings] = await Promise.all([
    getDict(),
    tripWithGuest(id),
    getSettings(),
  ]);
  if (!row) notFound();

  const mine = row.trip.userId === user.id;
  const host = isHost(user);
  if (!mine && !host) notFound();

  const { trip, guest } = row;
  const nights = nightsBetween(trip.startDate, trip.endDate);
  const live = trip.status === "pending" || trip.status === "approved";
  const event = {
    uid: trip.id,
    ...describeTrip(trip, guest, t),
    location: settings.address,
    start: trip.startDate,
    end: trip.endDate,
  };
  const party = [
    guest.displayName ?? guest.name ?? "—",
    ...trip.companions.map((c) => c.name),
  ];

  return (
    <Shell user={user}>
      <Link href="/trips" className="btn-quiet">
        {t.trip.backToTrips}
      </Link>

      <header className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2 border-b border-rule pb-5">
        <h1 className="text-[2.2rem] leading-none tight">
          {formatRange(trip.startDate, trip.endDate, t.intl)}
        </h1>
        <StatusChip
          status={trip.status}
          label={t.status[trip.status as keyof typeof t.status] ?? trip.status}
        />
      </header>

      <p className="num mt-3 text-[13px] tracking-wide text-ink-soft">
        {t.common.nights(nights)} · {t.trip.arrival} {formatFull(trip.startDate, t.intl)}{" "}
        · {t.trip.departure} {formatFull(trip.endDate, t.intl)}
      </p>
      {host && !mine ? (
        <p className="mt-2 text-[13px] text-orange-deep">{t.trip.hostView}</p>
      ) : null}

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-12">
          <section>
            <SectionHeading title={t.trip.travelHeading} />
            {live && mine ? (
              <TripDetailsForm
                tripId={trip.id}
                note={trip.note ?? ""}
                arrivalTravel={trip.arrivalTravel ?? ""}
                departureTravel={trip.departureTravel ?? ""}
              />
            ) : (
              <dl className="space-y-3 text-[14px]">
                <Detail label={t.trip.arrival} value={trip.arrivalTravel} flight />
                <Detail
                  label={t.trip.departure}
                  value={trip.departureTravel}
                  flight
                />
                <Detail label={t.trip.noteHeading} value={trip.note} />
                {!trip.arrivalTravel &&
                !trip.departureTravel &&
                !trip.note ? (
                  <p className="text-[13.5px] text-ink-faint">
                    {t.trip.nothingYet}
                  </p>
                ) : null}
              </dl>
            )}
          </section>

          <section>
            <SectionHeading title={t.trip.whoHeading} />
            <ul className="space-y-2 text-[15px]">
              {party.map((name, i) => (
                <li key={i} className="border-b border-rule-soft pb-2">
                  {name}
                  {i === 0 && guest.email ? (
                    <span className="ml-2 text-[12.5px] text-ink-faint">
                      {guest.email}
                    </span>
                  ) : null}
                  {i > 0 && trip.companions[i - 1]?.email ? (
                    <span className="ml-2 text-[12.5px] text-ink-faint">
                      {trip.companions[i - 1].email}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-10">
          <section>
            <p className="eyebrow mb-3">{t.trip.addToCalendar}</p>
            <div className="flex flex-col gap-2">
              <a
                href={`/trips/${trip.id}/calendar.ics`}
                className="btn btn-ghost"
                download
              >
                {t.trip.downloadIcs}
              </a>
              <a
                href={googleCalendarUrl(event)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost"
              >
                {t.trip.google}
              </a>
              <a
                href={outlookCalendarUrl(event)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost"
              >
                {t.trip.outlook}
              </a>
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-ink-faint">
              {t.trip.icsHint}
            </p>
          </section>

          <section>
            <p className="eyebrow mb-2">{t.trip.whereHeading}</p>
            {settings.address && trip.status === "approved" ? (
              <>
                <p className="text-[15px] leading-snug whitespace-pre-line">
                  {settings.address}
                </p>
                {settings.addressNote ? (
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
                    {settings.addressNote}
                  </p>
                ) : null}
                <a
                  className="btn-quiet mt-2 inline-block"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t.trip.openInMaps}
                </a>
              </>
            ) : (
              <p className="text-[13.5px] leading-relaxed text-ink-soft">
                {t.trip.addressPending}
              </p>
            )}
          </section>

          {live ? (
            <section>
              <p className="eyebrow mb-3">{t.trip.manage}</p>
              <div className="flex flex-col gap-2">
                {trip.status === "pending" && mine ? (
                  <EditTrip tripId={trip.id} />
                ) : null}
                <CancelTrip
                  tripId={trip.id}
                  asHost={host && !mine}
                  label={
                    trip.status === "pending" ? t.trips.withdraw : t.trips.cancel
                  }
                />
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </Shell>
  );
}

async function Detail({
  label,
  value,
  flight,
}: {
  label: string;
  value: string | null;
  flight?: boolean;
}) {
  if (!value) return null;
  const t = await getDict();
  const parsed = flight ? parseFlight(value) : null;

  return (
    <div className="border-b border-rule-soft pb-2">
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 whitespace-pre-line">
        {value}
        {parsed ? (
          <span className="ml-2 text-[13px] text-ink-soft">
            {parsed.airline ? `${parsed.airline} ${parsed.number} · ` : ""}
            <a
              href={parsed.tracker}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4 hover:text-orange"
            >
              {t.trip.track} →
            </a>
          </span>
        ) : null}
      </dd>
    </div>
  );
}
