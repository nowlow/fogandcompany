"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "@/actions/account";
import { idle } from "@/actions/state";
import { SubmitButton, Notice, Labelled } from "./form";
import { useT } from "./I18n";

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
  const t = useT();

  useEffect(() => {
    if (state.ok) router.replace(redirectTo);
  }, [state.ok, redirectTo, router]);

  return (
    <form action={formAction} className="mt-8 space-y-7">
      <Labelled label={t.welcome.nameLabel} htmlFor="displayName">
        <input
          id="displayName"
          name="displayName"
          defaultValue={defaultName}
          required
          minLength={2}
          maxLength={60}
          autoFocus
          placeholder={t.welcome.namePlaceholder}
          className="field !text-[22px]"
        />
      </Labelled>

      <Labelled
        label={t.welcome.relationLabel}
        htmlFor="relationship"
        hint={t.welcome.relationHint}
      >
        <input
          id="relationship"
          name="relationship"
          defaultValue={defaultRelationship}
          maxLength={120}
          placeholder={t.welcome.relationPlaceholder}
          className="field"
        />
      </Labelled>

      <SubmitButton pendingLabel={t.common.sending}>{t.welcome.submit}</SubmitButton>
      <Notice state={state} />
    </form>
  );
}
