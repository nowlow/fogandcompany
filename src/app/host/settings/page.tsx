import Link from "next/link";
import { requireHost } from "@/lib/session";
import { Shell } from "@/components/Shell";
import { AddressForm, CalendarPicker, TestEmail } from "@/components/SettingsForm";
import { Eyebrow, SectionHeading } from "@/components/ui";
import { getSettings } from "@/lib/settings";
import { calendarConnected, listCalendars, googleClient } from "@/lib/calendar";
import { disconnectCalendar } from "@/actions/host";
import { frontDeskCount } from "@/lib/counts";
import { enabledProviders } from "@/lib/auth";
import { HOST_EMAIL } from "@/lib/constants";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";



export async function generateMetadata() {
  const t = await getDict();
  return { title: t.settings.title };
}

export default async function HostSettings({
  searchParams,
}: {
  searchParams: Promise<{ calendar?: string }>;
}) {
  const host = await requireHost();
  const { calendar: flash } = await searchParams;

  const [t, settings, connected, deskCount] = await Promise.all([
    getDict(),
    getSettings(),
    calendarConnected(),
    frontDeskCount(),
  ]);
  const calendars = connected ? await listCalendars() : [];

  return (
    <Shell user={host} pendingCount={deskCount}>
      <h1 className="rise mb-8 text-[2.4rem] leading-none tight">
        {t.settings.title}<em className="wonky not-italic text-orange">.</em>
      </h1>

      <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <SectionHeading title={t.settings.addressSection} />
          <AddressForm
            address={settings.address ?? ""}
            addressNote={settings.addressNote ?? ""}
            welcomeNote={settings.welcomeNote ?? ""}
          />
        </section>

        <div className="space-y-12">
          <section>
            <SectionHeading title={t.settings.calendarSection} />

            {flash ? (
              <p
                className={`mb-5 border-l-2 py-2 pl-3 text-[13px] ${
                  flash === "connected"
                    ? "border-bay text-bay"
                    : "border-orange text-orange-deep"
                }`}
              >
                {t.settings.calendarFlash[flash] ?? t.common.somethingWrong}
              </p>
            ) : null}

            {connected ? (
              <div className="space-y-5">
                <p className="text-[13.5px] leading-relaxed text-ink-soft">
                  {t.settings.connectedAs}{" "}
                  <span className="text-ink">
                    {settings.googleAccountEmail ?? "Google"}
                  </span>
                  . {t.settings.connectedBody}
                </p>

                <CalendarPicker
                  calendars={calendars}
                  selected={settings.calendarId}
                />

                <form action={disconnectCalendar}>
                  <button type="submit" className="btn-quiet">
                    {t.settings.disconnect}
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[13.5px] leading-relaxed text-ink-soft">
                  {t.settings.connectBody}
                </p>
                {googleClient() ? (
                  <a href="/api/google/connect" className="btn inline-flex">
                    {t.settings.connect}
                  </a>
                ) : (
                  <p className="border-l-2 border-orange py-2 pl-3 text-[13px] text-orange-deep">
                    Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the
                    environment first.
                  </p>
                )}
              </div>
            )}
          </section>

          <section>
            <SectionHeading title={t.settings.testEmail} />
            <TestEmail hostEmail={HOST_EMAIL} />
          </section>

          <section>
            <SectionHeading title={t.settings.wiring} />
            <dl className="divide-y divide-rule border-y border-rule">
              <Row
                label={t.settings.signIn}
                value={
                  enabledProviders.length
                    ? enabledProviders.map((p) => p.name).join(" · ")
                    : t.settings.noneConfigured
                }
                ok={enabledProviders.length > 0}
              />
              <Row
                label={t.settings.email}
                value={
                  process.env.RESEND_API_KEY?.trim()
                    ? (process.env.EMAIL_FROM?.trim() ?? "onboarding@resend.dev")
                    : "RESEND_API_KEY missing"
                }
                ok={Boolean(process.env.RESEND_API_KEY)}
              />
              <Row
                label={t.settings.calendar}
                value={
                  connected
                    ? (settings.calendarName ?? t.settings.primaryCalendar)
                    : t.settings.notConnected
                }
                ok={connected}
              />
              <Row label={t.settings.hostAccount} value={HOST_EMAIL} ok />
            </dl>
            <p className="mt-4 text-[12px] leading-relaxed text-ink-faint">
              {t.settings.alertsGoTo(HOST_EMAIL)}{" "}
              <Link href="/host" className="underline underline-offset-4">
                {t.settings.backToDesk}
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </Shell>
  );
}

function Row({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="eyebrow">{label}</dt>
      <dd
        className={`truncate text-right text-[13px] ${ok ? "text-ink" : "text-orange-deep"}`}
      >
        {value}
      </dd>
    </div>
  );
}
