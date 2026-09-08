"use client";

import { useMemo, useState } from "react";
import type { CalendarPayload } from "@/lib/availability";
import {
  addMonths,
  formatMonthLabel,
  monthGrid,
  startOfMonth,
  type ISODate,
} from "@/lib/dates";
import { useT } from "./I18n";

export type Selection = { start: ISODate | null; end: ISODate | null };

type NightState = "past" | "blocked" | "booked" | "requested" | "open";

type Props = {
  data: CalendarPayload;
  /** "book" refuses taken nights; "block" lets the host draw over anything. */
  mode: "book" | "block";
  selection: Selection;
  onSelect: (selection: Selection) => void;
};

export function Calendar({ data, mode, selection, onSelect }: Props) {
  const t = useT();
  const [cursor, setCursor] = useState<ISODate>(startOfMonth(data.today));
  const [hover, setHover] = useState<ISODate | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const firstMonth = startOfMonth(data.today);
  const lastMonth = startOfMonth(data.horizon);

  const stateOf = useMemo(() => {
    return (night: ISODate): NightState => {
      if (night < data.today) return "past";
      if (data.blocked[night]) return "blocked";
      if (data.booked[night]) return "booked";
      if (data.requested[night]) return "requested";
      return "open";
    };
  }, [data]);

  const isTaken = (night: ISODate) => {
    const s = stateOf(night);
    if (mode === "block") return s === "past";
    return s === "past" || s === "blocked" || s === "booked";
  };

  /** First unavailable night between two dates, if any. */
  const firstTakenBetween = (from: ISODate, to: ISODate): ISODate | null => {
    for (let d = from; d < to; d = shift(d)) {
      if (isTaken(d)) return d;
    }
    return null;
  };

  function pick(day: ISODate) {
    setHint(null);
    const { start, end } = selection;

    if (!start || end || day <= start) {
      if (isTaken(day)) return;
      onSelect({ start: day, end: null });
      return;
    }

    const collision = firstTakenBetween(start, day);
    if (collision) {
      if (collision === start) {
        onSelect({ start: day, end: null });
        return;
      }
      onSelect({ start, end: collision });
      setHint(t.calendar.trimmed(label(collision, t.intl)));
      return;
    }
    onSelect({ start, end: day });
  }

  const previewEnd =
    selection.start && !selection.end && hover && hover > selection.start
      ? hover
      : null;

  const rangeEnd = selection.end ?? previewEnd;

  const inRange = (night: ISODate) =>
    Boolean(selection.start && rangeEnd && night >= selection.start && night < rangeEnd);

  const months = [cursor, addMonths(cursor, 1)];

  return (
    <div>
      <header className="mb-4 flex items-center justify-between">
        <button
          type="button"
          aria-label={t.calendar.previousMonth}
          disabled={cursor <= firstMonth}
          onClick={() => setCursor(addMonths(cursor, -1))}
          className="btn-ghost btn h-9 w-9 !p-0 disabled:opacity-25"
        >
          ‹
        </button>

        <div className="flex flex-1 items-baseline justify-center gap-10">
          <h3 className="text-center text-[1.35rem] tight">
            {formatMonthLabel(months[0], t.intl)}
          </h3>
          <h3 className="hidden text-center text-[1.35rem] tight lg:block">
            {formatMonthLabel(months[1], t.intl)}
          </h3>
        </div>

        <button
          type="button"
          aria-label={t.calendar.nextMonth}
          disabled={cursor >= lastMonth}
          onClick={() => setCursor(addMonths(cursor, 1))}
          className="btn-ghost btn h-9 w-9 !p-0 disabled:opacity-25"
        >
          ›
        </button>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        {months.map((month, index) => (
          <div key={month} className={index === 1 ? "hidden lg:block" : ""}>
            <div className="mb-1 grid grid-cols-7">
              {t.calendar.weekdays.map((day, i) => (
                <span
                  key={i}
                  className="eyebrow py-1 text-center !tracking-[0.1em]"
                >
                  {day}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 border-t border-l border-rule-soft">
              {monthGrid(month).flat().map((night, i) => {
                if (!night)
                  return (
                    <div
                      key={i}
                      className="aspect-square border-r border-b border-rule-soft bg-paper/40"
                    />
                  );

                const state = stateOf(night);
                const taken = isTaken(night);
                const selected = inRange(night);
                const isStart = selection.start === night;
                const isEnd = rangeEnd === night;
                const info = data.booked[night] ?? data.requested[night];
                const occupant = info
                  ? info.mine
                    ? t.calendar.you
                    : info.who
                  : undefined;

                return (
                  <button
                    key={night}
                    type="button"
                    disabled={taken && !isEnd}
                    onClick={() => pick(night)}
                    onMouseEnter={() => setHover(night)}
                    onMouseLeave={() => setHover(null)}
                    title={describe(night, state, data, t)}
                    className={cellClass({ state, selected, isStart, isEnd, taken })}
                  >
                    <span className="num text-[15px] leading-none">
                      {Number(night.slice(8, 10))}
                    </span>
                    {occupant && !selected ? (
                      <span className="mt-0.5 max-w-full truncate px-1 text-[9px] uppercase tracking-wider opacity-80">
                        {occupant}
                      </span>
                    ) : null}
                    {state === "blocked" && !selected ? (
                      <span className="mt-0.5 text-[9px] uppercase tracking-wider opacity-70">
                        {t.calendar.held}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-rule pt-4">
        <Legend swatch="border border-rule-soft bg-card" label={t.calendar.free} />
        <Legend swatch="bg-ink" label={t.calendar.booked} />
        <Legend swatch="hatch border border-rule-soft" label={t.calendar.heldByHost} />
        <Legend swatch="dotted border border-rule-soft" label={t.calendar.requested} />
        <Legend swatch="bg-orange" label={t.calendar.yourSelection} />
      </div>

      {hint ? <p className="mt-3 text-[13px] text-orange-deep">{hint}</p> : null}
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-2 text-[11.5px] text-ink-soft">
      <span className={`inline-block h-3.5 w-3.5 ${swatch}`} />
      {label}
    </span>
  );
}

function cellClass({
  state,
  selected,
  isStart,
  isEnd,
  taken,
}: {
  state: NightState;
  selected: boolean;
  isStart: boolean;
  isEnd: boolean;
  taken: boolean;
}) {
  const base =
    "relative flex aspect-square flex-col items-center justify-center border-r border-b border-rule-soft transition-colors duration-100";

  if (selected || isStart || (isEnd && !taken))
    return `${base} bg-orange text-card ${isStart ? "shadow-[inset_3px_0_0_var(--color-orange-deep)]" : ""}`;

  switch (state) {
    case "past":
      return `${base} cursor-not-allowed bg-paper/40 text-ink-faint/50`;
    case "blocked":
      return `${base} hatch cursor-not-allowed bg-card text-ink-soft`;
    case "booked":
      return `${base} cursor-not-allowed bg-ink text-card/90`;
    case "requested":
      return `${base} dotted bg-card text-ink hover:bg-sun/10`;
    default:
      return `${base} bg-card text-ink hover:bg-orange/12 hover:text-orange-deep`;
  }
}

function describe(
  night: ISODate,
  state: NightState,
  data: CalendarPayload,
  t: ReturnType<typeof useT>,
) {
  switch (state) {
    case "booked":
      return t.calendar.tipBooked(
        data.booked[night].mine ? t.calendar.you : data.booked[night].who,
      );
    case "requested":
      return t.calendar.tipRequested(
        data.requested[night].mine ? t.calendar.you : data.requested[night].who,
      );
    case "blocked":
      return data.blocked[night].reason ?? t.calendar.tipHeld;
    case "past":
      return t.calendar.tipPast;
    default:
      return t.calendar.tipFree;
  }
}

/* local date helpers kept tiny so the calendar stays self-contained */
function shift(iso: ISODate): ISODate {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function label(iso: ISODate, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00.000Z`));
}
