import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { Mark, Eyebrow } from "@/components/ui";
import { endSession } from "@/actions/auth";
import { APP_NAME, HOST_EMAIL } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Waiting room" };

export default async function Lobby() {
  const user = await requireUser();
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
            {denied ? "Declined" : "Pending"}
          </span>
          <div>
            <Eyebrow>Step two of two</Eyebrow>
            <h1 className="mt-2 text-display leading-[0.95] tight">
              {denied ? "Not this time." : "Hang tight."}
            </h1>
          </div>
        </div>

        <p className="mt-7 max-w-[46ch] text-[16.5px] leading-relaxed text-ink-soft">
          {denied ? (
            <>
              Your request to join wasn&rsquo;t accepted. If that looks like a
              mistake, write to{" "}
              <a className="underline underline-offset-4" href={`mailto:${HOST_EMAIL}`}>
                {HOST_EMAIL}
              </a>
              .
            </>
          ) : (
            <>
              The host has been emailed and needs to let you in before you can
              see the calendar. You&rsquo;ll get an email the moment that
              happens — nothing else to do.
            </>
          )}
        </p>

        <dl className="mt-10 grid gap-px border border-rule bg-rule sm:grid-cols-2">
          <div className="bg-card p-5">
            <dt className="eyebrow">Name given</dt>
            <dd className="mt-1.5 text-[17px]">{user.displayName}</dd>
          </div>
          <div className="bg-card p-5">
            <dt className="eyebrow">Signed in as</dt>
            <dd className="mt-1.5 truncate text-[17px]">{user.email}</dd>
          </div>
        </dl>

        <div className="mt-8 flex items-center gap-5 border-t border-rule pt-5">
          <Link href="/welcome" className="btn-quiet">
            Change my name
          </Link>
          <form action={endSession}>
            <button type="submit" className="btn-quiet">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
