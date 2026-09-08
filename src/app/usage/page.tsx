import { LegalPage, Clause } from "@/components/Legal";
import { APP_NAME, CITY, HOST_EMAIL, MAX_COMPANIONS, MAX_NIGHTS } from "@/lib/constants";
import { getDict } from "@/lib/i18n";

export default async function Usage() {
  const t = await getDict();
  if (t.locale === "fr") return <UsageFr />;
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

async function UsageFr() {
  return (
    <LegalPage title="Règles de la maison" updated="8 septembre 2026">
      <Clause heading="Sur invitation seulement">
        <p>
          {APP_NAME} est une page privée pour les amis et la famille de
          l&rsquo;hôte. Se connecter ne suffit pas à entrer : l&rsquo;hôte doit
          t&rsquo;ouvrir, et peut refuser sans donner de raison.
          L&rsquo;accès est personnel — ne passe ton compte à personne.
        </p>
      </Clause>

      <Clause heading="Une réservation est une demande">
        <p>
          Choisir des dates, c&rsquo;est les demander à l&rsquo;hôte. Rien
          n&rsquo;est acquis tant que tu n&rsquo;as pas reçu l&rsquo;e-mail de
          confirmation. D&rsquo;ici là, les billets d&rsquo;avion ou de train
          sont à tes risques.
        </p>
      </Clause>

      <Clause heading="L'hôte a le dernier mot">
        <p>
          L&rsquo;hôte peut refuser une demande, annuler un séjour confirmé,
          garder des dates pour lui ou retirer l&rsquo;accès à quelqu&rsquo;un, à
          tout moment. Si des dates sont bloquées par-dessus un séjour déjà
          confirmé, ce séjour est annulé et toutes les personnes concernées
          reçoivent un e-mail.
        </p>
        <p>
          C&rsquo;est la chambre d&rsquo;amis de quelqu&rsquo;un à {CITY}, pas un
          hôtel. Il n&rsquo;y a pas de remboursement, parce qu&rsquo;il n&rsquo;y
          a pas de paiement.
        </p>
      </Clause>

      <Clause heading="Sois honnête sur qui vient">
        <p>
          Tu peux amener jusqu&rsquo;à {MAX_COMPANIONS} personnes, et tu devrais
          les nommer au moment de réserver. Les séjours vont jusqu&rsquo;à{" "}
          {MAX_NIGHTS} nuits ; au-delà, parles-en directement à l&rsquo;hôte.
          Arriver avec plus de monde que prévu est le moyen le plus rapide de
          perdre la chambre.
        </p>
      </Clause>

      <Clause heading="Les dates des autres">
        <p>
          Tu vois quelles nuits sont prises et à peu près par qui, pour que tout
          le monde puisse s&rsquo;organiser. Ne t&rsquo;en sers pas pour deviner
          quand le logement de quelqu&rsquo;un est vide, et ne le partage pas
          en dehors des gens de cette page.
        </p>
      </Clause>

      <Clause heading="Annule tôt">
        <p>
          Si tes plans changent, annule depuis ta page de séjours plutôt que de
          disparaître. Ça libère les nuits pour quelqu&rsquo;un d&rsquo;autre et
          l&rsquo;hôte est prévenu tout de suite.
        </p>
      </Clause>

      <Clause heading="Aucune promesse sur le logiciel">
        <p>
          C&rsquo;est un projet personnel, fourni tel quel. Il peut tomber en
          panne, perdre un e-mail, ou être éteint complètement. Ne compte pas
          dessus pour quoi que ce soit de plus important qu&rsquo;un lit pour le
          week-end.
        </p>
      </Clause>

      <Clause heading="Questions">
        <p>
          Écris à <a href={`mailto:${HOST_EMAIL}`}>{HOST_EMAIL}</a>.
        </p>
      </Clause>
    </LegalPage>
  );
}
