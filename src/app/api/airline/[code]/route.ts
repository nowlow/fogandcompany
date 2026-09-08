import { isKnownAirline } from "@/lib/flights";

/**
 * Serves an airline logo from our own origin.
 *
 * The logo lives on a third-party CDN, and pointing an <img> straight at it
 * would hand that CDN every guest's IP address, which the privacy policy
 * says doesn't happen. Fetching it server-side keeps that true: the only
 * thing that leaves here is an airline code.
 */
const UPSTREAM = (code: string) =>
  `https://images.kiwi.com/airlines/64/${code}.png`;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const carrier = code.toUpperCase();

  // A whitelist, so this can't be used as an open image proxy.
  if (!/^[A-Z0-9]{2}$/.test(carrier) || !isKnownAirline(carrier)) {
    return new Response(null, { status: 404 });
  }

  try {
    const upstream = await fetch(UPSTREAM(carrier), {
      // logos change about never
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!upstream.ok) return new Response(null, { status: 404 });

    return new Response(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=2592000, immutable",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
