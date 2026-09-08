"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { blocks, trips, users, type Trip, type User } from "@/lib/schema";
import { actorHost } from "@/lib/session";
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
  nightsLabel,
  today,
  type ISODate,
} from "@/lib/dates";
import { fail, done, str, optionalStr, toState, type ActionState } from "./shared";

function readRange(form: FormData): { startDate: ISODate; endDate: ISODate } {
  const startDate = str(form, "startDate");
  const endDate = str(form, "endDate");
  if (!isISODate(startDate) || !isISODate(endDate))
    throw new Error("Pick a first and last night on the calendar.");
  if (endDate <= startDate)
    throw new Error("The end of the block has to come after the start.");
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
    await actorHost();
    const tripId = str(form, "tripId");
    const decision = str(form, "decision");
    const reason = optionalStr(form, "reason");

    const row = await tripWithGuest(tripId);
    if (!row) return fail("That request no longer exists.");
    if (row.trip.status !== "pending")
      return fail(`That request is already ${row.trip.status}.`);

    if (decision === "deny") {
      const [updated] = await db
        .update(trips)
        .set({ status: "denied", resolutionNote: reason, updatedAt: new Date() })
        .where(eq(trips.id, tripId))
        .returning();
      await guestTripDenied(updated, row.guest, reason);
      revalidatePath("/host");
      revalidatePath("/trips");
      return done(`Declined. ${row.guest.displayName ?? "They"} have been told.`);
    }

    if (decision !== "approve") return fail("Unknown decision.");

    const [taken, blocked] = await Promise.all([
      conflictingTrips(row.trip.startDate, row.trip.endDate, ["approved"], tripId),
      conflictingBlocks(row.trip.startDate, row.trip.endDate),
    ]);
    if (blocked.length)
      return fail(
        `You've kept ${formatRange(blocked[0].startDate, blocked[0].endDate)} for yourself. Remove that block first if you want to accept this.`,
      );
    if (taken.length)
      return fail(
        `Those nights collide with a stay you already confirmed (${formatRange(taken[0].startDate, taken[0].endDate)}). Cancel that one first.`,
      );

    const settings = await getSettings();
    const event = await createTripEvent({
      tripId: row.trip.id,
      guestName: row.guest.displayName ?? row.guest.name ?? "Guest",
      guestEmail: row.guest.email,
      companions: row.trip.companions,
      startDate: row.trip.startDate,
      endDate: row.trip.endDate,
      note: row.trip.note,
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
      ? done("Accepted. Invitations are on their way.")
      : {
          ok: true,
          message: `Accepted and the guest has been emailed — but the calendar event failed: ${event.error}`,
        };
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
    await actorHost();
    const { startDate, endDate } = readRange(form);
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
          title: `${clashes.length} ${clashes.length === 1 ? "stay is" : "stays are"} already on those dates`,
          detail:
            "Blocking these nights will cancel them. Everyone affected gets an email, and any calendar invitations are withdrawn.",
          items: clashes.map(({ trip, guest }) => {
            const label = trip.status === "approved" ? "confirmed" : "requested";
            return `${guest.displayName ?? guest.name} · ${formatRange(trip.startDate, trip.endDate)} · ${nightsLabel(trip.startDate, trip.endDate)} · ${label}`;
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
          ? `The host needs the place on those dates — ${reason.trim()}`
          : "The host needs the place on those dates.",
        "block",
      );
    }

    revalidatePath("/host");
    revalidatePath("/stay");
    revalidatePath("/trips");

    return done(
      clashes.length
        ? `Blocked, and ${clashes.length} ${clashes.length === 1 ? "stay was" : "stays were"} cancelled.`
        : "Those nights are yours.",
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
    await actorHost();
    const id = str(form, "blockId");
    await db.delete(blocks).where(eq(blocks.id, id));
    revalidatePath("/host");
    revalidatePath("/stay");
    return done("Those nights are open again.");
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
    const host = await actorHost();
    const userId = str(form, "userId");
    const decision = str(form, "decision");
    if (userId === host.id) return fail("You can't moderate yourself.");

    const [person] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!person) return fail("That person no longer has an account.");

    if (decision === "approve") {
      const [updated] = await db
        .update(users)
        .set({ status: "approved", decidedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      await memberApproved(updated);
      revalidatePath("/host", "layout");
      return done(`${updated.displayName ?? "They"} can book now.`);
    }

    if (decision !== "deny") return fail("Unknown decision.");

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
      await killTrip(trip, guest, "Your access to the booking page was removed.", "host");
    }

    await memberDenied(updated);
    revalidatePath("/host", "layout");
    revalidatePath("/stay");
    return done(
      live.length
        ? `Access removed, and ${live.length} upcoming ${live.length === 1 ? "stay was" : "stays were"} cancelled.`
        : "Access removed.",
    );
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
    return done(
      told
        ? `Saved. ${told} ${told === 1 ? "guest" : "guests"} with an upcoming stay were emailed the new address.`
        : "Saved.",
    );
  } catch (error) {
    return toState(error);
  }
}

export async function chooseCalendar(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await actorHost();
    const calendarId = str(form, "calendarId");
    if (!calendarId) return fail("Pick a calendar.");
    const available = await listCalendars();
    const match = available.find((c) => c.id === calendarId);
    if (!match) return fail("That calendar is no longer available on this account.");

    await saveSettings({ calendarId: match.id, calendarName: match.name });
    revalidatePath("/host/settings");
    return done(`New stays will land on "${match.name}".`);
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
