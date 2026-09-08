"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { blocks, trips, users, type Trip, type User } from "@/lib/schema";
import { actorHost } from "@/lib/session";
import { ActionError } from "@/lib/errors";
import {
  conflictingBlocks,
  conflictingTrips,
  conflictingTripsWithGuests,
  tripWithGuest,
} from "@/lib/availability";
import { getSettings, saveSettings } from "@/lib/settings";
import {
  createTripEvent,
  deleteTripEvent,
  forgetCachedToken,
  listCalendars,
  updateTripEvent,
} from "@/lib/calendar";
import {
  guestAddressChanged,
  guestTripApproved,
  guestTripCancelledByHost,
  guestTripDenied,
  memberApproved,
  memberDenied,
} from "@/lib/notify";
import {
  formatRange,
  isISODate,
  nightsBetween,
  today,
  type ISODate,
} from "@/lib/dates";
import { getDict, type Dict } from "@/lib/i18n";
import { describeTrip } from "@/lib/trip-text";
import { fail, done, str, optionalStr, toState, type ActionState } from "./shared";

function readRange(
  form: FormData,
  t: Dict,
): { startDate: ISODate; endDate: ISODate } {
  const startDate = str(form, "startDate");
  const endDate = str(form, "endDate");
  if (!isISODate(startDate) || !isISODate(endDate))
    throw new ActionError(t.errors.pickRange);
  if (endDate <= startDate) throw new ActionError(t.errors.endAfterStart);
  return { startDate, endDate };
}

/** Pull a stay off the calendar and tell everyone on it. */
async function killTrip(
  trip: Trip,
  guest: User,
  reason: string,
  cancelledBy: string,
) {
  if (trip.calendarEventId) {
    const result = await deleteTripEvent(trip.calendarEventId);
    if (!result.ok) console.warn("[host] calendar cleanup failed:", result.error);
  }
  const [updated] = await db
    .update(trips)
    .set({
      status: "cancelled",
      cancelledBy,
      resolutionNote: reason,
      calendarEventId: null,
      updatedAt: new Date(),
    })
    .where(eq(trips.id, trip.id))
    .returning();
  await guestTripCancelledByHost(updated, guest, reason);
}

/* ------------------------------ trip decisions ---------------------------- */

export async function decideTrip(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const t = await getDict();
    await actorHost();
    const tripId = str(form, "tripId");
    const decision = str(form, "decision");
    const reason = optionalStr(form, "reason");

    const row = await tripWithGuest(tripId);
    if (!row) return fail(t.errors.requestGone);
    if (row.trip.status !== "pending")
      return fail(
        t.errors.alreadyDecided(
          t.status[row.trip.status as keyof typeof t.status] ?? row.trip.status,
        ),
      );

    if (decision === "deny") {
      const [updated] = await db
        .update(trips)
        .set({ status: "denied", resolutionNote: reason, updatedAt: new Date() })
        .where(eq(trips.id, tripId))
        .returning();
      await guestTripDenied(updated, row.guest, reason);
      revalidatePath("/host");
      revalidatePath("/trips");
      return done(t.ok.declined(row.guest.displayName ?? row.guest.name ?? ""));
    }

    if (decision !== "approve") return fail(t.errors.unknownDecision);

    const [taken, blocked] = await Promise.all([
      conflictingTrips(row.trip.startDate, row.trip.endDate, ["approved"], tripId),
      conflictingBlocks(row.trip.startDate, row.trip.endDate),
    ]);
    if (blocked.length)
      return fail(
        t.errors.unblockFirst(
          formatRange(blocked[0].startDate, blocked[0].endDate, t.intl),
        ),
      );
    if (taken.length)
      return fail(
        t.errors.collides(
          formatRange(taken[0].startDate, taken[0].endDate, t.intl),
        ),
      );

    const settings = await getSettings();
    const event = await createTripEvent({
      tripId: row.trip.id,
      guestName: row.guest.displayName ?? row.guest.name ?? "Guest",
      guestEmail: row.guest.email,
      companions: row.trip.companions,
      startDate: row.trip.startDate,
      endDate: row.trip.endDate,
      note: describeTrip(row.trip, row.guest, t).description,
    });

    const [updated] = await db
      .update(trips)
      .set({
        status: "approved",
        resolutionNote: reason,
        calendarEventId: event.ok ? event.eventId : null,
        updatedAt: new Date(),
      })
      .where(eq(trips.id, tripId))
      .returning();

    await guestTripApproved(updated, row.guest, settings, event.ok);

    revalidatePath("/host");
    revalidatePath("/stay");
    revalidatePath("/trips");

    return event.ok
      ? done(t.ok.accepted)
      : { ok: true, message: t.ok.acceptedNoCalendar(event.error) };
  } catch (error) {
    return toState(error);
  }
}

