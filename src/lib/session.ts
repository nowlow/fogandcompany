import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import type { User } from "./schema";
import { ActionError } from "./errors";

export { ActionError };

/**
 * The signed-in row. Auth.js re-reads it from the database on every call as
 * part of validating the session, so this is fresh without a second query.
 */
export const currentUser = cache(async (): Promise<User | null> => {
  const session = await auth();
  return session?.user?.id ? (session.user as User) : null;
});

export function isHost(user: Pick<User, "role"> | null): boolean {
  return user?.role === "host";
}

/* --------------------------- guards for pages --------------------------- */

export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/");
  return user;
}

/** Signed in, named, and let through the door. */
export async function requireApproved(): Promise<User> {
  const user = await requireUser();
  if (!user.displayName || user.status === "profile") redirect("/welcome");
  if (user.status !== "approved") redirect("/lobby");
  return user;
}

export async function requireHost(): Promise<User> {
  const user = await requireApproved();
  if (!isHost(user)) redirect("/stay");
  return user;
}

/** The host runs the place; they don't queue up for a bed in it. */
export async function requireGuest(): Promise<User> {
  const user = await requireApproved();
  if (isHost(user)) redirect("/host");
  return user;
}

/* -------------------------- guards for actions -------------------------- */

export async function actorApproved(): Promise<User> {
  const user = await currentUser();
  if (!user) throw new ActionError("You are signed out. Reload and sign in again.");
  if (user.status !== "approved")
    throw new ActionError("Your account is still waiting for approval.");
  return user;
}

/** Booking is for guests; the host blocks dates instead. */
export async function actorGuest(): Promise<User> {
  const user = await actorApproved();
  if (isHost(user))
    throw new ActionError(
      "You're the host — block the dates you need instead of booking them.",
    );
  return user;
}

export async function actorHost(): Promise<User> {
  const user = await actorApproved();
  if (!isHost(user)) throw new ActionError("Only the host can do that.");
  return user;
}
