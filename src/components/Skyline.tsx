const TOWER_TOP = 168;
const DECK = 432;
const LEFT = 152;
const RIGHT = 384;
const MID = (LEFT + RIGHT) / 2;
const HALF = (RIGHT - LEFT) / 2;
const SAG = 176;

/** Parabolic approximation of the main span cable. */
function cableY(x: number) {
  const t = (x - MID) / HALF;
  return TOWER_TOP + SAG * (1 - t * t);
}

/** Side spans sweep from the anchorages up to the tower tops. */
function sideY(x: number, from: number, to: number, anchorY: number) {
  const t = (x - from) / (to - from);
  return anchorY + (TOWER_TOP - anchorY) * (t * t);
}

function suspenders() {
  const lines: { x: number; y: number }[] = [];
  for (let x = LEFT + 12; x < RIGHT; x += 13.5) lines.push({ x, y: cableY(x) });
  for (let x = 18; x < LEFT; x += 13.5) lines.push({ x, y: sideY(x, 0, LEFT, 312) });
  for (let x = RIGHT + 12; x < 520; x += 13.5)
    lines.push({ x, y: sideY(x, 536, RIGHT, 312) });
  return lines.filter((l) => l.y < DECK - 4);
}

function Tower({ x }: { x: number }) {
  const w = 26;
  return (
    <g>
      <rect x={x - w / 2} y={TOWER_TOP} width={5} height={DECK - TOWER_TOP + 40} />
      <rect x={x + w / 2 - 5} y={TOWER_TOP} width={5} height={DECK - TOWER_TOP + 40} />
      {[TOWER_TOP + 4, 232, 300, 372].map((y) => (
        <rect key={y} x={x - w / 2} y={y} width={w} height={5} />
      ))}
    </g>
  );
}

export function Skyline({ className = "" }: { className?: string }) {
  const lines = suspenders();

  return (
    <svg
      viewBox="0 0 520 620"
      className={className}
      role="img"
      aria-label="The Golden Gate Bridge in fog"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#efe6d4" />
          <stop offset="62%" stopColor="#f2ece0" />
          <stop offset="100%" stopColor="#e6ddcb" />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1f4039" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#1f4039" stopOpacity="0.06" />
        </linearGradient>
        <filter id="soft" x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <clipPath id="frame">
          <rect x="0" y="0" width="520" height="620" />
        </clipPath>
      </defs>

      <g clipPath="url(#frame)">
        <rect width="520" height="620" fill="url(#sky)" />
        <circle cx="392" cy="150" r="86" fill="#c8902c" opacity="0.14" />

        {/* far headlands */}
        <path
          d="M0 372 C70 330 118 344 168 366 C214 386 250 380 300 358 C356 334 428 344 520 384 L520 470 L0 470 Z"
          fill="#1f4039"
          opacity="0.11"
        />

        {/* bridge */}
        <g fill="#c04424" stroke="#c04424">
          <Tower x={LEFT} />
          <Tower x={RIGHT} />
          <g strokeWidth="1.1" opacity="0.75">
            {lines.map((l, i) => (
              <line key={i} x1={l.x} y1={l.y} x2={l.x} y2={DECK} />
            ))}
          </g>
          <path
            d={`M0 312 C${LEFT * 0.42} 300 ${LEFT * 0.78} 236 ${LEFT} ${TOWER_TOP} C${LEFT + 44} 250 ${MID - 34} ${cableY(MID - 34)} ${MID} ${cableY(MID)} C${MID + 34} ${cableY(MID + 34)} ${RIGHT - 44} 250 ${RIGHT} ${TOWER_TOP} C${RIGHT + 40} 236 ${RIGHT + 90} 300 520 312`}
            fill="none"
            strokeWidth="3"
          />
          <rect x="0" y={DECK} width="520" height="7" />
          <rect x="0" y={DECK + 12} width="520" height="2" opacity="0.5" />
        </g>

        {/* water */}
        <rect x="0" y="470" width="520" height="150" fill="url(#water)" />
        {[492, 510, 528, 548, 570, 594].map((y, i) => (
          <line
            key={y}
            x1={i % 2 ? 40 : 0}
            y1={y}
            x2={i % 2 ? 520 : 470}
            y2={y}
            stroke="#1f4039"
            strokeOpacity={0.16 - i * 0.015}
            strokeWidth="1.5"
          />
        ))}

        {/* fog rolling through */}
        <g filter="url(#soft)">
          {[
            { y: 250, h: 34, o: 0.55, d: "22s" },
            { y: 322, h: 46, o: 0.68, d: "31s" },
            { y: 404, h: 30, o: 0.5, d: "26s" },
            { y: 448, h: 54, o: 0.72, d: "38s" },
          ].map((band) => (
            <rect
              key={band.y}
              x="-60"
              y={band.y}
              width="640"
              height={band.h}
              rx={band.h / 2}
              fill="#f2ece0"
              opacity={band.o}
              style={{
                animation: `drift ${band.d} ease-in-out infinite`,
                transformOrigin: "center",
              }}
            />
          ))}
        </g>

        {/* near hill */}
        <path
          d="M0 512 C78 470 140 476 206 508 C268 538 320 534 392 504 C444 482 486 484 520 498 L520 620 L0 620 Z"
          fill="#1f4039"
          opacity="0.16"
        />
      </g>
    </svg>
  );
}
