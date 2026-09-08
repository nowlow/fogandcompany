"use client";

import { useActionState } from "react";
import { saveHostSettings, chooseCalendar } from "@/actions/host";
import { idle } from "@/actions/state";
import { SubmitButton, Notice, Labelled } from "./form";
import type { CalendarChoice } from "@/lib/calendar";
import { useT } from "./I18n";

export function AddressForm({
  address,
  addressNote,
  welcomeNote,
}: {
  address: string;
  addressNote: string;
  welcomeNote: string;
}) {
  const t = useT();
  const [state, formAction] = useActionState(saveHostSettings, idle);

  return (
    <form action={formAction} className="space-y-7">
      <Labelled
        label={t.settings.addressLabel}
        htmlFor="address"
        hint={t.settings.addressHint}
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
        label={t.settings.gettingInLabel}
        htmlFor="addressNote"
        hint={t.settings.gettingInHint}
      >
        <textarea
          id="addressNote"
          name="addressNote"
          defaultValue={addressNote}
          rows={2}
          maxLength={600}
          placeholder={t.settings.gettingInPlaceholder}
          className="field resize-none"
        />
      </Labelled>

      <Labelled
        label={t.settings.welcomeLabel}
        htmlFor="welcomeNote"
        hint={t.settings.welcomeHint}
      >
        <textarea
          id="welcomeNote"
          name="welcomeNote"
          defaultValue={welcomeNote}
          rows={2}
          maxLength={600}
          placeholder={t.settings.welcomePlaceholder}
          className="field resize-none"
        />
      </Labelled>

      <SubmitButton pendingLabel={t.common.saving}>{t.common.save}</SubmitButton>
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
  const t = useT();
  const [state, formAction] = useActionState(chooseCalendar, idle);

  if (!calendars.length) {
    return <p className="text-[13px] text-ink-soft">{t.settings.noWritable}</p>;
  }

  return (
    <form action={formAction}>
      <Labelled label={t.settings.writesTo} htmlFor="calendarId">
        <select
          id="calendarId"
          name="calendarId"
          defaultValue={selected ?? calendars.find((c) => c.primary)?.id}
          className="field !text-[15px]"
        >
          {calendars.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.primary ? ` (${t.settings.primaryCalendar})` : ""}
            </option>
          ))}
        </select>
      </Labelled>
      <SubmitButton pendingLabel={t.common.saving} className="btn btn-ghost mt-4">
        {t.settings.useCalendar}
      </SubmitButton>
      <Notice state={state} />
    </form>
  );
}
