import { and, eq, gt, gte, inArray, lt, ne } from "drizzle-orm";
import { db } from "./db";
import { blocks, trips, users, type Block, type Trip, type User } from "./schema";
import { addDays, nightsIn, today, type ISODate } from "./dates";
import { BOOKING_HORIZON_DAYS } from "./constants";

export const LIVE_TRIP_STATUSES = ["pending", "approved"] as const;

/* ------------------------------- conflicts ------------------------------- */

export async function conflictingTrips(
  start: ISODate,
  end: ISODate,
  statuses: readonly string[] = LIVE_TRIP_STATUSES,
  excludeTripId?: string,
): Promise<Trip[]> {
  const where = and(
    inArray(trips.status, [...statuses]),
    lt(trips.startDate, end),
    gt(trips.endDate, start),
    excludeTripId ? ne(trips.id, excludeTripId) : undefined,
  );
  return db.select().from(trips).where(where).orderBy(trips.startDate);
}

export async function conflictingTripsWithGuests(
  start: ISODate,
  end: ISODate,
  statuses: readonly string[] = LIVE_TRIP_STATUSES,
): Promise<{ trip: Trip; guest: User }[]> {
  const rows = await db
    .select({ trip: trips, guest: users })
    .from(trips)
    .innerJoin(users, eq(users.id, trips.userId))
    .where(
      and(
        inArray(trips.status, [...statuses]),
        lt(trips.startDate, end),
        gt(trips.endDate, start),
      ),
    )
    .orderBy(trips.startDate);
  return rows;
}

export async function conflictingBlocks(
  start: ISODate,
  end: ISODate,
): Promise<Block[]> {
  return db
    .select()
    .from(blocks)
    .where(and(lt(blocks.startDate, end), gt(blocks.endDate, start)))
    .orderBy(blocks.startDate);
}

/* ------------------------------- calendar -------------------------------- */

export type NightInfo = {
  /** who is staying, first name only for other people's trips */
  who: string;
  mine: boolean;
  tripId: string;
};

export type CalendarPayload = {
  today: ISODate;
  horizon: ISODate;
  /** nights that are taken by a confirmed stay */
  booked: Record<ISODate, NightInfo>;
  /** nights someone has asked for but the host has not answered yet */
  requested: Record<ISODate, NightInfo>;
  /** nights the host keeps */
  blocked: Record<ISODate, { reason: string | null; blockId: string }>;
  /**
   * Days a stay ends. Nobody sleeps here, so the night stays bookable, but
   * the calendar has to show it or a stay looks a day shorter than it was.
   */
  departures: Record<ISODate, NightInfo>;
};

function firstName(name: string | null | undefined): string {
  return (name ?? "Someone").trim().split(/\s+/)[0] ?? "Someone";
}

/**
 * Everything the booking calendar needs, in one shot. Names are trimmed to a
 * first name for other people's stays, enough to coordinate, not a directory.
 */
export async function loadCalendar(
  viewer: Pick<User, "id" | "role">,
): Promise<CalendarPayload> {
  const from = today();
  const horizon = addDays(from, BOOKING_HORIZON_DAYS);

  const [tripRows, blockRows] = await Promise.all([
    db
      .select({
        id: trips.id,
        userId: trips.userId,
        startDate: trips.startDate,
        endDate: trips.endDate,
        status: trips.status,
        companions: trips.companions,
        guestName: users.displayName,
        guestFallback: users.name,
      })
      .from(trips)
      .innerJoin(users, eq(users.id, trips.userId))
      .where(
        and(
          inArray(trips.status, [...LIVE_TRIP_STATUSES]),
          gt(trips.endDate, from),
          lt(trips.startDate, horizon),
        ),
      )
      .orderBy(trips.startDate),
    db
      .select()
      .from(blocks)
      .where(and(gt(blocks.endDate, from), lt(blocks.startDate, horizon)))
      .orderBy(blocks.startDate),
  ]);

  const booked: CalendarPayload["booked"] = {};
  const requested: CalendarPayload["requested"] = {};
  const blocked: CalendarPayload["blocked"] = {};
  const departures: CalendarPayload["departures"] = {};

  for (const b of blockRows) {
    for (const night of nightsIn(b.startDate, b.endDate)) {
      blocked[night] = { reason: b.reason, blockId: b.id };
    }
  }

  for (const t of tripRows) {
    const mine = t.userId === viewer.id;
    const full = t.guestName ?? t.guestFallback;
    const extras = t.companions?.length ?? 0;
    const who = `${firstName(full)}${extras ? ` +${extras}` : ""}`;
    const target = t.status === "approved" ? booked : requested;
    for (const night of nightsIn(t.startDate, t.endDate)) {
      target[night] = { who, mine, tripId: t.id };
    }
    departures[t.endDate] = { who, mine, tripId: t.id };
  }

  return { today: from, horizon, booked, requested, blocked, departures };
}

/* --------------------------------- trips --------------------------------- */

export async function tripsForUser(userId: string): Promise<Trip[]> {
  return db
    .select()
    .from(trips)
    .where(eq(trips.userId, userId))
    .orderBy(trips.startDate);
}

export async function upcomingTripsForUser(userId: string): Promise<Trip[]> {
  const from = today();
  return db
    .select()
    .from(trips)
    .where(
      and(
        eq(trips.userId, userId),
        gte(trips.endDate, from),
        inArray(trips.status, [...LIVE_TRIP_STATUSES]),
      ),
    )
    .orderBy(trips.startDate);
}

export type TripWithGuest = { trip: Trip; guest: User };

export async function allTrips(filter?: {
  statuses?: readonly string[];
  from?: ISODate;
}): Promise<TripWithGuest[]> {
  return db
    .select({ trip: trips, guest: users })
    .from(trips)
    .innerJoin(users, eq(users.id, trips.userId))
    .where(
      and(
        filter?.statuses ? inArray(trips.status, [...filter.statuses]) : undefined,
        filter?.from ? gte(trips.endDate, filter.from) : undefined,
      ),
    )
    .orderBy(trips.startDate);
}

export async function tripWithGuest(
  tripId: string,
): Promise<TripWithGuest | null> {
  const [row] = await db
    .select({ trip: trips, guest: users })
    .from(trips)
    .innerJoin(users, eq(users.id, trips.userId))
    .where(eq(trips.id, tripId))
    .limit(1);
  return row ?? null;
}

export async function upcomingBlocks(): Promise<Block[]> {
  return db
    .select()
    .from(blocks)
    .where(gt(blocks.endDate, today()))
    .orderBy(blocks.startDate);
}

export async function listPeople(): Promise<User[]> {
  return db.select().from(users).orderBy(users.createdAt);
}

export async function pendingPeople(): Promise<User[]> {
  return db
    .select()
    .from(users)
    .where(and(eq(users.status, "pending"), ne(users.role, "host")))
    .orderBy(users.createdAt);
}
