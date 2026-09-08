"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gt, inArray, lt, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { trips, type Companion } from "@/lib/schema";
import { actorApproved, ActionError, isHost } from "@/lib/session";
import { conflictingBlocks, conflictingTrips, tripWithGuest } from "@/lib/availability";
import {
  guestTripCancelledByHost,
  hostTripCancelled,
  hostTripRequested,
  hostTripUpdated,
  guestTripReceived,
} from "@/lib/notify";
import { createTripEvent, deleteTripEvent } from "@/lib/calendar";
import {
  addDays,
  formatRange,
  isISODate,
  nightsBetween,
  today,
  type ISODate,
} from "@/lib/dates";
import { BOOKING_HORIZON_DAYS, MAX_COMPANIONS, MAX_NIGHTS } from "@/lib/constants";
import { fail, done, str, optionalStr, toState, type ActionState } from "./shared";

/* -------------------------------- parsing -------------------------------- */

function readCompanions(form: FormData): Companion[] {
  const names = form.getAll("companionName").map((v) => String(v).trim());
  const emails = form.getAll("companionEmail").map((v) => String(v).trim());

  const companions: Companion[] = [];
  names.forEach((name, i) => {
    if (!name) return;
    const email = emails[i] ?? "";
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new ActionError(`"${email}" doesn't look like an email address.`);
    }
    if (name.length > 60) throw new ActionError("Those names are too long.");
    companions.push({ name, email: email || null });
  });

  if (companions.length > MAX_COMPANIONS) {
    throw new ActionError(
      `You can bring at most ${MAX_COMPANIONS} other people. Ask the host if you need more room.`,
    );
  }
  return companions;
}

function readDates(form: FormData): { startDate: ISODate; endDate: ISODate } {
  const startDate = str(form, "startDate");
  const endDate = str(form, "endDate");

  if (!isISODate(startDate) || !isISODate(endDate)) {
    throw new ActionError("Pick an arrival and a departure date on the calendar.");
  }
  const from = today();
  if (startDate < from) throw new ActionError("That arrival date is in the past.");
  if (endDate <= startDate)
    throw new ActionError("The departure date has to be after the arrival date.");

  const nights = nightsBetween(startDate, endDate);
  if (nights > MAX_NIGHTS)
    throw new ActionError(
      `That's ${nights} nights. Anything longer than ${MAX_NIGHTS} is worth a phone call instead.`,
    );
  if (startDate > addDays(from, BOOKING_HORIZON_DAYS))
    throw new ActionError("That's further ahead than the calendar goes.");

  return { startDate, endDate };
}

/** Confirmed stays and host blocks own their nights; pending requests don't. */
async function assertNightsFree(
  startDate: ISODate,
  endDate: ISODate,
  excludeTripId?: string,
) {
  const [taken, blocked] = await Promise.all([
    conflictingTrips(startDate, endDate, ["approved"], excludeTripId),
    conflictingBlocks(startDate, endDate),
  ]);

  if (blocked.length) {
    const b = blocked[0];
    throw new ActionError(
      `The host has kept ${formatRange(b.startDate, b.endDate)} for themselves. Those nights aren't bookable.`,
    );
  }
  if (taken.length) {
    const t = taken[0];
    throw new ActionError(
      `${formatRange(t.startDate, t.endDate)} is already booked. Pick nights that are still open on the calendar.`,
    );
  }
}

async function assertNoSelfOverlap(
  userId: string,
  startDate: ISODate,
  endDate: ISODate,
  excludeTripId?: string,
) {
  const rows = await db
    .select()
    .from(trips)
    .where(
      and(
        eq(trips.userId, userId),
        inArray(trips.status, ["pending", "approved"]),
        lt(trips.startDate, endDate),
        gt(trips.endDate, startDate),
        excludeTripId ? ne(trips.id, excludeTripId) : undefined,
      ),
    )
    .limit(1);

  if (rows.length) {
    throw new ActionError(
      `You already have a stay on ${formatRange(rows[0].startDate, rows[0].endDate)}. Change that one instead of adding a second.`,
    );
  }
}

/* -------------------------------- actions -------------------------------- */

