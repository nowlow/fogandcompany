import Link from "next/link";
import { requireHost } from "@/lib/session";
import { Shell } from "@/components/Shell";
import { AddressForm, CalendarPicker } from "@/components/SettingsForm";
import { Eyebrow, SectionHeading } from "@/components/ui";
import { getSettings } from "@/lib/settings";
import { calendarConnected, listCalendars, googleClient } from "@/lib/calendar";
import { disconnectCalendar } from "@/actions/host";
import { frontDeskCount } from "@/lib/counts";
import { enabledProviders } from "@/lib/auth";
import { HOST_EMAIL } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

const CALENDAR_MESSAGES: Record<string, string> = {
  connected: "Google Calendar is connected.",
  denied: "Google didn't grant access — nothing changed.",
  state: "That link expired. Try connecting again.",
  failed: "The connection failed. Check the server logs and try again.",
  "missing-client": "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET first.",
};

export default async function HostSettings({
  searchParams,
}: {
  searchParams: Promise<{ calendar?: string }>;
}) {
  const host = await requireHost();
  const { calendar: flash } = await searchParams;

  const [settings, connected, deskCount] = await Promise.all([
    getSettings(),
    calendarConnected(),
    frontDeskCount(),
  ]);
  const calendars = connected ? await listCalendars() : [];

  return (
    <Shell user={host} pendingCount={deskCount}>
      <h1 className="rise mb-8 text-[2.4rem] leading-none tight">
        Settings<em className="wonky not-italic text-orange">.</em>
      </h1>

      <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <SectionHeading label="Where to come" title="Your address" />
          <AddressForm
            address={settings.address ?? ""}
            addressNote={settings.addressNote ?? ""}
            welcomeNote={settings.welcomeNote ?? ""}
          />
        </section>

        <div className="space-y-12">
          <section>
            <SectionHeading label="Invitations" title="Google Calendar" />

            {flash ? (
              <p
                className={`mb-5 border-l-2 py-2 pl-3 text-[13px] ${
                  flash === "connected"
                    ? "border-bay text-bay"
                    : "border-orange text-orange-deep"
                }`}
              >
                {CALENDAR_MESSAGES[flash] ?? "Something went sideways."}
              </p>
            ) : null}

            {connected ? (
              <div className="space-y-5">
                <p className="text-[13.5px] leading-relaxed text-ink-soft">
                  Connected as{" "}
                  <span className="text-ink">
                    {settings.googleAccountEmail ?? "your Google account"}
                  </span>
                  . Accepting a stay creates an event and invites everyone on it;
                  cancelling deletes it.
                </p>

                <CalendarPicker
                  calendars={calendars}
                  selected={settings.calendarId}
                />

                <form action={disconnectCalendar}>
                  <button type="submit" className="btn-quiet">
                    Disconnect
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[13.5px] leading-relaxed text-ink-soft">
                  Connect a Google account so accepted stays appear on your
                  calendar and everyone gets an invitation.
                </p>
                {googleClient() ? (
                  <a href="/api/google/connect" className="btn inline-flex">
                    Connect Google Calendar
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
            <SectionHeading label="Wiring" title="What's switched on" />
            <dl className="divide-y divide-rule border-y border-rule">
              <Row
                label="Sign-in"
                value={
                  enabledProviders.length
                    ? enabledProviders.map((p) => p.name).join(" · ")
                    : "None configured"
                }
                ok={enabledProviders.length > 0}
              />
              <Row
                label="Email"
                value={
                  process.env.RESEND_API_KEY?.trim()
                    ? (process.env.EMAIL_FROM?.trim() ?? "onboarding@resend.dev")
                    : "RESEND_API_KEY missing"
                }
                ok={Boolean(process.env.RESEND_API_KEY)}
              />
              <Row
                label="Calendar"
                value={
                  connected
                    ? (settings.calendarName ?? "Primary calendar")
                    : "Not connected"
                }
                ok={connected}
              />
              <Row label="Host account" value={HOST_EMAIL} ok />
            </dl>
            <p className="mt-4 text-[12px] leading-relaxed text-ink-faint">
              Alerts about requests, cancellations and new people go to{" "}
              {HOST_EMAIL}.{" "}
              <Link href="/host" className="underline underline-offset-4">
                Back to the front desk
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
