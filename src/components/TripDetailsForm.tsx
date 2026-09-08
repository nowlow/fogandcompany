"use client";

import { useActionState, useState } from "react";
import { updateTripDetails } from "@/actions/trips";
import { idle } from "@/actions/state";
import { SubmitButton, Notice, Labelled } from "./form";
import { useT } from "./I18n";
import { parseFlight } from "@/lib/flights";
import { AirlineLogo } from "./AirlineLogo";

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
  const [arrival, setArrival] = useState(arrivalTravel);
  const [departure, setDeparture] = useState(departureTravel);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="tripId" value={tripId} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Labelled label={t.trip.arrival} htmlFor="arrivalTravel">
          <input
            id="arrivalTravel"
            name="arrivalTravel"
            value={arrival}
            onChange={(e) => setArrival(e.target.value)}
            maxLength={120}
            placeholder={t.trip.arrivalPlaceholder}
            className="field"
          />
          <FlightHint value={arrival} />
        </Labelled>
        <Labelled label={t.trip.departure} htmlFor="departureTravel">
          <input
            id="departureTravel"
            name="departureTravel"
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
            maxLength={120}
            placeholder={t.trip.departurePlaceholder}
            className="field"
          />
          <FlightHint value={departure} />
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

/** Recognises a flight designator as it's typed and offers a tracker link. */
function FlightHint({ value }: { value: string }) {
  const t = useT();
  const parsed = parseFlight(value);
  if (!parsed) return null;

  return (
    <p className="mt-1.5 flex items-center gap-2 text-[12.5px] text-ink-soft">
      {parsed.logo ? (
        <AirlineLogo src={parsed.logo} alt={parsed.airline ?? parsed.carrier} />
      ) : null}
      <span>
        {parsed.airline ? `${parsed.airline} ${parsed.number} · ` : ""}
        <a
          href={parsed.tracker}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4 hover:text-orange"
        >
          {t.trip.track} →
        </a>
      </span>
    </p>
  );
}
