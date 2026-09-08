import type { ReactNode } from "react";
import type { User } from "@/lib/schema";
import { getDict } from "@/lib/i18n";

export async function PersonCard({
  person,
  trips,
  actions,
  dim,
}: {
  person: User;
  trips?: number;
  actions?: ReactNode;
  dim?: boolean;
}) {
  const t = await getDict();
  const when = new Intl.DateTimeFormat(t.intl, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const initials = (person.displayName ?? person.name ?? "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <article
      className={`sheet flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5 ${dim ? "opacity-60" : ""}`}
    >
      <span className="num flex h-11 w-11 shrink-0 items-center justify-center border border-rule bg-paper text-[14px] tracking-tight">
        {initials}
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="text-[1.15rem] leading-tight tight">
          {person.displayName ?? person.name ?? t.people.unnamed}
          {person.role === "host" ? (
            <span className="eyebrow ml-2 !text-orange">{t.people.host}</span>
          ) : null}
        </h3>
        <p className="truncate text-[12.5px] text-ink-soft">{person.email}</p>
        {person.relationship ? (
          <p className="mt-1 text-[13px] text-ink-soft italic">
            “{person.relationship}”
          </p>
        ) : null}
        <p className="mt-1 text-[11.5px] text-ink-faint">
          {t.people.joined(when.format(person.createdAt))}
          {typeof trips === "number" ? ` · ${t.people.stays(trips)}` : ""}
        </p>
      </div>

      {actions ? <div className="shrink-0">{actions}</div> : null}
    </article>
  );
}
