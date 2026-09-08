"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { currentUser, ActionError } from "@/lib/session";
import { hostNewMember } from "@/lib/notify";
import { getDict, getLocale } from "@/lib/i18n";
import { fail, str, optionalStr, toState, type ActionState } from "./shared";

const profileSchema = (t: Awaited<ReturnType<typeof getDict>>) =>
  z.object({
    displayName: z
      .string()
      .min(2, t.errors.nameTooShort)
      .max(60, t.errors.nameTooLong),
    relationship: z.string().max(120).nullable(),
  });

/** First stop after signing in: say who you are, then wait to be let in. */
export async function saveProfile(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const t = await getDict();
    const user = await currentUser();
    if (!user) throw new ActionError(t.errors.signedOut);

    const parsed = profileSchema(t).safeParse({
      displayName: str(form, "displayName"),
      relationship: optionalStr(form, "relationship"),
    });
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? t.common.checkDetails);
    }

    const firstTime = user.status === "profile";
    const nextStatus =
      user.status === "profile" ? "pending" : user.status;

    const [updated] = await db
      .update(users)
      .set({
        displayName: parsed.data.displayName,
        relationship: parsed.data.relationship,
        status: nextStatus,
        locale: await getLocale(),
      })
      .where(eq(users.id, user.id))
      .returning();

    if (firstTime && updated.role !== "host") {
      await hostNewMember(updated);
    }

    revalidatePath("/", "layout");
    return { ok: true, message: t.ok.saved };
  } catch (error) {
    return toState(error);
  }
}
