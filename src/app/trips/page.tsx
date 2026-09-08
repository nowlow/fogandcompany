import Link from "next/link";
import { requireGuest } from "@/lib/session";
import { Shell } from "@/components/Shell";
import { TripCard } from "@/components/TripCard";
import { CancelTrip, EditTrip } from "@/components/TripActions";
import { Eyebrow, SectionHeading, Empty } from "@/components/ui";
import { tripsForUser } from "@/lib/availability";
import { getSettings } from "@/lib/settings";
import { today } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "My trips" };

export default async function Trips() {
  const user = await requireGuest();
  const [rows, settings] = await Promise.all([
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
        Trips<em className="wonky not-italic text-orange">.</em>
      </h1>

      <section>
        <SectionHeading
          title="Coming up"
          action={
            <Link href="/stay" className="btn-quiet">
              Book another →
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
                      label={trip.status === "pending" ? "Withdraw" : "Cancel"}
                    />
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <Empty>
            Nothing planned.{" "}
            <Link href="/stay" className="underline underline-offset-4">
              Pick some nights
            </Link>
            .
          </Empty>
        )}
        {live.some((t) => t.status === "approved") && settings.address ? (
          <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">
            <span className="eyebrow">Address</span>{" "}
            <span className="whitespace-pre-line">{settings.address}</span>
          </p>
        ) : null}
      </section>

      {past.length ? (
        <section className="mt-16">
          <SectionHeading title="Been and gone" />
          <div className="grid gap-4">
            {past.map((trip) => (
              <TripCard key={trip.id} trip={trip} dim />
            ))}
          </div>
        </section>
      ) : null}

      {closed.length ? (
        <section className="mt-16">
          <SectionHeading title="Cancelled and declined" />
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
