/**
 * The landing page bridge, redrawn for a 1200x630 link preview.
 *
 * Kept as an SVG string rather than the React component so it can be handed
 * to the image renderer as a data URI. Geometry only, no text: fonts inside
 * an embedded SVG would not resolve, and the title comes from og:title.
 */

export type Variant = "day" | "dusk" | "fog";

const PALETTE: Record<
  Variant,
  { sky: [string, string]; bridge: string; hills: string; fog: string; sun: string }
> = {
  day: {
    sky: ["#efe6d4", "#e6ddcb"],
    bridge: "#c04424",
    hills: "#1f4039",
    fog: "#f2ece0",
    sun: "#c8902c",
  },
  dusk: {
    sky: ["#e9d9c4", "#d9c3ae"],
    bridge: "#a8371c",
    hills: "#243b3a",
    fog: "#f0e4d4",
    sun: "#c2701f",
  },
  fog: {
    sky: ["#e9e6df", "#dad6cd"],
    bridge: "#b86250",
    hills: "#3a4a48",
    fog: "#f4f1ea",
    sun: "#cbbfa4",
  },
};

const W = 1200;
const H = 630;
const TOWER_TOP = 150;
const DECK = 430;
const LEFT = 380;
const RIGHT = 820;
const MID = (LEFT + RIGHT) / 2;
const HALF = (RIGHT - LEFT) / 2;
const SAG = 190;

const cableY = (x: number) => {
  const t = (x - MID) / HALF;
  return TOWER_TOP + SAG * (1 - t * t);
};
const sideY = (x: number, from: number, to: number, anchor: number) => {
  const t = (x - from) / (to - from);
  return anchor + (TOWER_TOP - anchor) * t * t;
};

function suspenders(): string {
  const lines: string[] = [];
  const push = (x: number, y: number) => {
    if (y < DECK - 6)
      lines.push(`<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x.toFixed(1)}" y2="${DECK}"/>`);
  };
  for (let x = LEFT + 20; x < RIGHT; x += 22) push(x, cableY(x));
  for (let x = 30; x < LEFT; x += 22) push(x, sideY(x, 0, LEFT, 300));
  for (let x = RIGHT + 20; x < W; x += 22) push(x, sideY(x, W + 60, RIGHT, 300));
  return lines.join("");
}

function tower(x: number): string {
  const w = 44;
  const legs = `<rect x="${x - w / 2}" y="${TOWER_TOP}" width="9" height="${DECK - TOWER_TOP + 60}"/>
    <rect x="${x + w / 2 - 9}" y="${TOWER_TOP}" width="9" height="${DECK - TOWER_TOP + 60}"/>`;
  const beams = [TOWER_TOP + 6, 232, 312, 392]
    .map((y) => `<rect x="${x - w / 2}" y="${y}" width="${w}" height="9"/>`)
    .join("");
  return legs + beams;
}

export function skylineSvg(variant: Variant = "day"): string {
  const c = PALETTE[variant];
  const cable = `M0 300 C${LEFT * 0.4} 288 ${LEFT * 0.78} 214 ${LEFT} ${TOWER_TOP}
    C${LEFT + 80} 236 ${MID - 60} ${cableY(MID - 60).toFixed(1)} ${MID} ${cableY(MID).toFixed(1)}
    C${MID + 60} ${cableY(MID + 60).toFixed(1)} ${RIGHT - 80} 236 ${RIGHT} ${TOWER_TOP}
    C${RIGHT + 76} 214 ${W - 120} 288 ${W} 300`;

  const bands = [
    { y: 250, h: 46, o: 0.5 },
    { y: 330, h: 62, o: 0.62 },
    { y: 412, h: 40, o: 0.46 },
    { y: 462, h: 72, o: 0.66 },
  ]
    .map(
      (b) =>
        `<rect x="-80" y="${b.y}" width="${W + 160}" height="${b.h}" rx="${b.h / 2}" fill="${c.fog}" opacity="${b.o}"/>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${c.sky[0]}"/>
      <stop offset="100%" stop-color="${c.sky[1]}"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-40%" width="140%" height="180%">
      <feGaussianBlur stdDeviation="14"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <circle cx="905" cy="150" r="120" fill="${c.sun}" opacity="0.16"/>
  <path d="M0 372 C160 330 270 348 390 372 C500 394 580 386 700 356 C830 324 1000 338 ${W} 386 L${W} 470 L0 470 Z" fill="${c.hills}" opacity="0.11"/>
  <g fill="${c.bridge}" stroke="${c.bridge}">
    ${tower(LEFT)}${tower(RIGHT)}
    <g stroke-width="2" opacity="0.72">${suspenders()}</g>
    <path d="${cable}" fill="none" stroke-width="6"/>
    <rect x="0" y="${DECK}" width="${W}" height="12"/>
    <rect x="0" y="${DECK + 20}" width="${W}" height="3" opacity="0.5"/>
  </g>
  <rect x="0" y="470" width="${W}" height="${H - 470}" fill="${c.hills}" opacity="0.12"/>
  <g filter="url(#soft)">${bands}</g>
  <path d="M0 520 C180 476 320 484 470 518 C610 550 720 546 880 512 C980 490 1080 492 ${W} 508 L${W} ${H} L0 ${H} Z" fill="${c.hills}" opacity="0.17"/>
</svg>`;
}

export function skylineDataUri(variant: Variant = "day"): string {
  return `data:image/svg+xml;base64,${Buffer.from(skylineSvg(variant)).toString("base64")}`;
}
