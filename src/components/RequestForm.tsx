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

type Props = {
  data: CalendarPayload;
  maxCompanions: number;
  editing?: Pick<Trip, "id" | "startDate" | "endDate" | "note" | "companions">;
};

type Row = { name: string; email: string };

export function RequestForm({ data, maxCompanions, editing }: Props) {
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
              Pick your arrival.
            </p>
          ) : !selection.end ? (
            <div>
              <p className="font-display text-[1.6rem] leading-[1.15]">
                Arriving {formatDay(selection.start)}.
              </p>
              <p className="mt-1 text-[13px] text-ink-soft">
                Now the day you leave.
              </p>
            </div>
          ) : (
            <div>
              <p className="font-display text-[1.7rem] leading-[1.1] tight">
                {formatRange(selection.start, selection.end)}
              </p>
              <p className="num mt-1.5 text-[13px] tracking-wide text-ink-soft">
                {nights} night{nights === 1 ? "" : "s"} · in{" "}
                {formatDay(selection.start)} · out {formatDay(selection.end)}
              </p>
              <button
                type="button"
                className="btn-quiet mt-1"
                onClick={() => setSelection({ start: null, end: null })}
              >
                Start over
              </button>
            </div>
          )}
        </div>

        {contested ? (
          <p className="mt-4 border-l-2 border-sun py-2 pl-3 text-[13px] leading-relaxed text-ink-soft">
            {contested} has also asked for some of these nights. You can still
            send yours — the host decides.
          </p>
        ) : null}

        <div className="mt-6 border-t border-rule pt-4">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Who&rsquo;s coming</p>
            <span className="text-[11px] text-ink-faint">
              +{maxCompanions} max
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
                    placeholder="Their name"
                    maxLength={60}
                    className="field"
                    required
                  />
                  <button
                    type="button"
                    aria-label="Remove"
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
                  placeholder="Email for the invite (optional)"
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
              + Add someone
            </button>
          ) : null}
        </div>

        <div className="mt-6 border-t border-rule pt-4">
          <label htmlFor="note" className="eyebrow mb-2 block">
            Note
          </label>
          <textarea
            id="note"
            name="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Landing late, bringing the dog…"
            className="field resize-none text-[14px]"
          />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <SubmitButton
            disabled={!ready}
            pendingLabel={editing ? "Saving…" : "Sending…"}
            className="btn flex-1"
          >
            {editing ? "Save changes" : "Ask to stay"}
          </SubmitButton>
          {editing ? (
            <Link href="/trips" className="btn btn-ghost">
              Cancel
            </Link>
          ) : null}
        </div>

        <Notice state={state} />
      </form>
    </div>
  );
}
