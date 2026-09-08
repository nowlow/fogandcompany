import Link from "next/link";
import { requireApproved } from "@/lib/session";
import { Shell } from "@/components/Shell";
import { TripCard } from "@/components/TripCard";
import { CancelTrip, EditTrip } from "@/components/TripActions";
import { Eyebrow, SectionHeading, Empty } from "@/components/ui";
import { tripsForUser } from "@/lib/availability";
import { getSettings } from "@/lib/settings";
import { frontDeskCount } from "@/lib/counts";
import { today } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "My trips" };

export default async function Trips() {
  const user = await requireApproved();
  const [rows, settings, deskCount] = await Promise.all([
    tripsForUser(user.id),
    getSettings(),
    user.role === "host" ? frontDeskCount() : Promise.resolve(0),
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
    <Shell user={user} pendingCount={deskCount}>
      <div className="rise mb-10">
        <Eyebrow>Your file</Eyebrow>
        <h1 className="mt-3 text-display leading-[0.92] tight">
          Trips
          <em className="wonky not-italic text-orange">.</em>
        </h1>
        <p className="mt-4 max-w-[46ch] leading-relaxed text-ink-soft">
          Every stay you&rsquo;ve asked for. You&rsquo;ll get an email whenever
          one of them changes.
        </p>
      </div>

      <section>
        <SectionHeading
          label={`${live.length} on the books`}
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
          <SectionHeading label="Already happened" title="Been and gone" />
          <div className="grid gap-4">
            {past.map((trip) => (
              <TripCard key={trip.id} trip={trip} dim />
            ))}
          </div>
        </section>
      ) : null}

      {closed.length ? (
        <section className="mt-16">
          <SectionHeading label="Closed" title="Cancelled and declined" />
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