export async function requestTrip(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const user = await actorApproved();
    const { startDate, endDate } = readDates(form);
    const companions = readCompanions(form);
    const note = optionalStr(form, "note");
    if (note && note.length > 1000)
      return fail("That note is longer than it needs to be.");

    await assertNoSelfOverlap(user.id, startDate, endDate);
    await assertNightsFree(startDate, endDate);

    const [trip] = await db
      .insert(trips)
      .values({
        userId: user.id,
        startDate,
        endDate,
        companions,
        note,
        status: isHost(user) ? "approved" : "pending",
      })
      .returning();

    if (isHost(user)) {
      // The host books straight onto the calendar — no one to ask.
      const event = await createTripEvent({
        tripId: trip.id,
        guestName: user.displayName ?? user.name ?? "Host",
        guestEmail: user.email,
        companions: trip.companions,
        startDate: trip.startDate,
        endDate: trip.endDate,
        note: trip.note,
      });
      if (event.ok) {
        await db
          .update(trips)
          .set({ calendarEventId: event.eventId })
          .where(eq(trips.id, trip.id));
      }
    } else {
      await Promise.all([
        hostTripRequested(trip, user),
        guestTripReceived(trip, user),
      ]);
    }

    revalidatePath("/stay");
    revalidatePath("/trips");
    revalidatePath("/host");
    return done(
      isHost(user)
        ? "Added to the calendar."
        : "Request sent. You'll get an email as soon as the host answers.",
    );
  } catch (error) {
    return toState(error);
  }
}

export async function updateTrip(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const user = await actorApproved();
    const tripId = str(form, "tripId");
    const row = await tripWithGuest(tripId);
    if (!row) return fail("That trip no longer exists.");
    if (row.trip.userId !== user.id && !isHost(user))
      return fail("That isn't your trip.");
    if (row.trip.status !== "pending")
      return fail(
        "Only requests the host hasn't answered yet can be edited. Cancel it and send a new one.",
      );

    const { startDate, endDate } = readDates(form);
    const companions = readCompanions(form);
    const note = optionalStr(form, "note");

    await assertNoSelfOverlap(row.trip.userId, startDate, endDate, tripId);
    await assertNightsFree(startDate, endDate, tripId);

    const [updated] = await db
      .update(trips)
      .set({ startDate, endDate, companions, note, updatedAt: new Date() })
      .where(eq(trips.id, tripId))
      .returning();

    await hostTripUpdated(updated, row.guest, row.trip);

    revalidatePath("/stay");
    revalidatePath("/trips");
    revalidatePath("/host");
    return done("Request updated.");
  } catch (error) {
    return toState(error);
  }
}

export async function cancelTrip(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const user = await actorApproved();
    const tripId = str(form, "tripId");
    const reason = optionalStr(form, "reason");

    const row = await tripWithGuest(tripId);
    if (!row) return fail("That trip no longer exists.");

    const owner = row.trip.userId === user.id;
    if (!owner && !isHost(user)) return fail("That isn't your trip.");
    if (row.trip.status === "cancelled") return done("Already cancelled.");
    if (row.trip.status === "denied") return done("That request was already declined.");

    const byHost = !owner;

    if (row.trip.calendarEventId) {
      const result = await deleteTripEvent(row.trip.calendarEventId);
      if (!result.ok) console.warn("[trips] calendar cleanup failed:", result.error);
    }

    const [updated] = await db
      .update(trips)
      .set({
        status: "cancelled",
        cancelledBy: byHost ? "host" : "guest",
        resolutionNote: reason,
        calendarEventId: null,
        updatedAt: new Date(),
      })
      .where(eq(trips.id, tripId))
      .returning();

    if (byHost) await guestTripCancelledByHost(updated, row.guest, reason);
    else await hostTripCancelled({ ...updated, calendarEventId: row.trip.calendarEventId }, row.guest, reason);

    revalidatePath("/stay");
    revalidatePath("/trips");
    revalidatePath("/host");
    return done(
      byHost ? "Cancelled, and the guest has been told." : "Cancelled. The host has been notified.",
    );
  } catch (error) {
    return toState(error);
  }
}
