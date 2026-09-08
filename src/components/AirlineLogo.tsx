"use client";

import { useState } from "react";

/** Disappears rather than showing a broken image if the CDN lets us down. */
export function AirlineLogo({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={20}
      height={20}
      loading="lazy"
      onError={() => setFailed(true)}
      className="inline-block h-5 w-5 shrink-0 rounded-[3px] object-contain align-text-bottom"
    />
  );
}
