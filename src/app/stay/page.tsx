import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { requireGuest } from "@/lib/session";
import { Shell } from "@/components/Shell";
import { RequestForm } from "@/components/RequestForm";
import { TripCard } from "@/components/TripCard";
import { SectionHeading, Empty } from "@/components/ui";
import { loadCalendar, upcomingTripsForUser } from "@/lib/availability";
import { getSettings } from "@/lib/settings";
import { MAX_COMPANIONS } from "@/lib/constants";
import { getDict } from "@/lib/i18n";
import { db } from "@/lib/db";
import { trips } from "@/lib/schema";

export const dynamic = "force-dynamic";



export async function generateMetadata() {
  const t = await getDict();
  return { title: t.nav.book };
}

export default async function Stay({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await requireGuest();
  const { edit } = await searchParams;

  const [t, data, settings, upcoming, editing] = await Promise.all([
    getDict(),
    loadCalendar(user),
    getSettings(),
    upcomingTripsForUser(user.id),
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
    <Shell user={user}>
      {settings.welcomeNote ? (
        <p className="mb-6 border-l-2 border-orange py-1 pl-3 text-[14px] leading-snug whitespace-pre-line text-ink-soft italic">
          {settings.welcomeNote}
        </p>
      ) : null}

      {edit && !editing ? (
        <p className="mb-6 border-l-2 border-orange py-2 pl-3 text-[13.5px] text-orange-deep">
          {t.book.alreadyAnswered}{" "}
          <Link className="underline" href="/trips">
            {t.book.seeTrips}
          </Link>
          .
        </p>
      ) : null}

      <RequestForm
        data={data}
        maxCompanions={MAX_COMPANIONS}
        editing={editing ?? undefined}
      />

      <section className="mt-16">
        <SectionHeading
          title={t.book.nextStays}
          action={
            <Link href="/trips" className="btn-quiet">
              {t.book.allOfThem}
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
          <Empty>{t.book.nothingBooked}</Empty>
        )}
      </section>
    </Shell>
  );
}
