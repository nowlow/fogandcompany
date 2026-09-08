import { CITY } from "./constants";
import type { Dict } from "./i18n/dictionaries";
import type { Trip, User } from "./schema";

/** One description shared by the .ics file and the "add to calendar" links. */
export function describeTrip(trip: Trip, guest: User, t: Dict) {
  const names = [
    guest.displayName ?? guest.name ?? "",
    ...trip.companions.map((c) => c.name),
  ].filter(Boolean);
  const extras = names.length - 1;

  const description = [
    names.join(", "),
    trip.arrivalTravel ? `${t.trip.arrival}: ${trip.arrivalTravel}` : null,
    trip.departureTravel ? `${t.trip.departure}: ${trip.departureTravel}` : null,
    trip.note,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    title: `${names[0] || t.people.unnamed}${extras > 0 ? ` +${extras}` : ""}, ${CITY}`,
    description,
  };
}
