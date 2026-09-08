import Link from "next/link";
import { requireApproved } from "@/lib/session";
import { Shell } from "@/components/Shell";
import { RequestForm } from "@/components/RequestForm";
import { TripCard } from "@/components/TripCard";
import { Eyebrow, SectionHeading, Empty } from "@/components/ui";
import { loadCalendar, upcomingTripsForUser } from "@/lib/availability";
import { getSettings } from "@/lib/settings";
import { frontDeskCount } from "@/lib/counts";
import { MAX_COMPANIONS, CITY } from "@/lib/constants";
import { db } from "@/lib/db";
import { trips } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Book a stay" };

export default async function Stay({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await requireApproved();
  const { edit } = await searchParams;

  const [data, settings, upcoming, deskCount, editing] = await Promise.all([
    loadCalendar(user),
    getSettings(),
    upcomingTripsForUser(user.id),
    user.role === "host" ? frontDeskCount() : Promise.resolve(0),
    edit
      ? db
          .select()
          .from(trips)
          .where(and(eq(trips.id, edit), eq(trips.userId, user.id)))
          .limit(1)
          .then((rows) => (rows[0]?.status === "pending" ? rows[0] : null))
      : Promise.resolve(null),
  ]);

  return (
    <Shell user={user} pendingCount={deskCount}>
      <div className="mb-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="rise">
          <Eyebrow>The calendar · {CITY}</Eyebrow>
          <h1 className="mt-3 text-display leading-[0.92] tight">
            {editing ? (
              <>
                Change your
                <br />
                <em className="wonky not-italic text-orange">dates.</em>
              </>
            ) : (
              <>
                Pick your
                <br />
                <em className="wonky not-italic text-orange">nights.</em>
              </>
            )}
          </h1>
          <p className="mt-4 max-w-[44ch] leading-relaxed text-ink-soft">
            {editing
              ? "Choose a new window below. The host gets a note about the change."
              : "Anything not greyed out is yours for the asking. The host confirms by email."}
          </p>
        </div>

        <aside className="rise sheet w-full max-w-[340px] p-5" style={{ animationDelay: "120ms" }}>
          <Eyebrow>Where you&rsquo;re headed</Eyebrow>
          {settings.address ? (
            <>
              <p className="mt-2 text-[16px] leading-snug whitespace-pre-line">
                {settings.address}
              </p>
              {settings.addressNote ? (
                <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
                  {settings.addressNote}
                </p>
              ) : null}
              <a
                className="btn-quiet mt-3 inline-block"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`}
                target="_blank"
                rel="noreferrer"
              >
                Open in Maps →
              </a>
            </>
          ) : (
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
              The host hasn&rsquo;t posted the address yet. It arrives with your
              confirmation email.
            </p>
          )}
        </aside>
      </div>

      {settings.welcomeNote ? (
        <p className="mb-10 border-l-2 border-orange py-2 pl-4 text-[15px] leading-relaxed whitespace-pre-line text-ink-soft italic">
          {settings.welcomeNote}
        </p>
      ) : null}

      {edit && !editing ? (
        <p className="mb-8 border-l-2 border-orange py-2 pl-3 text-[13.5px] text-orange-deep">
          That request can&rsquo;t be edited any more — it has already been
          answered. <Link className="underline" href="/trips">See your trips</Link>.
        </p>
      ) : null}

      <RequestForm
        data={data}
        maxCompanions={MAX_COMPANIONS}
        editing={editing ?? undefined}
      />

      <section className="mt-20">
        <SectionHeading
          label="On the books"
          title="Your next stays"
          action={
            <Link href="/trips" className="btn-quiet">
              All of them →
            </Link>
          }
        />
        {upcoming.length ? (
          <div className="grid gap-4">
            {upcoming.slice(0, 3).map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <Empty>Nothing booked yet. The calendar above is waiting.</Empty>
        )}
      </section>
    </Shell>
  );
}
