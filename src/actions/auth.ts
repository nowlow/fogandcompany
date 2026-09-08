"use server";

import { signIn, signOut } from "@/lib/auth";

export async function startSignIn(formData: FormData) {
  const provider = String(formData.get("provider") ?? "google");
  const next = String(formData.get("next") ?? "/stay");
  await signIn(provider, { redirectTo: next });
}

export async function endSession() {
  await signOut({ redirectTo: "/" });
}
