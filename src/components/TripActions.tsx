"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { cancelTrip } from "@/actions/trips";
import { decideTrip } from "@/actions/host";
import { idle } from "@/actions/state";
import { SubmitButton, Notice } from "./form";
import { useT } from "./I18n";

export function CancelTrip({
  tripId,
  asHost,
  label,
}: {
  tripId: string;
  asHost?: boolean;
  label?: string;
}) {
  const t = useT();
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
        {label ?? t.trips.cancel}
      </button>
    );
  }

  return (
    <form action={formAction} className="w-full sm:w-[230px]">
      <input type="hidden" name="tripId" value={tripId} />
      <p className="text-[13px] leading-snug text-ink">
        {asHost ? t.trips.confirmHost : t.trips.confirmGuest}
      </p>
      <input
        name="reason"
        maxLength={300}
        placeholder={asHost ? t.trips.reasonHost : t.trips.reasonGuest}
        className="field mt-2 text-[13px]"
      />
      <div className="mt-3 flex gap-2">
        <SubmitButton pendingLabel={t.trips.cancelling} className="btn flex-1 !py-2">
          {t.trips.yesCancel}
        </SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn btn-ghost !py-2"
        >
          {t.trips.keepIt}
        </button>
      </div>
      <Notice state={state} />
    </form>
  );
}

export function EditTrip({ tripId }: { tripId: string }) {
  const t = useT();
  return (
    <Link href={`/stay?edit=${tripId}`} className="btn btn-ghost w-full">
      {t.trips.changeDates}
    </Link>
  );
}

export function DecideTrip({ tripId }: { tripId: string }) {
  const t = useT();
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
            placeholder={t.host.declineReason}
            className="field mb-3 text-[13px]"
          />
          <div className="flex gap-2">
            <SubmitButton
              name="decision"
              value="deny"
              pendingLabel={t.common.sending}
              className="btn flex-1 !py-2"
            >
              {t.host.sendDecline}
            </SubmitButton>
            <button
              type="button"
              onClick={() => setDeclining(false)}
              className="btn btn-ghost !py-2"
            >
              {t.common.back}
            </button>
          </div>
        </>
      ) : (
        <div className="flex gap-2 sm:flex-col">
          <SubmitButton
            name="decision"
            value="approve"
            pendingLabel={t.host.confirming}
            className="btn flex-1"
          >
            {t.host.accept}
          </SubmitButton>
          <button
            type="button"
            onClick={() => setDeclining(true)}
            className="btn btn-ghost flex-1"
          >
            {t.host.decline}
          </button>
        </div>
      )}

      <Notice state={state} />
    </form>
  );
}
