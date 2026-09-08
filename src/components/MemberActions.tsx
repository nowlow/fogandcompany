"use client";

import { useActionState, useState } from "react";
import { decideMember } from "@/actions/host";
import { idle } from "@/actions/state";
import { SubmitButton, Notice } from "./form";

export function MemberActions({
  userId,
  status,
}: {
  userId: string;
  status: string;
}) {
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
            pendingLabel="Opening…"
            className="btn flex-1"
          >
            Let them in
          </SubmitButton>
          <SubmitButton
            name="decision"
            value="deny"
            pendingLabel="Sending…"
            className="btn btn-ghost flex-1"
          >
            Turn away
          </SubmitButton>
        </div>
      ) : status === "approved" ? (
        confirming ? (
          <div>
            <p className="mb-2 text-[12.5px] leading-snug text-ink-soft">
              Removing access also cancels their upcoming stays.
            </p>
            <div className="flex gap-2">
              <SubmitButton
                name="decision"
                value="deny"
                pendingLabel="Removing…"
                className="btn flex-1 !py-2"
              >
                Remove
              </SubmitButton>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="btn btn-ghost !py-2"
              >
                Keep
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="btn btn-ghost w-full"
          >
            Remove access
          </button>
        )
      ) : (
        <SubmitButton
          name="decision"
          value="approve"
          pendingLabel="Opening…"
          className="btn btn-ghost w-full"
        >
          Let them in after all
        </SubmitButton>
      )}

      <Notice state={state} />
    </form>
  );
}
