import { hostMail, sendMail, type Fact } from "./email";
import { appUrl, CITY, APP_NAME } from "./constants";
import { formatRange, nightsBetween, formatFull } from "./dates";
import { dictFor, getDict, type Dict } from "./i18n";
import type { Settings, Trip, User } from "./schema";

const guestUrl = appUrl("/trips");
const hostUrl = appUrl("/host");

/** Whatever language this person reads. */
const forGuest = (guest: User): Dict => dictFor(guest.locale);

function nights(trip: Trip, t: Dict): string {
  return t.common.nights(nightsBetween(trip.startDate, trip.endDate));
}

function party(trip: Trip, guest: User, t: Dict): string {
  const names = [
    guest.displayName ?? guest.name ?? guest.email ?? t.people.unnamed,
    ...trip.companions.map((c) => c.name),
  ];
  return names.length > 1
    ? `${names.join(", ")} (${t.common.people(names.length)})`
    : names[0];
}

function tripFacts(trip: Trip, guest: User, t: Dict): Fact[] {
  const facts: Fact[] = [
    {
      label: t.email.dates,
      value: formatRange(trip.startDate, trip.endDate, t.intl),
    },
    {
      label: t.email.length,
      value: t.email.lengthValue(
        nights(trip, t),
        formatFull(trip.startDate, t.intl),
        formatFull(trip.endDate, t.intl),
      ),
    },
    { label: t.email.who, value: party(trip, guest, t) },
  ];
  if (trip.arrivalTravel)
    facts.push({ label: t.trip.arrival, value: trip.arrivalTravel });
  if (trip.departureTravel)
    facts.push({ label: t.trip.departure, value: trip.departureTravel });
  if (trip.note) facts.push({ label: t.email.note, value: trip.note });
  return facts;
}

/** Everyone on the reservation who left an address. */
function partyEmails(trip: Trip, guest: User): string[] {
  return [guest.email, ...trip.companions.map((c) => c.email)].filter(
    (e): e is string => Boolean(e && e.includes("@")),
  );
}

const footer = (t: Dict) => t.email.footer(APP_NAME, CITY);
const named = (u: User, t: Dict) =>
  u.displayName ?? u.name ?? u.email ?? t.people.unnamed;

/* ------------------------------ membership ------------------------------- */

export async function hostNewMember(user: User) {
  const t = await getDict();
  return hostMail({
    subject: t.email.newMemberSubject(named(user, t)),
    heading: t.email.newMemberHeading,
    intro: t.email.newMemberIntro(named(user, t), CITY),
    facts: [
      { label: t.email.name, value: named(user, t) },
      { label: t.email.signedInAs, value: user.email ?? t.people.unnamed },
      ...(user.relationship
        ? [{ label: t.email.saysTheyAre, value: user.relationship }]
        : []),
    ],
    cta: { label: t.email.reviewRequest, url: appUrl("/host/people") },
    replyTo: user.email ?? undefined,
    footer: footer(t),
  });
}

export function memberApproved(user: User) {
  const t = forGuest(user);
  return sendMail({
    to: user.email ?? "",
    subject: t.email.approvedSubject(CITY),
    heading: t.email.approvedHeading,
    intro: t.email.approvedIntro,
    paragraphs: [t.email.approvedBody],
    tone: "good",
    cta: { label: t.email.chooseDates, url: appUrl("/stay") },
    footer: footer(t),
  });
}

export function memberDenied(user: User) {
  const t = forGuest(user);
  return sendMail({
    to: user.email ?? "",
    subject: t.email.deniedSubject(APP_NAME),
    heading: t.email.deniedHeading,
    intro: t.email.deniedIntro,
    footer: footer(t),
  });
}

/* -------------------------------- requests ------------------------------- */

export async function hostTripRequested(trip: Trip, guest: User) {
  const t = await getDict();
  return hostMail({
    subject: t.email.requestedSubject(
      named(guest, t),
      formatRange(trip.startDate, trip.endDate, t.intl),
    ),
    heading: t.email.requestedHeading,
    intro: t.email.requestedIntro(named(guest, t), nights(trip, t)),
    facts: tripFacts(trip, guest, t),
    cta: { label: t.email.acceptOrDecline, url: hostUrl },
    replyTo: guest.email ?? undefined,
    footer: footer(t),
  });
}

export function guestTripReceived(trip: Trip, guest: User) {
  const t = forGuest(guest);
  return sendMail({
    to: guest.email ?? "",
    subject: t.email.receivedSubject(
      formatRange(trip.startDate, trip.endDate, t.intl),
    ),
    heading: t.email.receivedHeading,
    intro: t.email.receivedIntro,
    facts: tripFacts(trip, guest, t),
    cta: { label: t.email.seeYourTrips, url: guestUrl },
    footer: footer(t),
  });
}

