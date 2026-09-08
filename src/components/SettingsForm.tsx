"use client";

import { useActionState } from "react";
import { saveHostSettings, chooseCalendar } from "@/actions/host";
import { idle } from "@/actions/state";
import { SubmitButton, Notice, Labelled } from "./form";
import type { CalendarChoice } from "@/lib/calendar";

export function AddressForm({
  address,
  addressNote,
  welcomeNote,
}: {
  address: string;
  addressNote: string;
  welcomeNote: string;
}) {
  const [state, formAction] = useActionState(saveHostSettings, idle);

  return (
    <form action={formAction} className="space-y-7">
      <Labelled
        label="Address"
        htmlFor="address"
        hint="Everyone you've let in can see this. Changing it emails anyone with a confirmed stay ahead."
      >
        <textarea
          id="address"
          name="address"
          defaultValue={address}
          rows={3}
          maxLength={400}
          placeholder={"1 Fog Bank Lane\nApt 4\nSan Francisco, CA 94110"}
          className="field resize-none !text-[17px] leading-snug"
        />
      </Labelled>

      <Labelled
        label="Getting in"
        htmlFor="addressNote"
        hint="Door code, which buzzer, where to park, the cat's name."
      >
        <textarea
          id="addressNote"
          name="addressNote"
          defaultValue={addressNote}
          rows={2}
          maxLength={600}
          placeholder="Buzzer 4B. Keys under the blue pot if I'm out."
          className="field resize-none"
        />
      </Labelled>

      <Labelled
        label="A word for the booking page"
        htmlFor="welcomeNote"
        hint="Shown above the calendar. Leave empty for none."
      >
        <textarea
          id="welcomeNote"
          name="welcomeNote"
          defaultValue={welcomeNote}
          rows={2}
          maxLength={600}
          placeholder="The spare room fits two. August is chaos — sorry in advance."
          className="field resize-none"
        />
      </Labelled>

      <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
      <Notice state={state} />
    </form>
  );
}

export function CalendarPicker({
  calendars,
  selected,
}: {
  calendars: CalendarChoice[];
  selected: string | null;
}) {
  const [state, formAction] = useActionState(chooseCalendar, idle);

  if (!calendars.length) {
    return (
      <p className="text-[13px] text-ink-soft">
        No writable calendars came back from Google. Accepted stays will land on
        the primary calendar.
      </p>
    );
  }

  return (
    <form action={formAction}>
      <Labelled label="Stays are written to" htmlFor="calendarId">
        <select
          id="calendarId"
          name="calendarId"
          defaultValue={selected ?? calendars.find((c) => c.primary)?.id}
          className="field !text-[15px]"
        >
          {calendars.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.primary ? " (primary)" : ""}
            </option>
          ))}
        </select>
      </Labelled>
      <SubmitButton pendingLabel="Saving…" className="btn btn-ghost mt-4">
        Use this calendar
      </SubmitButton>
      <Notice state={state} />
    </form>
  );
}
