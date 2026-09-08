import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { currentUser, isHost } from "@/lib/session";
import { calendarConnected } from "@/lib/calendar";
import { SignIn } from "@/components/SignIn";
import { Skyline } from "@/components/Skyline";
import { Mark } from "@/components/ui";
import { APP_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function Landing() {
  const user = await currentUser();

  if (user) {
    if (!user.displayName || user.status === "profile") redirect("/welcome");
    if (user.status !== "approved") redirect("/lobby");

    if (isHost(user)) {
      // Ask for calendar access as part of signing in, not as a chore buried
      // in settings. The connect route marks that we've asked, so declining
      // doesn't drop the host back into the same consent screen.
      const [connected, jar] = await Promise.all([calendarConnected(), cookies()]);
      if (!connected && !jar.get("gcal_asked")) redirect("/api/google/connect");
      redirect("/host");
    }
    redirect("/stay");
  }

  return (
    <main className="flex flex-col">
      <div className="flex h-dvh flex-col">
      <header className="shrink-0 px-6 py-5 sm:px-10">
        <span className="flex items-center gap-2.5">
          <Mark className="h-4 w-auto text-orange" />
          <span className="text-[13px] font-semibold tracking-[0.16em] uppercase">
            {APP_NAME}
          </span>
        </span>
      </header>

      <div className="flex min-h-0 flex-1 items-center justify-center px-6 pb-8">
        <div className="flex w-full max-w-[460px] flex-col items-center">
          <div className="fade-in relative min-h-0 w-full">
            <Skyline className="mx-auto max-h-[42dvh] w-full" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-paper to-transparent" />
          </div>

          <h1
            className="rise -mt-4 text-center text-[clamp(2rem,7vw,3.4rem)] leading-[0.88] tight"
            style={{ animationDelay: "100ms" }}
          >
            Come stay
            <br />
            <em className="wonky not-italic text-orange">a while.</em>
          </h1>

          <div className="rise mt-7 w-full" style={{ animationDelay: "220ms" }}>
            <SignIn />
          </div>
        </div>
      </div>

        <footer className="shrink-0 pb-5 text-center text-[11.5px] text-ink-faint">
          <Link href="/privacy" className="hover:text-orange">
            Privacy
          </Link>
          <span className="px-2">·</span>
          <Link href="/usage" className="hover:text-orange">
            House rules
          </Link>
        </footer>
      </div>

      {/*
        Google's OAuth verification requires the homepage to describe what the
        app does and why it asks for the data it asks for. Kept below the fold
        so signing in is still the whole first screen.
      */}
      <section className="border-t border-rule bg-card/40">
        <div className="mx-auto max-w-[680px] px-6 py-16 sm:px-10">
          <h2 className="text-[1.6rem] leading-snug tight">
            What this is
          </h2>
          <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-ink-soft">
            <p>
              {APP_NAME} is a private booking page for one person&rsquo;s
              friends and family. Guests sign in, ask to be let in, and once the
              host approves them they can see which nights are free, request a
              stay of their own, bring up to two other people and leave a note.
              The host accepts or declines each request, and keeps dates for
              themselves when they need the room.
            </p>
            <p>
              <strong className="font-semibold text-ink">
                Why it asks for a Google account.
              </strong>{" "}
              Signing in with Google tells the site who you are — your name and
              email address — so the host knows whose booking is whose. That is
              the only thing it is used for.
            </p>
            <p>
              <strong className="font-semibold text-ink">
                Why it asks for Google Calendar.
              </strong>{" "}
              Only the host is asked for this, and only to write confirmed
              stays onto a calendar of their choosing and send an invitation to
              everyone on the booking. Cancelling a stay deletes that event
              again. The app never reads or changes anything else on the
              calendar, and guests are never asked for calendar access.
            </p>
            <p>
              Nothing is sold, advertised against, or shared beyond the services
              needed to run the site. The full detail is in the{" "}
              <Link
                href="/privacy"
                className="text-ink underline underline-offset-4"
              >
                privacy policy
              </Link>{" "}
              and the{" "}
              <Link
                href="/usage"
                className="text-ink underline underline-offset-4"
              >
                house rules
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