export async function hostTripUpdated(trip: Trip, guest: User, previous: Trip) {
  const t = await getDict();
  const movedDates =
    previous.startDate !== trip.startDate || previous.endDate !== trip.endDate;
  return hostMail({
    subject: t.email.updatedSubject(named(guest, t)),
    heading: t.email.updatedHeading,
    intro: movedDates
      ? t.email.updatedMoved(
          formatRange(previous.startDate, previous.endDate, t.intl),
          formatRange(trip.startDate, trip.endDate, t.intl),
        )
      : t.email.updatedSame,
    facts: tripFacts(trip, guest, t),
    cta: { label: t.email.reviewIt, url: hostUrl },
    replyTo: guest.email ?? undefined,
    footer: footer(t),
  });
}

export function guestTripApproved(
  trip: Trip,
  guest: User,
  settings: Settings,
  calendarSynced: boolean,
) {
  const t = forGuest(guest);
  const facts = tripFacts(trip, guest, t);
  if (settings.address)
    facts.push({ label: t.email.where, value: settings.address });
  if (settings.addressNote)
    facts.push({ label: t.email.gettingIn, value: settings.addressNote });

  return sendMail({
    to: partyEmails(trip, guest),
    subject: t.email.confirmedSubject(
      formatRange(trip.startDate, trip.endDate, t.intl),
      CITY,
    ),
    heading: t.email.confirmedHeading,
    intro: t.email.confirmedIntro(formatFull(trip.startDate, t.intl)),
    facts,
    paragraphs: calendarSynced ? [t.email.confirmedCalendar] : [],
    tone: "good",
    cta: { label: t.email.seeYourTrip, url: guestUrl },
    footer: footer(t),
  });
}

export function guestTripDenied(trip: Trip, guest: User, reason?: string | null) {
  const t = forGuest(guest);
  return sendMail({
    to: guest.email ?? "",
    subject: t.email.declinedSubject(
      formatRange(trip.startDate, trip.endDate, t.intl),
    ),
    heading: t.email.declinedHeading,
    intro: reason?.trim() ? reason.trim() : t.email.declinedIntro,
    facts: [
      {
        label: t.email.dates,
        value: formatRange(trip.startDate, trip.endDate, t.intl),
      },
    ],
    cta: { label: t.email.tryOther, url: appUrl("/stay") },
    footer: footer(t),
  });
}

export async function hostTripCancelled(
  trip: Trip,
  guest: User,
  reason?: string | null,
) {
  const t = await getDict();
  const wasConfirmed = Boolean(trip.calendarEventId);
  return hostMail({
    subject: t.email.cancelledSubject(
      named(guest, t),
      formatRange(trip.startDate, trip.endDate, t.intl),
    ),
    heading: wasConfirmed
      ? t.email.cancelledHeadingConfirmed
      : t.email.cancelledHeadingRequest,
    intro: t.email.cancelledIntro(named(guest, t)),
    facts: [
      ...tripFacts(trip, guest, t),
      ...(reason?.trim()
        ? [{ label: t.email.reason, value: reason.trim() }]
        : []),
    ],
    tone: "warn",
    cta: { label: t.email.openCalendar, url: hostUrl },
    replyTo: guest.email ?? undefined,
    footer: footer(t),
  });
}

export function guestTripCancelledByHost(
  trip: Trip,
  guest: User,
  reason?: string | null,
) {
  const t = forGuest(guest);
  return sendMail({
    to: partyEmails(trip, guest),
    subject: t.email.byHostSubject(
      formatRange(trip.startDate, trip.endDate, t.intl),
    ),
    heading: t.email.byHostHeading,
    intro: reason?.trim() ? reason.trim() : t.email.byHostIntro,
    facts: [
      {
        label: t.email.dates,
        value: formatRange(trip.startDate, trip.endDate, t.intl),
      },
      { label: t.email.who, value: party(trip, guest, t) },
    ],
    paragraphs: [t.email.byHostBody],
    tone: "warn",
    cta: { label: t.email.pickNew, url: appUrl("/stay") },
    footer: footer(t),
  });
}

/* -------------------------------- updates -------------------------------- */

export function guestAddressChanged(
  trip: Trip,
  guest: User,
  settings: Settings,
) {
  const t = forGuest(guest);
  return sendMail({
    to: partyEmails(trip, guest),
    subject: t.email.addressSubject(CITY),
    heading: t.email.addressHeading,
    intro: t.email.addressIntro(
      formatRange(trip.startDate, trip.endDate, t.intl),
    ),
    facts: [
      { label: t.email.address, value: settings.address ?? "" },
      ...(settings.addressNote
        ? [{ label: t.email.gettingIn, value: settings.addressNote }]
        : []),
    ],
    cta: { label: t.email.seeYourTrip, url: guestUrl },
    footer: footer(t),
  });
}
