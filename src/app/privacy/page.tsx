import { LegalPage, Clause } from "@/components/Legal";
import { APP_NAME, CITY, HOST_EMAIL, MAX_COMPANIONS } from "@/lib/constants";

export const metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy" updated="8 September 2026">
      <Clause heading="What this is">
        <p>
          {APP_NAME} is a private page one person runs so friends and family can
          arrange visits to {CITY}. It is not a business. Nothing here is sold,
          rented, advertised against, or fed to anyone&rsquo;s model.
        </p>
      </Clause>

      <Clause heading="What we keep">
        <p>
          <strong>From signing in:</strong> your name, email address and profile
          picture, handed over by Google or GitHub when you choose to use them.
          We never see your password.
        </p>
        <p>
          <strong>From you:</strong> the name you ask to be called, how you know
          the host if you say, the dates you request, the names and — if you add
          them — email addresses of up to {MAX_COMPANIONS} people you bring, and
          any note you write on a booking.
        </p>
        <p>
          <strong>Automatically:</strong> one cookie that keeps you signed in.
          There is no analytics, no tracking pixel, and no third-party
          advertising script anywhere on this site.
        </p>
      </Clause>

      <Clause heading="Who can see it">
        <p>
          <strong>The host</strong> sees everything you submit: your name, email,
          dates, companions and notes.
        </p>
        <p>
          <strong>Other guests</strong> see far less. On the calendar, a night
          someone else has taken shows only their first name and how many people
          are coming — never their email address, and never their note.
        </p>
        <p>
          <strong>People on your booking</strong> receive the confirmation email
          and the calendar invitation, so they will see the other addresses on
          the reservation, the same way any group invitation works.
        </p>
      </Clause>

      <Clause heading="Where it goes">
        <p>
          The site runs on <a href="https://vercel.com">Vercel</a>. The database
          is <a href="https://neon.com">Neon</a>, hosted in London. Email is sent
          through <a href="https://resend.com">Resend</a>. When the host accepts
          a stay, the dates and the names on it are written to their{" "}
          <strong>Google Calendar</strong> and an invitation goes to everyone on
          the booking.
        </p>
        <p>
          Those four companies process this data because the site cannot work
          without them. Nobody else receives it.
        </p>
      </Clause>

      <Clause heading="How long">
        <p>
          Your account and your bookings stay until you ask for them to go.
          Cancelled and declined trips are kept so both sides can see what
          happened.
        </p>
      </Clause>

      <Clause heading="Changing or deleting it">
        <p>
          Email{" "}
          <a href={`mailto:${HOST_EMAIL}`}>{HOST_EMAIL}</a> and ask. Your
          account, your bookings and your notes will be deleted, and any calendar
          invitations withdrawn. There is no form to fill in and no waiting
          period — it is one person with a database.
        </p>
        <p>
          You can also revoke this site&rsquo;s access from your{" "}
          <a href="https://myaccount.google.com/permissions">Google account</a>{" "}
          or your{" "}
          <a href="https://github.com/settings/applications">GitHub settings</a>{" "}
          at any time.
        </p>
      </Clause>

      <Clause heading="If something changes">
        <p>
          If what happens to your data ever changes meaningfully, the date at the
          top of this page changes with it.
        </p>
      </Clause>
    </LegalPage>
  );
}
