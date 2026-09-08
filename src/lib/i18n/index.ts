import { cache } from "react";
import { cookies, headers } from "next/headers";
import {
  dictionaries,
  isLocale,
  LOCALE_COOKIE,
  type Dict,
  type Locale,
} from "./dictionaries";

export * from "./dictionaries";

/** Highest-priority language the browser asked for, if we speak it. */
function fromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.startsWith("q="));
      return { tag: tag.toLowerCase(), q: q ? Number(q.slice(2)) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    if (tag.startsWith("fr")) return "fr";
    if (tag.startsWith("en")) return "en";
  }
  return null;
}

/** An explicit choice wins; otherwise follow the browser. */
export const getLocale = cache(async (): Promise<Locale> => {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return chosen;
  return fromAcceptLanguage((await headers()).get("accept-language")) ?? "en";
});

export const getDict = cache(async (): Promise<Dict> => {
  return dictionaries[await getLocale()];
});


