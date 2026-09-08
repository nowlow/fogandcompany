import { ActionError } from "@/lib/errors";
import { getDict } from "@/lib/i18n";
import type { ActionState } from "./state";

export type { ActionState };
export { idle } from "./state";

export function fail(error: string): ActionState {
  return { ok: false, error };
}

export function done(message: string): ActionState {
  return { ok: true, message };
}

/** Turns thrown errors into something safe to show a family member. */
export async function toState(error: unknown): Promise<ActionState> {
  const t = await getDict();
  if (error instanceof ActionError) return fail(error.message);
  if (error instanceof Error && error.name === "ZodError") {
    return fail(t.common.checkDetails);
  }
  console.error("[action]", error);
  return fail(t.common.somethingWrong);
}

export function str(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function optionalStr(form: FormData, key: string): string | null {
  const value = str(form, key);
  return value.length ? value : null;
}
