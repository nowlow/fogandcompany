import { en, type Dict, type Locale } from "./en";
import { fr } from "./fr";

/**
 * Server-free so client components can import it. The server helpers that
 * need cookies and headers live in ./index.
 */
export type { Dict, Locale };
export const dictionaries: Record<Locale, Dict> = { en, fr };
export const locales: Locale[] = ["en", "fr"];
export const LOCALE_COOKIE = "locale";

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "fr";
}

export function dictFor(locale: string | null | undefined): Dict {
  return isLocale(locale) ? dictionaries[locale] : en;
}
