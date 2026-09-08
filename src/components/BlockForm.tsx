"use client";

import { useActionState, useEffect, useState } from "react";
import { Calendar, type Selection } from "./Calendar";
import { SubmitButton, Notice } from "./form";
import { blockDates, removeBlock } from "@/actions/host";
import { idle } from "@/actions/state";
import type { CalendarPayload } from "@/lib/availability";
import type { Block } from "@/lib/schema";
import { formatRange, nightsBetween, formatDay } from "@/lib/dates";

export function BlockForm({
  data,
  blocks,
}: {
  data: CalendarPayload;
  blocks: Block[];
}) {
  const [state, formAction] = useActionState(blockDates, idle);
  const [selection, setSelection] = useState<Selection>({ start: null, end: null });
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (state.ok) {
      setSelection({ start: null, end: null });
      setReason("");
    }
  }, [state.ok, state.message]);

  const nights =
    selection.start && selection.end
      ? nightsBetween(selection.start, selection.end)
      : 0;
  const ready = Boolean(selection.start && selection.end);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
      <section className="sheet p-5 sm:p-7">
        <Calendar
          data={data}
          mode="block"
          selection={selection}
          onSelect={setSelection}
        />
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-faint">
          You can draw over nights that are already taken. Nothing is cancelled
          until you say so.
        </p>
      </section>

      <div className="lg:sticky lg:top-24 lg:self-start">
      <form action={formAction}>
        <input type="hidden" name="startDate" value={selection.start ?? ""} />
        <input type="hidden" name="endDate" value={selection.end ?? ""} />

        <div className="border-t-2 border-ink pt-4">
          <p className="eyebrow mb-3">Keep nights for yourself</p>
          {ready ? (
            <>
              <p className="font-display text-[1.6rem] leading-[1.1] tight">
                {formatRange(selection.start!, selection.end!)}
              </p>
              <p className="num mt-1.5 text-[13px] text-ink-soft">
                {nights} night{nights === 1 ? "" : "s"} · from{" "}
                {formatDay(selection.start!)} to {formatDay(selection.end!)}
              </p>
              <button
                type="button"
                className="btn-quiet mt-1"
                onClick={() => setSelection({ start: null, end: null })}
              >
                Start over
              </button>
            </>
          ) : (
            <p className="font-display text-[1.5rem] leading-[1.15] text-ink-faint">
              {selection.start
                ? `From ${formatDay(selection.start)} — pick the end.`
                : "Draw a range on the calendar."}
            </p>
          )}
        </div>

        <div className="mt-6">
          <label htmlFor="reason" className="eyebrow mb-2 block">
            What&rsquo;s the occasion
          </label>
          <input
            id="reason"
            name="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            placeholder="Parents visiting, working late…"
            className="field text-[14px]"
          />
          <p className="mt-1.5 text-xs text-ink-faint">
            Guests see this if their dates get cancelled.
          </p>
        </div>

        {state.confirm ? (
          <div className="mt-6 border-2 border-orange bg-orange/5 p-4">
            <p className="eyebrow !text-orange-deep">Hold on</p>
            <p className="mt-1.5 text-[15px] leading-snug text-ink">
              {state.confirm.title}
            </p>
            <ul className="mt-3 space-y-1.5 border-t border-orange/25 pt-3">
              {state.confirm.items.map((item) => (
                <li key={item} className="text-[13px] leading-snug text-ink-soft">
                  — {item}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12.5px] leading-relaxed text-ink-soft">
              {state.confirm.detail}
            </p>
            <SubmitButton
              name="force"
              value="yes"
              pendingLabel="Cancelling…"
              className="btn mt-4 w-full !border-orange !bg-orange"
            >
              Block anyway &amp; cancel {state.confirm.items.length}
            </SubmitButton>
          </div>
        ) : (
          <SubmitButton
            disabled={!ready}
            pendingLabel="Checking…"
            className="btn mt-6 w-full"
          >
            Hold these nights
          </SubmitButton>
        )}

        <Notice state={state} />
      </form>

      {blocks.length ? (
        <div className="mt-9 border-t border-rule pt-5">
          <p className="eyebrow mb-3">Currently held</p>
          <ul className="space-y-2.5">
            {blocks.map((block) => (
              <BlockRow key={block.id} block={block} />
            ))}
          </ul>
        </div>
      ) : null}
      </div>
    </div>
  );
}

function BlockRow({ block }: { block: Block }) {
  const [state, formAction] = useActionState(removeBlock, idle);
  if (state.ok) return null;

  return (
    <li className="flex items-start justify-between gap-3 border-b border-rule-soft pb-2.5">
      <div className="min-w-0">
        <p className="num text-[13px] tracking-wide">
          {formatRange(block.startDate, block.endDate)}
        </p>
        {block.reason ? (
          <p className="truncate text-[12px] text-ink-faint">{block.reason}</p>
        ) : null}
      </div>
      <form action={formAction}>
        <input type="hidden" name="blockId" value={block.id} />
        <SubmitButton pendingLabel="…" className="btn-quiet !text-[11.5px]">
          Release
        </SubmitButton>
      </form>
    </li>
  );
}
