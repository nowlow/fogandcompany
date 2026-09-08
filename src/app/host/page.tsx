import Link from "next/link";
import { requireHost } from "@/lib/session";
import { Shell } from "@/components/Shell";
import { TripCard } from "@/components/TripCard";
import { PersonCard } from "@/components/PersonCard";
import { DecideTrip, CancelTrip } from "@/components/TripActions";
import { MemberActions } from "@/components/MemberActions";
import { BlockForm } from "@/components/BlockForm";
import { Eyebrow, SectionHeading, Empty } from "@/components/ui";
import {
  allTrips,
  loadCalendar,
  pendingPeople,
  upcomingBlocks,
} from "@/lib/availability";
import { calendarConnected } from "@/lib/calendar";
import { getSettings } from "@/lib/settings";
import { frontDeskCount } from "@/lib/counts";
import { today, formatRange } from "@/lib/dates";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";



export async function generateMetadata() {
  const t = await getDict();
  return { title: t.nav.frontDesk };
}

export default async function HostDesk() {
  const user = await requireHost();
  const now = today();

  const [t, rows, waiting, calendar, blocks, connected, settings, deskCount] =
    await Promise.all([
      getDict(),
      allTrips({ statuses: ["pending", "approved"], from: now }),
      pendingPeople(),
      loadCalendar(user),
      upcomingBlocks(),
      calendarConnected(),
      getSettings(),
      frontDeskCount(),
    ]);

  const requests = rows.filter((r) => r.trip.status === "pending");
  const confirmed = rows.filter((r) => r.trip.status === "approved");
  const nights = confirmed.reduce(
    (sum, r) =>
      sum +
      Math.round(
        (Date.parse(`${r.trip.endDate}T00:00:00Z`) -
          Date.parse(`${r.trip.startDate}T00:00:00Z`)) /
          86400000,
      ),
    0,
  );

  return (
    <Shell user={user} pendingCount={deskCount}>
      <h1 className="rise mb-7 text-[2.4rem] leading-none tight">
        {t.host.title1}<em className="wonky not-italic text-orange">{t.host.title2}</em>
      </h1>

      <dl className="rise mb-12 grid gap-px border border-rule bg-rule sm:grid-cols-4">
        {[
          { value: requests.length, label: t.host.toAnswer },
          { value: confirmed.length, label: t.host.confirmedAhead },
          { value: nights, label: t.host.nightsBooked },
          { value: waiting.length, label: t.host.atTheDoor },
        ].map((stat) => (
          <div key={stat.label} className="bg-card p-5">
            <dd className="num text-[30px] leading-none tracking-tight">
              {stat.value}
            </dd>
            <dt className="eyebrow mt-2">{stat.label}</dt>
          </div>
        ))}
      </dl>

      {!connected ? (
        <p className="mb-10 border-l-2 border-orange bg-orange/5 py-3 pl-4 text-[13.5px] leading-relaxed text-ink">
          {t.host.calendarNotConnected}{" "}
          <Link href="/host/settings" className="underline underline-offset-4">
            {t.host.connectNow}
          </Link>
          .
        </p>
      ) : null}

      {!settings.address ? (
        <p className="mb-10 border-l-2 border-sun bg-sun/5 py-3 pl-4 text-[13.5px] leading-relaxed text-ink">
          {t.host.noAddress}{" "}
          <Link href="/host/settings" className="underline underline-offset-4">
            {t.host.addIt}
          </Link>
          .
        </p>
      ) : null}

      <section>
        <SectionHeading title={t.host.requests} />
        {requests.length ? (
          <div className="grid gap-4">
            {requests.map(({ trip, guest }) => (
              <TripCard
                key={trip.id}
                trip={trip}
                guest={guest}
                actions={<DecideTrip tripId={trip.id} />}
              />
            ))}
          </div>
        ) : (
          <Empty>{t.host.nothingWaiting}</Empty>
        )}
      </section>

      {waiting.length ? (
        <section className="mt-16">
          <SectionHeading
            title={t.host.peopleAtDoor}
            action={
              <Link href="/host/people" className="btn-quiet">
                {t.host.everyone}
              </Link>
            }
          />
          <div className="grid gap-4">
            {waiting.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                actions={
                  <MemberActions userId={person.id} status={person.status} />
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-16">
        <SectionHeading title={t.host.confirmedStays} />
        {confirmed.length ? (
          <div className="grid gap-4">
            {confirmed.map(({ trip, guest }) => (
              <TripCard
                key={trip.id}
                trip={trip}
                guest={guest}
                actions={
                  <CancelTrip tripId={trip.id} asHost label={t.host.cancelStay} />
                }
              />
            ))}
          </div>
        ) : (
          <Empty>{t.host.noConfirmed}</Empty>
        )}
      </section>

      <section className="mt-20">
        <SectionHeading
          title={t.host.blockTitle}
          action={
            blocks.length ? (
              <span className="text-[12px] text-ink-faint">
                {t.host.next(
                  formatRange(blocks[0].startDate, blocks[0].endDate, t.intl),
                )}
              </span>
            ) : null
          }
        />
        <BlockForm data={calendar} blocks={blocks} />
      </section>
    </Shell>
  );
}
