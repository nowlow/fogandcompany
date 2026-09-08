"use client";

import { useActionState, useState } from "react";
import { decideMember } from "@/actions/host";
import { idle } from "@/actions/state";
import { SubmitButton, Notice } from "./form";
import { useT } from "./I18n";

export function MemberActions({
  userId,
  status,
}: {
  userId: string;
  status: string;
}) {
  const t = useT();
  const [state, formAction] = useActionState(decideMember, idle);
  const [confirming, setConfirming] = useState(false);

  if (state.ok)
    return <p className="text-[12.5px] text-bay">{state.message}</p>;

  return (
    <form action={formAction} className="w-full sm:w-[210px]">
      <input type="hidden" name="userId" value={userId} />

      {status === "pending" ? (
        <div className="flex gap-2 sm:flex-col">
          <SubmitButton
            name="decision"
            value="approve"
            pendingLabel={t.people.opening}
            className="btn flex-1"
          >
            {t.people.letThemIn}
          </SubmitButton>
          <SubmitButton
            name="decision"
            value="deny"
            pendingLabel={t.common.sending}
            className="btn btn-ghost flex-1"
          >
            {t.people.turnAway}
          </SubmitButton>
        </div>
      ) : status === "approved" ? (
        confirming ? (
          <div>
            <p className="mb-2 text-[12.5px] leading-snug text-ink-soft">
              {t.people.removeWarning}
            </p>
            <div className="flex gap-2">
              <SubmitButton
                name="decision"
                value="deny"
                pendingLabel={t.people.removing}
                className="btn flex-1 !py-2"
              >
                {t.people.remove}
              </SubmitButton>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="btn btn-ghost !py-2"
              >
                {t.people.keep}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="btn btn-ghost w-full"
          >
            {t.people.removeAccess}
          </button>
        )
      ) : (
        <SubmitButton
          name="decision"
          value="approve"
          pendingLabel={t.people.opening}
          className="btn btn-ghost w-full"
        >
          {t.people.letInAfterAll}
        </SubmitButton>
      )}

      <Notice state={state} />
    </form>
  );
}
