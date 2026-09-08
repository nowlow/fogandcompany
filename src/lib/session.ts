import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "./db";
import { users, type User } from "./schema";
import { ActionError } from "./errors";

export { ActionError };

/** The signed-in row, straight from the database (roles can change mid-session). */
export const currentUser = cache(async (): Promise<User | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ?? null;
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

/* -------------------------- guards for actions -------------------------- */

export async function actorApproved(): Promise<User> {
  const user = await currentUser();
  if (!user) throw new ActionError("You are signed out. Reload and sign in again.");
  if (user.status !== "approved")
    throw new ActionError("Your account is still waiting for approval.");
  return user;
}

export async function actorHost(): Promise<User> {
  const user = await actorApproved();
  if (!isHost(user)) throw new ActionError("Only the host can do that.");
  return user;
}
