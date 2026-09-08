import { ImageResponse } from "next/og";
import { skylineDataUri } from "@/lib/og-art";
import { APP_NAME, CITY } from "@/lib/constants";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${APP_NAME}, ${CITY}`;

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={skylineDataUri("fog")} width={1200} height={630} alt="" />
      </div>
    ),
    size,
  );
}
