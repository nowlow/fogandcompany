"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, type Selection } from "./Calendar";
import { SubmitButton, Notice } from "./form";
import { requestTrip, updateTrip } from "@/actions/trips";
import { idle } from "@/actions/state";
import type { CalendarPayload } from "@/lib/availability";
import type { Companion, Trip } from "@/lib/schema";
import { formatDay, formatRange, nightsBetween, nightsIn } from "@/lib/dates";
import { useT } from "./I18n";

type Props = {
  data: CalendarPayload;
  maxCompanions: number;
  editing?: Pick<Trip, "id" | "startDate" | "endDate" | "note" | "companions">;
};

type Row = { name: string; email: string };

export function RequestForm({ data, maxCompanions, editing }: Props) {
  const t = useT();
  const [state, formAction] = useActionState(
    editing ? updateTrip : requestTrip,
    idle,
  );

  const [selection, setSelection] = useState<Selection>(
    editing
      ? { start: editing.startDate, end: editing.endDate }
      : { start: null, end: null },
  );
  const [rows, setRows] = useState<Row[]>(
    (editing?.companions ?? []).map((c: Companion) => ({
      name: c.name,
      email: c.email ?? "",
    })),
  );
  const [note, setNote] = useState(editing?.note ?? "");

  useEffect(() => {
    if (state.ok && !editing) {
      setSelection({ start: null, end: null });
      setRows([]);
      setNote("");
    }
  }, [state.ok, state.message, editing]);

  const nights =
    selection.start && selection.end
      ? nightsBetween(selection.start, selection.end)
      : 0;

  /** Someone else has asked for at least one of these nights. */
  const contested = useMemo(() => {
    if (!selection.start || !selection.end) return null;
    const clash = nightsIn(selection.start, selection.end)
      .map((n) => data.requested[n])
      .find((info) => info && !info.mine);
    return clash?.who ?? null;
  }, [selection, data.requested]);

  const ready = Boolean(selection.start && selection.end);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
      <section className="sheet p-5 sm:p-7">
        <Calendar
          data={data}
          mode="book"
          selection={selection}
          onSelect={setSelection}
        />
      </section>

      <form action={formAction} className="lg:sticky lg:top-8 lg:self-start">
        {editing ? <input type="hidden" name="tripId" value={editing.id} /> : null}
        <input type="hidden" name="startDate" value={selection.start ?? ""} />
        <input type="hidden" name="endDate" value={selection.end ?? ""} />

        <div className="border-t-2 border-ink pt-4">
          {!selection.start ? (
            <p className="font-display text-[1.5rem] leading-[1.15] text-ink-faint">
              {t.book.pickArrival}
            </p>
          ) : !selection.end ? (
            <div>
              <p className="font-display text-[1.6rem] leading-[1.15]">
                {t.book.arrivingOn(formatDay(selection.start, t.intl))}
              </p>
              <p className="mt-1 text-[13px] text-ink-soft">
                {t.book.thenLeaving}
              </p>
            </div>
          ) : (
            <div>
              <p className="font-display text-[1.7rem] leading-[1.1] tight">
                {formatRange(selection.start, selection.end, t.intl)}
              </p>
              <p className="num mt-1.5 text-[13px] tracking-wide text-ink-soft">
                {t.book.inOut(
                  t.common.nights(nights),
                  formatDay(selection.start, t.intl),
                  formatDay(selection.end, t.intl),
                )}
              </p>
              <button
                type="button"
                className="btn-quiet mt-1"
                onClick={() => setSelection({ start: null, end: null })}
              >
                {t.common.startOver}
              </button>
            </div>
          )}
        </div>

        {contested ? (
          <p className="mt-4 border-l-2 border-sun py-2 pl-3 text-[13px] leading-relaxed text-ink-soft">
            {t.book.contested(contested)}
          </p>
        ) : null}

        <div className="mt-6 border-t border-rule pt-4">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">{t.book.whosComing}</p>
            <span className="text-[11px] text-ink-faint">
              {t.book.max(maxCompanions)}
            </span>
          </div>

          <ul className="mt-2.5 space-y-3">
            {rows.map((row, i) => (
              <li key={i} className="border-l-2 border-rule pl-3">
                <div className="flex items-center gap-2">
                  <input
                    name="companionName"
                    value={row.name}
                    onChange={(e) =>
                      setRows(
                        rows.map((r, j) =>
                          j === i ? { ...r, name: e.target.value } : r,
                        ),
                      )
                    }
                    placeholder={t.book.theirName}
                    maxLength={60}
                    className="field"
                    required
                  />
                  <button
                    type="button"
                    aria-label={t.book.remove}
                    className="text-ink-faint transition-colors hover:text-orange"
                    onClick={() => setRows(rows.filter((_, j) => j !== i))}
                  >
                    ×
                  </button>
                </div>
                <input
                  name="companionEmail"
                  value={row.email}
                  onChange={(e) =>
                    setRows(
                      rows.map((r, j) =>
                        j === i ? { ...r, email: e.target.value } : r,
                      ),
                    )
                  }
                  placeholder={t.book.theirEmail}
                  type="email"
                  className="field mt-1 text-[13px]"
                />
              </li>
            ))}
          </ul>

          {rows.length < maxCompanions ? (
            <button
              type="button"
              className="btn-quiet mt-3"
              onClick={() => setRows([...rows, { name: "", email: "" }])}
            >
              {t.book.addSomeone}
            </button>
          ) : null}
        </div>

        <div className="mt-6 border-t border-rule pt-4">
          <label htmlFor="note" className="eyebrow mb-2 block">
            {t.book.note}
          </label>
          <textarea
            id="note"
            name="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder={t.book.notePlaceholder}
            className="field resize-none text-[14px]"
          />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <SubmitButton
            disabled={!ready}
            pendingLabel={editing ? t.common.saving : t.common.sending}
            className="btn flex-1"
          >
            {editing ? t.book.submitEdit : t.book.submit}
          </SubmitButton>
          {editing ? (
            <Link href="/trips" className="btn btn-ghost">
              {t.common.cancel}
            </Link>
          ) : null}
        </div>

        <Notice state={state} />
      </form>
    </div>
  );
}
