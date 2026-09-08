import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { SignIn } from "@/components/SignIn";
import { Skyline } from "@/components/Skyline";
import { Mark, Eyebrow } from "@/components/ui";
import { APP_NAME, CITY } from "@/lib/constants";

export const dynamic = "force-dynamic";

const STEPS = [
  { n: "01", t: "Knock", d: "Sign in and tell us what to call you." },
  { n: "02", t: "Get let in", d: "The host opens the door. You'll get an email." },
  { n: "03", t: "Pick nights", d: "Free dates are yours. Bring up to two people." },
];

export default async function Landing() {
  const user = await currentUser();
  if (user) {
    if (!user.displayName || user.status === "profile") redirect("/welcome");
    if (user.status !== "approved") redirect("/lobby");
    redirect("/stay");
  }

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="mx-auto max-w-[1180px] px-6 sm:px-10">
        <header className="flex items-center justify-between py-7">
          <span className="flex items-center gap-2.5">
            <Mark className="h-4 w-auto text-orange" />
            <span className="text-[13px] font-semibold tracking-[0.16em] uppercase">
              {APP_NAME}
            </span>
          </span>
          <Eyebrow>Private</Eyebrow>
        </header>

        <div className="grid items-center gap-10 pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:pb-24">
          <div className="order-2 lg:order-1">
            <Eyebrow className="rise">
              By invitation · {CITY}, California
            </Eyebrow>

            <h1
              className="rise mt-5 text-mega leading-[0.86] tight"
              style={{ animationDelay: "80ms" }}
            >
              Come stay
              <br />
              <em className="wonky not-italic text-orange">a while.</em>
            </h1>

            <p
              className="rise mt-7 max-w-[38ch] text-[17px] leading-[1.6] text-ink-soft"
              style={{ animationDelay: "160ms" }}
            >
              This is where friends and family work out when they&rsquo;re
              coming. Take any nights that are still free, bring up to two
              people, and I&rsquo;ll confirm the dates.
            </p>

            <div className="rise mt-9" style={{ animationDelay: "240ms" }}>
              <SignIn />
              <p className="mt-4 max-w-[42ch] text-xs leading-relaxed text-ink-faint">
                Sign in, set your name, and wait for the host to let you in.
                Nothing is shared with anyone else.
              </p>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="fade-in relative mx-auto max-w-[420px] lg:max-w-none">
              <Skyline className="w-full border border-rule" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-paper to-transparent" />
            </div>
          </div>
        </div>

        <ol
          className="rise grid gap-px border border-rule bg-rule sm:grid-cols-3"
          style={{ animationDelay: "320ms" }}
        >
          {STEPS.map((step) => (
            <li key={step.n} className="bg-card p-6">
              <span className="num text-[11px] tracking-[0.2em] text-orange">
                {step.n}
              </span>
              <h2 className="mt-2 text-[1.35rem] tight">{step.t}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {step.d}
              </p>
            </li>
          ))}
        </ol>

        <footer className="flex flex-wrap items-center justify-between gap-3 py-8 text-[11.5px] text-ink-faint">
          <span>
            {APP_NAME} — a private guest book for {CITY}.
          </span>
          <span>Not indexed. Not public. Invitation only.</span>
        </footer>
      </div>
    </main>
  );
}
