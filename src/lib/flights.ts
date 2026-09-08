/**
 * Turns "AF083" into "Air France 83" plus a link to a live tracker.
 *
 * Deliberately no API call: flight-status services only cover a few days
 * either side of today, so a stay booked months out would show nothing, and
 * every free tier is small enough to exhaust by accident. A recognised
 * airline and a working tracker link are the parts that are useful the whole
 * time, and they cost nothing.
 */

/** IATA designator → airline, covering the carriers that actually fly here. */
const AIRLINES: Record<string, string> = {
  AA: "American Airlines", AC: "Air Canada", AF: "Air France", AI: "Air India",
  AM: "Aeroméxico", AR: "Aerolíneas Argentinas", AS: "Alaska Airlines",
  AT: "Royal Air Maroc", AY: "Finnair", AZ: "ITA Airways", BA: "British Airways",
  BR: "EVA Air", CI: "China Airlines", CX: "Cathay Pacific", DL: "Delta",
  EI: "Aer Lingus", EK: "Emirates", ET: "Ethiopian Airlines", EW: "Eurowings",
  EY: "Etihad", FI: "Icelandair", FR: "Ryanair", GA: "Garuda Indonesia",
  HU: "Hainan Airlines", HV: "Transavia", IB: "Iberia", JL: "Japan Airlines",
  KE: "Korean Air", KL: "KLM", LA: "LATAM", LH: "Lufthansa", LO: "LOT",
  LX: "SWISS", MS: "EgyptAir", MU: "China Eastern", NH: "ANA",
  NZ: "Air New Zealand", OS: "Austrian Airlines", OU: "Croatia Airlines",
  PC: "Pegasus", QF: "Qantas", QR: "Qatar Airways", SK: "SAS",
  SN: "Brussels Airlines", SQ: "Singapore Airlines", SU: "Aeroflot",
  TG: "Thai Airways", TK: "Turkish Airlines", TO: "Transavia France",
  TP: "TAP Portugal", UA: "United", UX: "Air Europa", VS: "Virgin Atlantic",
  VY: "Vueling", WN: "Southwest", WS: "WestJet", W6: "Wizz Air",
  "3U": "Sichuan Airlines", "5J": "Cebu Pacific", "6E": "IndiGo",
  B6: "JetBlue", D8: "Norwegian", DY: "Norwegian", F9: "Frontier",
  NK: "Spirit", U2: "easyJet", ZB: "Air Albania",
};

export type FlightRef = {
  /** what they typed, tidied: "AF083" */
  code: string;
  carrier: string;
  airline: string | null;
  number: string;
  /** live status, verified to resolve for IATA designators */
  tracker: string;
  /** our own endpoint, so the browser never talks to a logo CDN */
  logo: string | null;
};

export function isKnownAirline(carrier: string): boolean {
  return carrier in AIRLINES;
}

/**
 * IATA designators are two alphanumerics with at least one letter, then one
 * to four digits, optionally with an operational suffix letter.
 */
const PATTERN = /^([A-Z][0-9]|[0-9][A-Z]|[A-Z]{2})\s?(\d{1,4})([A-Z])?$/;

export function parseFlight(input: string | null | undefined): FlightRef | null {
  if (!input) return null;
  const cleaned = input.trim().toUpperCase().replace(/\s+/g, " ");
  const match = PATTERN.exec(cleaned);
  if (!match) return null;

  const [, carrier, digits] = match;
  const number = String(Number(digits)); // AF083 and AF83 are the same flight
  const known = carrier in AIRLINES;
  return {
    code: `${carrier}${digits}`,
    carrier,
    airline: AIRLINES[carrier] ?? null,
    number,
    tracker: `https://www.flightstats.com/v2/flight-tracker/${carrier}/${number}`,
    logo: known ? `/api/airline/${carrier}` : null,
  };
}
