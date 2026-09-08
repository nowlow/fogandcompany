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
    <main className="flex h-dvh flex-col overflow-hidden">
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
    </main>
  );
}
