import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { Mark, Eyebrow } from "@/components/ui";
import { endSession } from "@/actions/auth";
import { APP_NAME, HOST_EMAIL } from "@/lib/constants";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";


export default async function Lobby() {
  const [user, t] = await Promise.all([requireUser(), getDict()]);
  if (!user.displayName || user.status === "profile") redirect("/welcome");
  if (user.status === "approved") redirect("/stay");

  const denied = user.status === "denied";

  return (
    <main className="mx-auto flex min-h-dvh max-w-[600px] flex-col justify-center px-6 py-16">
      <div className="rise">
        <span className="flex items-center gap-2.5">
          <Mark className="h-4 w-auto text-orange" />
          <span className="text-[12.5px] font-semibold tracking-[0.16em] uppercase">
            {APP_NAME}
          </span>
        </span>

        <div className="mt-12 flex items-start gap-6">
          <span
            className={`stamp mt-2 shrink-0 -rotate-6 ${denied ? "text-ink-faint" : "text-orange"}`}
          >
            {denied ? t.lobby.stampDenied : t.lobby.stampPending}
          </span>
          <div>
            <Eyebrow>{t.lobby.step}</Eyebrow>
            <h1 className="mt-2 text-display leading-[0.95] tight">
              {denied ? t.lobby.titleDenied : t.lobby.titleWaiting}
            </h1>
          </div>
        </div>

        <p className="mt-7 max-w-[46ch] text-[16.5px] leading-relaxed text-ink-soft">
          {denied ? (
            <>
              {t.lobby.deniedPre}{" "}
              <a className="underline underline-offset-4" href={`mailto:${HOST_EMAIL}`}>
                {HOST_EMAIL}
              </a>
              .
            </>
          ) : (
            t.lobby.waiting
          )}
        </p>

        <dl className="mt-10 grid gap-px border border-rule bg-rule sm:grid-cols-2">
          <div className="bg-card p-5">
            <dt className="eyebrow">{t.lobby.nameGiven}</dt>
            <dd className="mt-1.5 text-[17px]">{user.displayName}</dd>
          </div>
          <div className="bg-card p-5">
            <dt className="eyebrow">{t.lobby.signedInAs}</dt>
            <dd className="mt-1.5 truncate text-[17px]">{user.email}</dd>
          </div>
        </dl>

        <div className="mt-8 flex items-center gap-5 border-t border-rule pt-5">
          <Link href="/welcome" className="btn-quiet">
            {t.lobby.changeName}
          </Link>
          <form action={endSession}>
            <button type="submit" className="btn-quiet">
              {t.common.signOut}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
