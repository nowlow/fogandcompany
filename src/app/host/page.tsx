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

export const dynamic = "force-dynamic";
export const metadata = { title: "Front desk" };

export default async function HostDesk() {
  const user = await requireHost();
  const now = today();

  const [rows, waiting, calendar, blocks, connected, settings, deskCount] =
    await Promise.all([
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
        Who&rsquo;s<em className="wonky not-italic text-orange"> coming.</em>
      </h1>

      <dl className="rise mb-12 grid gap-px border border-rule bg-rule sm:grid-cols-4">
        {[
          { value: requests.length, label: "To answer" },
          { value: confirmed.length, label: "Confirmed ahead" },
          { value: nights, label: "Nights booked" },
          { value: waiting.length, label: "At the door" },
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
          Google Calendar isn&rsquo;t connected, so accepted stays won&rsquo;t
          create events or send invitations.{" "}
          <Link href="/host/settings" className="underline underline-offset-4">
            Connect it now
          </Link>
          .
        </p>
      ) : null}

      {!settings.address ? (
        <p className="mb-10 border-l-2 border-sun bg-sun/5 py-3 pl-4 text-[13.5px] leading-relaxed text-ink">
          You haven&rsquo;t set an address yet — guests can&rsquo;t see where to
          go.{" "}
          <Link href="/host/settings" className="underline underline-offset-4">
            Add it
          </Link>
          .
        </p>
      ) : null}

      <section>
        <SectionHeading title="Requests" />
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
          <Empty>Nothing waiting on you.</Empty>
        )}
      </section>

      {waiting.length ? (
        <section className="mt-16">
          <SectionHeading
            title="People at the door"
            action={
              <Link href="/host/people" className="btn-quiet">
                Everyone →
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
        <SectionHeading title="Confirmed stays" />
        {confirmed.length ? (
          <div className="grid gap-4">
            {confirmed.map(({ trip, guest }) => (
              <TripCard
                key={trip.id}
                trip={trip}
                guest={guest}
                actions={
                  <CancelTrip tripId={trip.id} asHost label="Cancel stay" />
                }
              />
            ))}
          </div>
        ) : (
          <Empty>No confirmed stays ahead.</Empty>
        )}
      </section>

      <section className="mt-20">
        <SectionHeading
          title="Block the calendar"
          action={
            blocks.length ? (
              <span className="text-[12px] text-ink-faint">
                next: {formatRange(blocks[0].startDate, blocks[0].endDate)}
              </span>
            ) : null
          }
        />
        <BlockForm data={calendar} blocks={blocks} />
      </section>
    </Shell>
  );
}
