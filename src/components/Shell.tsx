import type { ReactNode } from "react";
import Link from "next/link";
import { Nav } from "./Nav";
import { Live } from "./Live";
import type { User } from "@/lib/schema";
import { getDict, getLocale, locales, dictionaries } from "@/lib/i18n";
import { setLocale } from "@/actions/locale";

export async function Shell({
  user,
  pendingCount,
  children,
}: {
  user: User;
  pendingCount?: number;
  children: ReactNode;
}) {
  const [t, locale] = await Promise.all([getDict(), getLocale()]);
  return (
    <div className="min-h-dvh">
      <Live />
      <Nav
        name={user.displayName ?? user.name ?? "You"}
        host={user.role === "host"}
        pendingCount={pendingCount}
      />
      <main className="mx-auto max-w-[1180px] px-6 pb-16 pt-6 sm:px-10">
        {children}
      </main>

      <footer className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-5 gap-y-2 px-6 pb-10 text-[11.5px] text-ink-faint sm:px-10">
        <Link href="/privacy" className="hover:text-orange">
          {t.common.privacy}
        </Link>
        <Link href="/usage" className="hover:text-orange">
          {t.common.houseRules}
        </Link>
        <span className="flex items-center gap-2">
          {locales.map((code) => (
            <form action={setLocale} key={code}>
              <input type="hidden" name="locale" value={code} />
              <button
                type="submit"
                className={
                  code === locale
                    ? "text-ink underline underline-offset-4"
                    : "hover:text-orange"
                }
              >
                {dictionaries[code].name}
              </button>
            </form>
          ))}
        </span>
      </footer>
    </div>
  );
}
