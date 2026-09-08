import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { WelcomeForm } from "@/components/WelcomeForm";
import { Mark, Eyebrow } from "@/components/ui";
import { endSession } from "@/actions/auth";
import { APP_NAME, CITY } from "@/lib/constants";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";


export default async function Welcome() {
  const [user, t] = await Promise.all([requireUser(), getDict()]);
  if (user.displayName && user.status === "approved") redirect("/stay");

  return (
    <main className="mx-auto flex min-h-dvh max-w-[560px] flex-col justify-center px-6 py-16">
      <div className="rise">
        <span className="flex items-center gap-2.5">
          <Mark className="h-4 w-auto text-orange" />
          <span className="text-[12.5px] font-semibold tracking-[0.16em] uppercase">
            {APP_NAME}
          </span>
        </span>

        <Eyebrow className="mt-10">{t.welcome.step}</Eyebrow>
        <h1 className="mt-3 text-display leading-[0.95] tight">
          {t.welcome.title1}
          <br />
          <em className="wonky not-italic text-orange">{t.welcome.title2}</em>
        </h1>
        <p className="mt-5 max-w-[40ch] leading-relaxed text-ink-soft">
          {t.welcome.lede(CITY)}
        </p>

        <WelcomeForm
          defaultName={user.displayName ?? user.name ?? ""}
          defaultRelationship={user.relationship ?? ""}
          redirectTo={user.status === "approved" ? "/stay" : "/lobby"}
        />

        <div className="mt-10 flex items-center justify-between border-t border-rule pt-4 text-xs text-ink-faint">
          <span>{t.welcome.signedInAs(user.email ?? "")}</span>
          <form action={endSession}>
            <button type="submit" className="btn-quiet">
              {t.welcome.notYou}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
