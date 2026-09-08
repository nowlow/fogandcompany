import { LegalPage, Clause } from "@/components/Legal";
import { APP_NAME, CITY, HOST_EMAIL, MAX_COMPANIONS } from "@/lib/constants";
import { getDict } from "@/lib/i18n";


export async function generateMetadata() {
  const t = await getDict();
  return { title: t.common.privacy };
}

export default async function Privacy() {
  const t = await getDict();
  if (t.locale === "fr") return <PrivacyFr />;
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
          the host if you say, the dates you request, the names of up to{" "}
          {MAX_COMPANIONS} people you bring, their email addresses if you add
          them, and
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
          are coming. Never their email address, and never their note.
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
          period. It is one person with a database.
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

async function PrivacyFr() {
  return (
    <LegalPage title="Confidentialité" updated="8 septembre 2026">
      <Clause heading="Ce que c'est">
        <p>
          {APP_NAME} est une page privée qu&rsquo;une seule personne gère pour
          que ses amis et sa famille organisent leurs visites à {CITY}. Ce
          n&rsquo;est pas une entreprise. Rien n&rsquo;est vendu, loué, exploité
          à des fins publicitaires, ni donné à entraîner le modèle de qui que ce
          soit.
        </p>
      </Clause>

      <Clause heading="Ce qui est conservé">
        <p>
          <strong>À la connexion :</strong> ton nom, ton adresse e-mail et ta
          photo de profil, transmis par Google ou GitHub quand tu choisis de les
          utiliser. Ton mot de passe n&rsquo;est jamais vu.
        </p>
        <p>
          <strong>De toi :</strong> le nom que tu veux qu&rsquo;on utilise,
          comment tu connais l&rsquo;hôte si tu le dis, les dates que tu
          demandes, les noms et, si tu les ajoutes, les adresses e-mail des{" "}
          {MAX_COMPANIONS} personnes maximum que tu amènes, et le mot que tu
          laisses sur une réservation.
        </p>
        <p>
          <strong>Automatiquement :</strong> un seul cookie, celui qui te garde
          connecté. Aucun outil de mesure d&rsquo;audience, aucun pixel de
          suivi, aucun script publicitaire tiers nulle part sur ce site.
        </p>
      </Clause>

      <Clause heading="Qui peut le voir">
        <p>
          <strong>L&rsquo;hôte</strong> voit tout ce que tu envoies : ton nom,
          ton e-mail, tes dates, tes accompagnants et tes mots.
        </p>
        <p>
          <strong>Les autres invités</strong> voient beaucoup moins. Sur le
          calendrier, une nuit prise par quelqu&rsquo;un d&rsquo;autre
          n&rsquo;affiche que son prénom et le nombre de personnes, jamais son
          adresse e-mail, jamais son mot.
        </p>
        <p>
          <strong>Les personnes de ta réservation</strong> reçoivent l&rsquo;e-mail
          de confirmation et l&rsquo;invitation d&rsquo;agenda : elles verront
          donc les autres adresses de la réservation, comme dans n&rsquo;importe
          quelle invitation de groupe.
        </p>
      </Clause>

      <Clause heading="Où ça va">
        <p>
          Le site tourne sur <a href="https://vercel.com">Vercel</a>. La base de
          données est <a href="https://neon.com">Neon</a>, hébergée à Londres.
          Les e-mails passent par <a href="https://resend.com">Resend</a>. Quand
          l&rsquo;hôte accepte un séjour, les dates et les noms sont écrits dans
          son <strong>Google Agenda</strong> et une invitation part vers toutes
          les personnes de la réservation.
        </p>
        <p>
          Ces quatre sociétés traitent ces données parce que le site ne peut pas
          fonctionner sans elles. Personne d&rsquo;autre ne les reçoit.
        </p>
      </Clause>

      <Clause heading="Combien de temps">
        <p>
          Ton compte et tes réservations restent jusqu&rsquo;à ce que tu demandes
          leur suppression. Les séjours annulés et refusés sont conservés pour
          que les deux côtés puissent voir ce qui s&rsquo;est passé.
        </p>
      </Clause>

      <Clause heading="Modifier ou supprimer">
        <p>
          Écris à <a href={`mailto:${HOST_EMAIL}`}>{HOST_EMAIL}</a> et demande.
          Ton compte, tes réservations et tes mots seront supprimés, et les
          invitations d&rsquo;agenda retirées. Il n&rsquo;y a pas de formulaire
          ni de délai : c&rsquo;est une personne avec une base de données.
        </p>
        <p>
          Tu peux aussi révoquer l&rsquo;accès de ce site depuis ton{" "}
          <a href="https://myaccount.google.com/permissions">compte Google</a> ou
          tes{" "}
          <a href="https://github.com/settings/applications">réglages GitHub</a>{" "}
          à tout moment.
        </p>
      </Clause>

      <Clause heading="Si quelque chose change">
        <p>
          Si ce qui arrive à tes données change de façon notable, la date en haut
          de cette page change avec.
        </p>
      </Clause>
    </LegalPage>
  );
}
