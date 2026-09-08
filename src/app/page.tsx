import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
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
    redirect("/stay");
  }

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      <header className="mx-auto w-full max-w-[1180px] px-6 py-7 sm:px-10">
        <span className="flex items-center gap-2.5">
          <Mark className="h-4 w-auto text-orange" />
          <span className="text-[13px] font-semibold tracking-[0.16em] uppercase">
            {APP_NAME}
          </span>
        </span>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-[520px]">
          <div className="fade-in relative">
            <Skyline className="w-full" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-paper to-transparent" />
          </div>

          <h1
            className="rise -mt-6 text-center text-display leading-[0.88] tight"
            style={{ animationDelay: "120ms" }}
          >
            Come stay
            <br />
            <em className="wonky not-italic text-orange">a while.</em>
          </h1>

          <div
            className="rise mt-10 flex flex-col items-center gap-3"
            style={{ animationDelay: "240ms" }}
          >
            <SignIn />
          </div>
        </div>
      </div>
    </main>
  );
}