/* --------------------------------- blocks --------------------------------- */

export async function blockDates(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const t = await getDict();
    await actorHost();
    const { startDate, endDate } = readRange(form, t);
    const reason = optionalStr(form, "reason");
    const force = str(form, "force") === "yes";

    const clashes = await conflictingTripsWithGuests(startDate, endDate, [
      "pending",
      "approved",
    ]);

    if (clashes.length && !force) {
      return {
        confirm: {
          token: `${startDate}:${endDate}`,
          title: t.block.conflictTitle(clashes.length),
          detail: t.block.conflictDetail,
          items: clashes.map(({ trip, guest }) => {
            const label =
              t.status[trip.status as keyof typeof t.status] ?? trip.status;
            const n = t.common.nights(
              nightsBetween(trip.startDate, trip.endDate),
            );
            return `${guest.displayName ?? guest.name} · ${formatRange(trip.startDate, trip.endDate, t.intl)} · ${n} · ${label}`;
          }),
        },
      };
    }

    await db.insert(blocks).values({ startDate, endDate, reason });

    for (const { trip, guest } of clashes) {
      await killTrip(
        trip,
        guest,
        reason?.trim()
          ? t.email.blockReason(reason.trim())
          : t.email.blockReasonPlain,
        "block",
      );
    }

    revalidatePath("/host");
    revalidatePath("/stay");
    revalidatePath("/trips");

    return done(
      clashes.length
        ? t.ok.blockedAndCancelled(clashes.length)
        : t.ok.nightsYours,
    );
  } catch (error) {
    return toState(error);
  }
}

export async function removeBlock(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const t = await getDict();
    await actorHost();
    const id = str(form, "blockId");
    await db.delete(blocks).where(eq(blocks.id, id));
    revalidatePath("/host");
    revalidatePath("/stay");
    return done(t.ok.nightsOpen);
  } catch (error) {
    return toState(error);
  }
}

/* --------------------------------- people --------------------------------- */

