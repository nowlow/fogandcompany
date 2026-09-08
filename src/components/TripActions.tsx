"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { cancelTrip } from "@/actions/trips";
import { decideTrip } from "@/actions/host";
import { idle } from "@/actions/state";
import { SubmitButton, Notice } from "./form";

export function CancelTrip({
  tripId,
  asHost,
  label = "Cancel",
}: {
  tripId: string;
  asHost?: boolean;
  label?: string;
}) {
  const [state, formAction] = useActionState(cancelTrip, idle);
  const [open, setOpen] = useState(false);

  if (state.ok) {
    return <p className="text-[12.5px] text-bay">{state.message}</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-ghost w-full"
      >
        {label}
      </button>
    );
  }

  return (
    <form action={formAction} className="w-full sm:w-[230px]">
      <input type="hidden" name="tripId" value={tripId} />
      <p className="text-[13px] leading-snug text-ink">
        {asHost
          ? "Cancel this stay and email the guest?"
          : "Cancel this stay? The host will be told."}
      </p>
      <input
        name="reason"
        maxLength={300}
        placeholder={asHost ? "Why (optional)" : "A word of explanation (optional)"}
        className="field mt-2 text-[13px]"
      />
      <div className="mt-3 flex gap-2">
        <SubmitButton pendingLabel="Cancelling…" className="btn flex-1 !py-2">
          Yes, cancel
        </SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn btn-ghost !py-2"
        >
          Keep it
        </button>
      </div>
      <Notice state={state} />
    </form>
  );
}

export function EditTrip({ tripId }: { tripId: string }) {
  return (
    <Link href={`/stay?edit=${tripId}`} className="btn btn-ghost w-full">
      Change dates
    </Link>
  );
}

export function DecideTrip({ tripId }: { tripId: string }) {
  const [state, formAction] = useActionState(decideTrip, idle);
  const [declining, setDeclining] = useState(false);

  if (state.ok) {
    return <p className="max-w-[220px] text-[12.5px] text-bay">{state.message}</p>;
  }

  return (
    <form action={formAction} className="w-full sm:w-[230px]">
      <input type="hidden" name="tripId" value={tripId} />

      {declining ? (
        <>
          <input
            name="reason"
            maxLength={300}
            autoFocus
            placeholder="Tell them why (optional)"
            className="field mb-3 text-[13px]"
          />
          <div className="flex gap-2">
            <SubmitButton
              name="decision"
              value="deny"
              pendingLabel="Sending…"
              className="btn flex-1 !py-2"
            >
              Send decline
            </SubmitButton>
            <button
              type="button"
              onClick={() => setDeclining(false)}
              className="btn btn-ghost !py-2"
            >
              Back
            </button>
          </div>
        </>
      ) : (
        <div className="flex gap-2 sm:flex-col">
          <SubmitButton
            name="decision"
            value="approve"
            pendingLabel="Confirming…"
            className="btn flex-1"
          >
            Accept
          </SubmitButton>
          <button
            type="button"
            onClick={() => setDeclining(true)}
            className="btn btn-ghost flex-1"
          >
            Decline
          </button>
        </div>
      )}

      <Notice state={state} />
    </form>
  );
}
