"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gt, inArray, lt, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { trips, type Companion } from "@/lib/schema";
import { actorApproved, actorGuest, ActionError, isHost } from "@/lib/session";
import { conflictingBlocks, conflictingTrips, tripWithGuest } from "@/lib/availability";
import {
  guestTripCancelledByHost,
  hostTripCancelled,
  hostTripRequested,
  hostTripUpdated,
  guestTripReceived,
} from "@/lib/notify";
import { deleteTripEvent } from "@/lib/calendar";
import {
  addDays,
  formatRange,
  isISODate,
  nightsBetween,
  today,
  type ISODate,
} from "@/lib/dates";
import { getDict, type Dict } from "@/lib/i18n";
import { BOOKING_HORIZON_DAYS, MAX_COMPANIONS, MAX_NIGHTS } from "@/lib/constants";
import { fail, done, str, optionalStr, toState, type ActionState } from "./shared";

/* -------------------------------- parsing -------------------------------- */

function readCompanions(form: FormData, t: Dict): Companion[] {
  const names = form.getAll("companionName").map((v) => String(v).trim());
  const emails = form.getAll("companionEmail").map((v) => String(v).trim());

  const companions: Companion[] = [];
  names.forEach((name, i) => {
    if (!name) return;
    const email = emails[i] ?? "";
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new ActionError(t.errors.badEmail(email));
    }
    if (name.length > 60) throw new ActionError(t.errors.namesTooLong);
    companions.push({ name, email: email || null });
  });

  if (companions.length > MAX_COMPANIONS) {
    throw new ActionError(t.errors.tooManyCompanions(MAX_COMPANIONS));
  }
  return companions;
}

function readDates(form: FormData, t: Dict): { startDate: ISODate; endDate: ISODate } {
  const startDate = str(form, "startDate");
  const endDate = str(form, "endDate");

  if (!isISODate(startDate) || !isISODate(endDate)) {
    throw new ActionError(t.errors.pickBothDates);
  }
  const from = today();
  if (startDate < from) throw new ActionError(t.errors.arrivalPast);
  if (endDate <= startDate)
    throw new ActionError(t.errors.departureBeforeArrival);

  const nights = nightsBetween(startDate, endDate);
  if (nights > MAX_NIGHTS)
    throw new ActionError(t.errors.tooLong(nights, MAX_NIGHTS));
  if (startDate > addDays(from, BOOKING_HORIZON_DAYS))
    throw new ActionError(t.errors.beyondHorizon);

  return { startDate, endDate };
}

/** Confirmed stays and host blocks own their nights; pending requests don't. */
async function assertNightsFree(
  startDate: ISODate,
  endDate: ISODate,
  t: Dict,
  excludeTripId?: string,
) {
  const [taken, blocked] = await Promise.all([
    conflictingTrips(startDate, endDate, ["approved"], excludeTripId),
    conflictingBlocks(startDate, endDate),
  ]);

  if (blocked.length) {
    const b = blocked[0];
    throw new ActionError(
      t.errors.heldByHost(formatRange(b.startDate, b.endDate, t.intl)),
    );
  }
  if (taken.length) {
    const clash = taken[0];
    throw new ActionError(
      t.errors.alreadyBooked(formatRange(clash.startDate, clash.endDate, t.intl)),
    );
  }
}

async function assertNoSelfOverlap(
  userId: string,
  startDate: ISODate,
  endDate: ISODate,
  t: Dict,
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
      t.errors.selfOverlap(formatRange(rows[0].startDate, rows[0].endDate, t.intl)),
    );
  }
}

/* -------------------------------- actions -------------------------------- */

export async function requestTrip(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const t = await getDict();
    const user = await actorGuest();
    const { startDate, endDate } = readDates(form, t);
    const companions = readCompanions(form, t);
    const note = optionalStr(form, "note");
    if (note && note.length > 1000) return fail(t.errors.noteTooLong);

    await assertNoSelfOverlap(user.id, startDate, endDate, t);
    await assertNightsFree(startDate, endDate, t);

    const [trip] = await db
      .insert(trips)
      .values({ userId: user.id, startDate, endDate, companions, note })
      .returning();

    await Promise.all([
      hostTripRequested(trip, user),
      guestTripReceived(trip, user),
    ]);

    revalidatePath("/stay");
    revalidatePath("/trips");
    revalidatePath("/host");
    return done(t.ok.requestSent);
  } catch (error) {
    return toState(error);
  }
}

export async function updateTrip(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const t = await getDict();
    const user = await actorApproved();
    const tripId = str(form, "tripId");
    const row = await tripWithGuest(tripId);
    if (!row) return fail(t.errors.tripGone);
    if (row.trip.userId !== user.id && !isHost(user))
      return fail(t.errors.notYourTrip);
    if (row.trip.status !== "pending") return fail(t.errors.onlyPendingEditable);

    const { startDate, endDate } = readDates(form, t);
    const companions = readCompanions(form, t);
    const note = optionalStr(form, "note");

    await assertNoSelfOverlap(row.trip.userId, startDate, endDate, t, tripId);
    await assertNightsFree(startDate, endDate, t, tripId);

    const [updated] = await db
      .update(trips)
      .set({ startDate, endDate, companions, note, updatedAt: new Date() })
      .where(eq(trips.id, tripId))
      .returning();

    await hostTripUpdated(updated, row.guest, row.trip);

    revalidatePath("/stay");
    revalidatePath("/trips");
    revalidatePath("/host");
    return done(t.ok.requestUpdated);
  } catch (error) {
    return toState(error);
  }
}

export async function cancelTrip(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const t = await getDict();
    const user = await actorApproved();
    const tripId = str(form, "tripId");
    const reason = optionalStr(form, "reason");

    const row = await tripWithGuest(tripId);
    if (!row) return fail(t.errors.tripGone);

    const owner = row.trip.userId === user.id;
    if (!owner && !isHost(user)) return fail(t.errors.notYourTrip);
    if (row.trip.status === "cancelled") return done(t.ok.alreadyCancelled);
    if (row.trip.status === "denied") return done(t.ok.alreadyDeclined);

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
    return done(byHost ? t.ok.cancelledByHost : t.ok.cancelledByGuest);
  } catch (error) {
    return toState(error);
  }
}
