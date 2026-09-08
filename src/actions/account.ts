"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { currentUser, ActionError } from "@/lib/session";
import { hostNewMember } from "@/lib/notify";
import { fail, str, optionalStr, toState, type ActionState } from "./shared";

const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, "Give us at least two characters.")
    .max(60, "That name is a little long."),
  relationship: z.string().max(120).nullable(),
});

/** First stop after signing in: say who you are, then wait to be let in. */
export async function saveProfile(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const user = await currentUser();
    if (!user) throw new ActionError("You are signed out. Reload the page.");

    const parsed = profileSchema.safeParse({
      displayName: str(form, "displayName"),
      relationship: optionalStr(form, "relationship"),
    });
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Check those details.");
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
      })
      .where(eq(users.id, user.id))
      .returning();

    if (firstTime && updated.role !== "host") {
      await hostNewMember(updated);
    }

    revalidatePath("/", "layout");
    return { ok: true, message: "Saved." };
  } catch (error) {
    return toState(error);
  }
}
