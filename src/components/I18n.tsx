"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  dictionaries,
  type Dict,
  type Locale,
} from "@/lib/i18n/dictionaries";
import { en } from "@/lib/i18n/en";

/**
 * The dictionary holds functions, which don't survive the server/client
 * boundary, so the server sends the locale and the client looks the
 * dictionary up from the same modules. Both languages ride along in the
 * bundle, which for two small objects is cheaper than the plumbing to avoid it.
 */
const Ctx = createContext<Dict>(en);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return <Ctx value={dictionaries[locale]}>{children}</Ctx>;
}

export function useT(): Dict {
  return useContext(Ctx);
}