export async function decideMember(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const t = await getDict();
    const host = await actorHost();
    const userId = str(form, "userId");
    const decision = str(form, "decision");
    if (userId === host.id) return fail(t.errors.noSelfModerate);

    const [person] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!person) return fail(t.errors.personGone);

    if (decision === "approve") {
      const [updated] = await db
        .update(users)
        .set({ status: "approved", decidedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      await memberApproved(updated);
      revalidatePath("/host", "layout");
      return done(t.ok.canBookNow(updated.displayName ?? updated.name ?? ""));
    }

    if (decision !== "deny") return fail(t.errors.unknownDecision);

    const [updated] = await db
      .update(users)
      .set({ status: "denied", decidedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    // Losing access takes their upcoming stays with it.
    const live = await db
      .select({ trip: trips, guest: users })
      .from(trips)
      .innerJoin(users, eq(users.id, trips.userId))
      .where(
        and(
          eq(trips.userId, userId),
          inArray(trips.status, ["pending", "approved"]),
          gte(trips.endDate, today()),
        ),
      );

    for (const { trip, guest } of live) {
      await killTrip(trip, guest, t.email.accessRemoved, "host");
    }

    await memberDenied(updated);
    revalidatePath("/host", "layout");
    revalidatePath("/stay");
    return done(
      live.length
        ? t.ok.accessRemovedWithTrips(live.length)
        : t.ok.accessRemoved,
    );
  } catch (error) {
    return toState(error);
  }
}

/**
 * Erase someone entirely — the account, their stays, their notes. The
 * privacy policy promises exactly this on request, so it is a real delete,
 * not a flag. Calendar events go first, because deleting the row takes the
 * event ids with it.
 */
export async function deleteMember(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const t = await getDict();
    const host = await actorHost();
    const userId = str(form, "userId");
    if (userId === host.id) return fail(t.errors.noSelfDelete);

    const [person] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!person) return fail(t.errors.personGone);
    if (person.role === "host") return fail(t.errors.noSelfDelete);

    const live = await db
      .select()
      .from(trips)
      .where(
        and(
          eq(trips.userId, userId),
          inArray(trips.status, ["pending", "approved"]),
          gte(trips.endDate, today()),
        ),
      );

    for (const trip of live) {
      if (trip.calendarEventId) {
        const result = await deleteTripEvent(trip.calendarEventId);
        if (!result.ok)
          console.warn("[host] calendar cleanup failed:", result.error);
      }
      await guestTripCancelledByHost(trip, person, t.email.accessRemoved);
    }

    // accounts, sessions and trips all cascade from the user row
    await db.delete(users).where(eq(users.id, userId));

    revalidatePath("/host", "layout");
    revalidatePath("/stay");
    return done(t.ok.memberDeleted(person.displayName ?? person.name ?? ""));
  } catch (error) {
    return toState(error);
  }
}

/* -------------------------------- settings -------------------------------- */

export async function saveHostSettings(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const t = await getDict();
    await actorHost();
    const address = optionalStr(form, "address");
    const addressNote = optionalStr(form, "addressNote");
    const welcomeNote = optionalStr(form, "welcomeNote");

    const before = await getSettings();
    await saveSettings({ address, addressNote, welcomeNote });

    let told = 0;
    if (address && address !== before.address) {
      const after = await getSettings();
      const upcoming = await db
        .select({ trip: trips, guest: users })
        .from(trips)
        .innerJoin(users, eq(users.id, trips.userId))
        .where(
          and(eq(trips.status, "approved"), gte(trips.endDate, today())),
        );
      for (const { trip, guest } of upcoming) {
        // Keep the location on the invitation honest too.
        if (trip.calendarEventId) {
          const synced = await updateTripEvent(trip.calendarEventId, {
            tripId: trip.id,
            guestName: guest.displayName ?? guest.name ?? "Guest",
            guestEmail: guest.email,
            companions: trip.companions,
            startDate: trip.startDate,
            endDate: trip.endDate,
            note: trip.note,
          });
          if (!synced.ok)
            console.warn("[host] calendar address refresh failed:", synced.error);
        }
        await guestAddressChanged(trip, guest, after);
        told++;
      }
    }

    revalidatePath("/host", "layout");
    revalidatePath("/stay");
    revalidatePath("/trips");
    return done(told ? t.ok.addressEmailed(told) : t.ok.saved);
  } catch (error) {
    return toState(error);
  }
}

export async function chooseCalendar(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const t = await getDict();
    await actorHost();
    const calendarId = str(form, "calendarId");
    if (!calendarId) return fail(t.errors.pickCalendar);
    const available = await listCalendars();
    const match = available.find((c) => c.id === calendarId);
    if (!match) return fail(t.errors.calendarGone);

    await saveSettings({ calendarId: match.id, calendarName: match.name });
    revalidatePath("/host/settings");
    return done(t.ok.calendarChosen(match.name));
  } catch (error) {
    return toState(error);
  }
}

export async function disconnectCalendar(): Promise<void> {
  await actorHost();
  await saveSettings({
    googleRefreshToken: null,
    googleAccountEmail: null,
    calendarId: null,
    calendarName: null,
  });
  forgetCachedToken();
  revalidatePath("/host/settings");
}
