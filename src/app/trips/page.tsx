import Link from "next/link";
import { requireGuest } from "@/lib/session";
import { Shell } from "@/components/Shell";
import { TripCard } from "@/components/TripCard";
import { CancelTrip, EditTrip } from "@/components/TripActions";
import { Eyebrow, SectionHeading, Empty } from "@/components/ui";
import { tripsForUser } from "@/lib/availability";
import { getSettings } from "@/lib/settings";
import { today } from "@/lib/dates";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";



export async function generateMetadata() {
  const t = await getDict();
  return { title: t.trips.title };
}

export default async function Trips() {
  const user = await requireGuest();
  const [t, rows, settings] = await Promise.all([
    getDict(),
    tripsForUser(user.id),
    getSettings(),
  ]);

  const now = today();
  const live = rows.filter(
    (t) => ["pending", "approved"].includes(t.status) && t.endDate >= now,
  );
  const past = rows
    .filter((t) => ["pending", "approved"].includes(t.status) && t.endDate < now)
    .reverse();
  const closed = rows
    .filter((t) => ["cancelled", "denied"].includes(t.status))
    .reverse();

  return (
    <Shell user={user}>
      <h1 className="rise mb-8 text-[2.4rem] leading-none tight">
        {t.trips.title}<em className="wonky not-italic text-orange">.</em>
      </h1>

      <section>
        <SectionHeading
          title={t.trips.comingUp}
          action={
            <Link href="/stay" className="btn-quiet">
              {t.trips.bookAnother}
            </Link>
          }
        />
        {live.length ? (
          <div className="grid gap-4">
            {live.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                actions={
                  <>
                    {trip.status === "pending" ? <EditTrip tripId={trip.id} /> : null}
                    <CancelTrip
                      tripId={trip.id}
                      label={
                        trip.status === "pending"
                          ? t.trips.withdraw
                          : t.trips.cancel
                      }
                    />
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <Empty>
            {t.trips.nothingPlanned}{" "}
            <Link href="/stay" className="underline underline-offset-4">
              {t.trips.pickSomeNights}
            </Link>
            .
          </Empty>
        )}
        {live.some((t) => t.status === "approved") && settings.address ? (
          <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">
            <span className="eyebrow">{t.trips.address}</span>{" "}
            <span className="whitespace-pre-line">{settings.address}</span>
          </p>
        ) : null}
      </section>

      {past.length ? (
        <section className="mt-16">
          <SectionHeading title={t.trips.beenAndGone} />
          <div className="grid gap-4">
            {past.map((trip) => (
              <TripCard key={trip.id} trip={trip} dim />
            ))}
          </div>
        </section>
      ) : null}

      {closed.length ? (
        <section className="mt-16">
          <SectionHeading title={t.trips.closed} />
          <div className="grid gap-4">
            {closed.map((trip) => (
              <TripCard key={trip.id} trip={trip} dim />
            ))}
          </div>
        </section>
      ) : null}
    </Shell>
  );
}
