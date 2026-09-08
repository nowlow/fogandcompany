"use client";

import { useActionState } from "react";
import { updateTripDetails } from "@/actions/trips";
import { idle } from "@/actions/state";
import { SubmitButton, Notice, Labelled } from "./form";
import { useT } from "./I18n";

export function TripDetailsForm({
  tripId,
  note,
  arrivalTravel,
  departureTravel,
}: {
  tripId: string;
  note: string;
  arrivalTravel: string;
  departureTravel: string;
}) {
  const t = useT();
  const [state, formAction] = useActionState(updateTripDetails, idle);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="tripId" value={tripId} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Labelled label={t.trip.arrival} htmlFor="arrivalTravel">
          <input
            id="arrivalTravel"
            name="arrivalTravel"
            defaultValue={arrivalTravel}
            maxLength={120}
            placeholder={t.trip.arrivalPlaceholder}
            className="field"
          />
        </Labelled>
        <Labelled label={t.trip.departure} htmlFor="departureTravel">
          <input
            id="departureTravel"
            name="departureTravel"
            defaultValue={departureTravel}
            maxLength={120}
            placeholder={t.trip.departurePlaceholder}
            className="field"
          />
        </Labelled>
      </div>
      <p className="-mt-2 text-xs leading-relaxed text-ink-faint">
        {t.trip.travelHint}
      </p>

      <Labelled label={t.trip.noteHeading} htmlFor="note">
        <textarea
          id="note"
          name="note"
          defaultValue={note}
          rows={3}
          maxLength={1000}
          placeholder={t.book.notePlaceholder}
          className="field resize-none text-[14px]"
        />
      </Labelled>

      <SubmitButton pendingLabel={t.common.saving}>
        {t.trip.saveDetails}
      </SubmitButton>
      <Notice state={state} />
    </form>
  );
}
