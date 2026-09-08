import { hostMail, sendMail, type Fact } from "./email";
import { appUrl, CITY, APP_NAME } from "./constants";
import { formatRange, nightsLabel, formatFull } from "./dates";
import type { Settings, Trip, User } from "./schema";

const guestUrl = appUrl("/trips");
const hostUrl = appUrl("/host");

function party(trip: Trip, guest: User): string {
  const names = [
    guest.displayName ?? guest.name ?? guest.email ?? "Guest",
    ...trip.companions.map((c) => c.name),
  ];
  return names.length > 1
    ? `${names.join(", ")} (${names.length} people)`
    : names[0];
}

function tripFacts(trip: Trip, guest: User): Fact[] {
  const facts: Fact[] = [
    { label: "Dates", value: formatRange(trip.startDate, trip.endDate) },
    {
      label: "Length",
      value: `${nightsLabel(trip.startDate, trip.endDate)} — arriving ${formatFull(trip.startDate)}, leaving ${formatFull(trip.endDate)}`,
    },
    { label: "Who", value: party(trip, guest) },
  ];
  if (trip.note) facts.push({ label: "Note", value: trip.note });
  return facts;
}

/** Everyone on the reservation who left an address. */
function partyEmails(trip: Trip, guest: User): string[] {
  return [guest.email, ...trip.companions.map((c) => c.email)].filter(
    (e): e is string => Boolean(e && e.includes("@")),
  );
}

/* ------------------------------ membership ------------------------------- */

export function hostNewMember(user: User) {
  return hostMail({
    subject: `${user.displayName ?? user.name ?? "Someone"} wants to visit`,
    heading: "Someone new knocked",
    intro: `${user.displayName ?? user.name} asked to join your ${CITY} page. Nobody can see the calendar until you let them in.`,
    facts: [
      { label: "Name", value: user.displayName ?? user.name ?? "—" },
      { label: "Signed in as", value: user.email ?? "—" },
      ...(user.relationship
        ? [{ label: "Says they are", value: user.relationship }]
        : []),
    ],
    cta: { label: "Review the request", url: appUrl("/host/people") },
    replyTo: user.email ?? undefined,
  });
}

export function memberApproved(user: User) {
  return sendMail({
    to: user.email ?? "",
    subject: `You're in — come visit ${CITY}`,
    heading: "You're in",
    intro: `Your account is approved. Pick the dates that suit you and send a request.`,
    paragraphs: [
      "Dates that are already taken are greyed out on the calendar. You can bring up to two other people and leave a note with anything worth knowing.",
    ],
    tone: "good",
    cta: { label: "Choose your dates", url: appUrl("/stay") },
  });
}

export function memberDenied(user: User) {
  return sendMail({
    to: user.email ?? "",
    subject: `About your request to ${APP_NAME}`,
    heading: "Not this time",
    intro: "Your request to join was declined. If you think that is a mistake, reply to this email.",
  });
}

/* -------------------------------- requests ------------------------------- */

export function hostTripRequested(trip: Trip, guest: User) {
  return hostMail({
    subject: `${guest.displayName ?? guest.name} wants ${formatRange(trip.startDate, trip.endDate)}`,
    heading: "New stay request",
    intro: `${guest.displayName ?? guest.name} asked for ${nightsLabel(trip.startDate, trip.endDate)}.`,
    facts: tripFacts(trip, guest),
    cta: { label: "Accept or decline", url: hostUrl },
    replyTo: guest.email ?? undefined,
  });
}

export function guestTripReceived(trip: Trip, guest: User) {
  return sendMail({
    to: guest.email ?? "",
    subject: `Request sent — ${formatRange(trip.startDate, trip.endDate)}`,
    heading: "Request sent",
    intro: "Your dates are held while the host has a look. You'll get an email either way.",
    facts: tripFacts(trip, guest),
    cta: { label: "See your trips", url: guestUrl },
  });
}

