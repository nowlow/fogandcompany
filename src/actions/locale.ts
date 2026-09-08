"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n";
import { currentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";

export async function setLocale(formData: FormData) {
  const next = String(formData.get("locale") ?? "");
  if (!isLocale(next)) return;

  (await cookies()).set(LOCALE_COOKIE, next, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  // Remember it on the account too, so this person's emails follow suit
  // the cookie only travels with the browser they chose it in.
  const user = await currentUser();
  if (user && user.locale !== next) {
    await db.update(users).set({ locale: next }).where(eq(users.id, user.id));
  }

  revalidatePath("/", "layout");
}
