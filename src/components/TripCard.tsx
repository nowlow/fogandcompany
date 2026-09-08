import type { ReactNode } from "react";
import { StatusChip } from "./ui";
import { formatRange, relativeToToday, toUTC } from "@/lib/dates";
import type { Trip, User } from "@/lib/schema";
import { getDict } from "@/lib/i18n";

export async function TripCard({
  trip,
  guest,
  actions,
  dim,
}: {
  trip: Trip;
  guest?: User | null;
  actions?: ReactNode;
  dim?: boolean;
}) {
  const t = await getDict();
  const month = new Intl.DateTimeFormat(t.intl, {
    month: "short",
    timeZone: "UTC",
  });
  const nights = Math.round(
    (Date.parse(`${trip.endDate}T00:00:00Z`) -
      Date.parse(`${trip.startDate}T00:00:00Z`)) /
      86400000,
  );
  const party = [
    guest ? (guest.displayName ?? guest.name ?? "—") : t.calendar.you,
    ...trip.companions.map((c) => c.name),
  ];
  const start = toUTC(trip.startDate);

  return (
    <article
      className={`sheet flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-6 ${
        dim ? "opacity-60" : ""
      }`}
    >
      <div className="flex shrink-0 flex-row items-baseline gap-2 border-rule sm:w-[74px] sm:flex-col sm:items-center sm:gap-0 sm:border-r sm:pr-5">
        <span className="num text-[34px] leading-none tracking-tight">
          {start.getUTCDate()}
        </span>
        <span className="eyebrow sm:mt-1">{month.format(start)}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h3 className="text-[1.25rem] leading-tight tight">
            {formatRange(trip.startDate, trip.endDate, t.intl)}
          </h3>
          <StatusChip
            status={trip.status}
            label={
              t.status[trip.status as keyof typeof t.status] ?? trip.status
            }
          />
        </div>

        <p className="num mt-1.5 text-[12.5px] tracking-wide text-ink-soft">
          {t.common.nights(nights)} ·{" "}
          {relativeToToday(trip.startDate, t.intl)}
        </p>

        <p className="mt-2 text-[13.5px] text-ink-soft">
          <span className="text-ink">{party.join(", ")}</span>
          {party.length > 1 ? ` · ${t.common.people(party.length)}` : ""}
        </p>

        {trip.note ? (
          <p className="mt-3 border-l-2 border-rule pl-3 text-[13.5px] leading-relaxed text-ink-soft italic">
            “{trip.note}”
          </p>
        ) : null}

        {trip.resolutionNote && trip.status !== "approved" ? (
          <p className="mt-3 text-[13px] leading-relaxed text-orange-deep">
            {trip.resolutionNote}
          </p>
        ) : null}

        {guest?.email ? (
          <p className="mt-2 truncate text-[12px] text-ink-faint">
            {guest.email}
            {trip.companions.some((c) => c.email)
              ? ` · ${trip.companions
                  .filter((c) => c.email)
                  .map((c) => c.email)
                  .join(", ")}`
              : ""}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
          {actions}
        </div>
      ) : null}
    </article>
  );
}
