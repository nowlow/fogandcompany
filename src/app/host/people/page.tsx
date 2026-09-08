import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { requireHost } from "@/lib/session";
import { Shell } from "@/components/Shell";
import { PersonCard } from "@/components/PersonCard";
import { MemberActions } from "@/components/MemberActions";
import { Eyebrow, SectionHeading, Empty } from "@/components/ui";
import { listPeople } from "@/lib/availability";
import { frontDeskCount } from "@/lib/counts";
import { db } from "@/lib/db";
import { trips } from "@/lib/schema";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";



export async function generateMetadata() {
  const t = await getDict();
  return { title: t.people.title };
}

export default async function People() {
  const host = await requireHost();
  const [t, people, tallies, deskCount] = await Promise.all([
    getDict(),
    listPeople(),
    db
      .select({ userId: trips.userId, n: count() })
      .from(trips)
      .where(eq(trips.status, "approved"))
      .groupBy(trips.userId),
    frontDeskCount(),
  ]);

  const stays = new Map(tallies.map((t) => [t.userId, t.n]));
  const group = (status: string) =>
    people.filter((p) => p.status === status && p.id !== host.id);

  const waiting = group("pending");
  const approved = group("approved");
  const declined = [...group("denied"), ...group("profile")];

  return (
    <Shell user={host} pendingCount={deskCount}>
      <h1 className="rise mb-8 text-[2.4rem] leading-none tight">
        {t.people.title}<em className="wonky not-italic text-orange">.</em>
      </h1>

      <section>
        <SectionHeading
          title={t.people.atTheDoor}
          action={
            <Link href="/host" className="btn-quiet">
              {t.people.backToDesk}
            </Link>
          }
        />
        {waiting.length ? (
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
        ) : (
          <Empty>{t.people.nobodyWaiting}</Empty>
        )}
      </section>

      <section className="mt-16">
        <SectionHeading title={t.people.letIn} />
        {approved.length ? (
          <div className="grid gap-4">
            {approved.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                trips={stays.get(person.id) ?? 0}
                actions={
                  <MemberActions userId={person.id} status={person.status} />
                }
              />
            ))}
          </div>
        ) : (
          <Empty>{t.people.nobodyLetIn}</Empty>
        )}
      </section>

      {declined.length ? (
        <section className="mt-16">
          <SectionHeading title={t.people.turnedAway} />
          <div className="grid gap-4">
            {declined.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                dim
                actions={
                  person.status === "denied" ? (
                    <MemberActions userId={person.id} status={person.status} />
                  ) : null
                }
              />
            ))}
          </div>
        </section>
      ) : null}
    </Shell>
  );
}
