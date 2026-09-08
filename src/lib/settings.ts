import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { settings, type Settings } from "./schema";

const EMPTY: Settings = {
  id: "singleton",
  address: null,
  addressNote: null,
  welcomeNote: null,
  calendarId: null,
  calendarName: null,
  googleRefreshToken: null,
  googleAccountEmail: null,
  updatedAt: new Date(),
};

export const getSettings = cache(async (): Promise<Settings> => {
  const [row] = await db
    .select()
    .from(settings)
    .where(eq(settings.id, "singleton"))
    .limit(1);
  if (row) return row;

  const [created] = await db
    .insert(settings)
    .values({ id: "singleton" })
    .onConflictDoNothing()
    .returning();
  return created ?? EMPTY;
});

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  await db
    .insert(settings)
    .values({ id: "singleton", ...patch, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: settings.id,
      set: { ...patch, updatedAt: new Date() },
    });
}
