import { LegalPage, Clause } from "@/components/Legal";
import { APP_NAME, CITY, HOST_EMAIL, MAX_COMPANIONS, MAX_NIGHTS } from "@/lib/constants";

export const metadata = { title: "House rules" };

export default function Usage() {
  return (
    <LegalPage title="House rules" updated="8 September 2026">
      <Clause heading="Invitation only">
        <p>
          {APP_NAME} is a private page for the host&rsquo;s friends and family.
          Signing in does not get you in — the host has to let you through, and
          may decline without giving a reason. Access is personal: don&rsquo;t
          pass your account to anyone else.
        </p>
      </Clause>

      <Clause heading="A booking is a request">
        <p>
          Picking dates asks the host for them. Nothing is settled until you get
          an email saying it is confirmed. Until then, treat flights and trains
          as your own risk.
        </p>
      </Clause>

      <Clause heading="The host has the last word">
        <p>
          The host can decline a request, cancel a confirmed stay, keep dates for
          themselves, or remove someone&rsquo;s access at any time. If dates are
          blocked over a stay that was already confirmed, that stay is cancelled
          and everyone on it is emailed.
        </p>
        <p>
          This is someone&rsquo;s spare room in {CITY}, not a hotel. There is no
          refund, because there is no payment.
        </p>
      </Clause>

      <Clause heading="Be straight about who is coming">
        <p>
          You may bring up to {MAX_COMPANIONS} other people, and you should name
          them when you book. Stays run to {MAX_NIGHTS} nights; longer than that,
          ask the host directly. Turning up with more people than you listed is
          the fastest way to lose the room.
        </p>
      </Clause>

      <Clause heading="Other people's dates">
        <p>
          You can see which nights are taken and roughly who has them, so that
          everyone can plan around each other. Don&rsquo;t use that to work out
          when anybody&rsquo;s home is empty, and don&rsquo;t share it outside
          the people on this page.
        </p>
      </Clause>

      <Clause heading="Cancel early">
        <p>
          If your plans change, cancel from your trips page rather than going
          quiet. It frees the nights for someone else and the host is told
          straight away.
        </p>
      </Clause>

      <Clause heading="No promises about the software">
        <p>
          This is a personal project, offered as-is. It may be down, it may lose
          an email, and it may be switched off entirely. Don&rsquo;t rely on it
          for anything that matters more than a bed for the weekend.
        </p>
      </Clause>

      <Clause heading="Questions">
        <p>
          Write to <a href={`mailto:${HOST_EMAIL}`}>{HOST_EMAIL}</a>.
        </p>
      </Clause>
    </LegalPage>
  );
}
