"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "@/actions/account";
import { idle } from "@/actions/state";
import { SubmitButton, Notice, Labelled } from "./form";

export function WelcomeForm({
  defaultName,
  defaultRelationship,
  redirectTo,
}: {
  defaultName: string;
  defaultRelationship: string;
  redirectTo: string;
}) {
  const [state, formAction] = useActionState(saveProfile, idle);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) router.replace(redirectTo);
  }, [state.ok, redirectTo, router]);

  return (
    <form action={formAction} className="mt-8 space-y-7">
      <Labelled label="Your name" htmlFor="displayName">
        <input
          id="displayName"
          name="displayName"
          defaultValue={defaultName}
          required
          minLength={2}
          maxLength={60}
          autoFocus
          placeholder="Jane Doe"
          className="field !text-[22px]"
        />
      </Labelled>

      <Labelled
        label="How do you know the host?"
        htmlFor="relationship"
        hint="Optional, but it helps them place you."
      >
        <input
          id="relationship"
          name="relationship"
          defaultValue={defaultRelationship}
          maxLength={120}
          placeholder="Cousin from Lyon"
          className="field"
        />
      </Labelled>

      <SubmitButton pendingLabel="Sending…">Ask to be let in</SubmitButton>
      <Notice state={state} />
    </form>
  );
}