export function hostTripUpdated(trip: Trip, guest: User, previous: Trip) {
  const changedDates =
    previous.startDate !== trip.startDate || previous.endDate !== trip.endDate;
  return hostMail({
    subject: `${guest.displayName ?? guest.name} changed their request`,
    heading: "A request was edited",
    intro: changedDates
      ? `Moved from ${formatRange(previous.startDate, previous.endDate)} to ${formatRange(trip.startDate, trip.endDate)}.`
      : "The details changed, the dates did not.",
    facts: tripFacts(trip, guest),
    cta: { label: "Review it", url: hostUrl },
    replyTo: guest.email ?? undefined,
  });
}

export function guestTripApproved(
  trip: Trip,
  guest: User,
  settings: Settings,
  calendarSynced: boolean,
) {
  const facts = tripFacts(trip, guest);
  if (settings.address)
    facts.push({ label: "Where", value: settings.address });
  if (settings.addressNote)
    facts.push({ label: "Getting in", value: settings.addressNote });

  return sendMail({
    to: partyEmails(trip, guest),
    subject: `Confirmed — ${formatRange(trip.startDate, trip.endDate)} in ${CITY}`,
    heading: "You're booked",
    intro: `See you on ${formatFull(trip.startDate)}.`,
    facts,
    paragraphs: calendarSynced
      ? ["A calendar invitation is on its way to everyone on the reservation."]
      : [],
    tone: "good",
    cta: { label: "See your trip", url: guestUrl },
  });
}

export function guestTripDenied(trip: Trip, guest: User, reason?: string | null) {
  return sendMail({
    to: guest.email ?? "",
    subject: `About ${formatRange(trip.startDate, trip.endDate)}`,
    heading: "Those dates won't work",
    intro: reason?.trim()
      ? reason.trim()
      : "The host can't host those particular dates. Other dates on the calendar are still open.",
    facts: [
      { label: "Dates", value: formatRange(trip.startDate, trip.endDate) },
    ],
    cta: { label: "Try other dates", url: appUrl("/stay") },
  });
}

export function hostTripCancelled(trip: Trip, guest: User, reason?: string | null) {
  const wasConfirmed = Boolean(trip.calendarEventId);
  return hostMail({
    subject: `${guest.displayName ?? guest.name} cancelled ${formatRange(trip.startDate, trip.endDate)}`,
    heading: wasConfirmed ? "A confirmed stay was cancelled" : "A request was withdrawn",
    intro: `${guest.displayName ?? guest.name} cancelled. Those nights are open again.`,
    facts: [
      ...tripFacts(trip, guest),
      ...(reason?.trim() ? [{ label: "Reason", value: reason.trim() }] : []),
    ],
    tone: "warn",
    cta: { label: "Open the calendar", url: hostUrl },
    replyTo: guest.email ?? undefined,
  });
}

export function guestTripCancelledByHost(
  trip: Trip,
  guest: User,
  reason?: string | null,
) {
  return sendMail({
    to: partyEmails(trip, guest),
    subject: `Cancelled — ${formatRange(trip.startDate, trip.endDate)}`,
    heading: "Your stay was cancelled",
    intro: reason?.trim()
      ? reason.trim()
      : "Something came up on the host's side and these dates are no longer available.",
    facts: [
      { label: "Dates", value: formatRange(trip.startDate, trip.endDate) },
      { label: "Who", value: party(trip, guest) },
    ],
    paragraphs: [
      "Any calendar invitation for these dates has been removed. The rest of the calendar is still open, so pick another window whenever you like.",
    ],
    tone: "warn",
    cta: { label: "Pick new dates", url: appUrl("/stay") },
  });
}

/* -------------------------------- updates -------------------------------- */

export function guestAddressChanged(
  trip: Trip,
  guest: User,
  settings: Settings,
) {
  return sendMail({
    to: partyEmails(trip, guest),
    subject: `New address for your ${CITY} stay`,
    heading: "The address changed",
    intro: `Where to go for ${formatRange(trip.startDate, trip.endDate)}:`,
    facts: [
      { label: "Address", value: settings.address ?? "—" },
      ...(settings.addressNote
        ? [{ label: "Getting in", value: settings.addressNote }]
        : []),
    ],
    cta: { label: "See your trip", url: guestUrl },
  });
}
