// One-off: generate the two DepEd logos (public/deped-logo.png, public/ok-sa-deped.png)
// used by the SBFP Form 1A Excel export. Run: node scripts/generate-sbfp-logos.mjs
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";

const NAVY = "#0b3d91";
const YELLOW = "#f5c400";
const GREEN = "#00a651";
const BLUE = "#003f87";
const RED = "#c8102e";
const FONT = "Arial, Helvetica, sans-serif";

// ── DepEd seal ────────────────────────────────────────────────────────────────
const depedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
  <circle cx="120" cy="120" r="116" fill="#ffffff" stroke="${NAVY}" stroke-width="5"/>
  <circle cx="120" cy="120" r="90" fill="none" stroke="${NAVY}" stroke-width="2"/>
  <defs>
    <path id="arcTop" d="M 40 120 A 80 80 0 0 1 200 120" fill="none"/>
    <path id="arcBot" d="M 40 120 A 80 80 0 0 0 200 120" fill="none"/>
  </defs>
  <text font-family="${FONT}" font-size="26" font-weight="bold" fill="${NAVY}" letter-spacing="4">
    <textPath href="#arcTop" startOffset="50%" text-anchor="middle">DepED</textPath>
  </text>
  <text font-family="${FONT}" font-size="18" font-weight="bold" fill="${NAVY}" letter-spacing="2">
    <textPath href="#arcBot" startOffset="50%" text-anchor="middle">PHILIPPINES</textPath>
  </text>
  <g transform="translate(120,122)">
    <!-- open book -->
    <path d="M -46 -6 Q -24 -16 0 -8 Q 24 -16 46 -6 L 46 30 Q 24 22 0 30 Q -24 22 -46 30 Z"
      fill="#ffffff" stroke="${NAVY}" stroke-width="2.5"/>
    <path d="M 0 -8 L 0 30" stroke="${NAVY}" stroke-width="2"/>
    <path d="M -38 -2 Q -20 -10 -6 -4 M -38 8 Q -20 0 -6 6 M -38 18 Q -20 10 -6 16" stroke="${NAVY}" stroke-width="1.4" fill="none"/>
    <path d="M 38 -2 Q 20 -10 6 -4 M 38 8 Q 20 0 6 6 M 38 18 Q 20 10 6 16" stroke="${NAVY}" stroke-width="1.4" fill="none"/>
    <!-- torch above the book -->
    <g transform="translate(0,-24)">
      <path d="M -7 8 Q 0 -10 7 8 Q 0 4 -7 8 Z" fill="${YELLOW}" stroke="${NAVY}" stroke-width="2"/>
      <path d="M -4 8 L 4 8 L 3 18 L -3 18 Z" fill="${BLUE}" stroke="${NAVY}" stroke-width="1.5"/>
    </g>
    <!-- stars -->
    <circle cx="-58" cy="-42" r="4" fill="${YELLOW}"/>
    <circle cx="58" cy="-42" r="4" fill="${YELLOW}"/>
  </g>
</svg>`;

// ── OK sa DepEd seal ──────────────────────────────────────────────────────────
const okSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
  <circle cx="120" cy="120" r="116" fill="#ffffff" stroke="${GREEN}" stroke-width="6"/>
  <circle cx="120" cy="120" r="98" fill="none" stroke="${GREEN}" stroke-width="2"/>
  <text x="120" y="104" font-family="${FONT}" font-size="56" font-weight="bold" fill="${GREEN}" text-anchor="middle">OK</text>
  <text x="120" y="136" font-family="${FONT}" font-size="24" fill="${BLUE}" text-anchor="middle">sa</text>
  <text x="120" y="172" font-family="${FONT}" font-size="30" font-weight="bold" fill="${RED}" text-anchor="middle">DepEd</text>
  <!-- check mark -->
  <path d="M 78 186 L 100 204 L 164 158" stroke="${GREEN}" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

writeFileSync("public/deped-logo.png", new Resvg(depedSvg).render().asPng());
writeFileSync("public/ok-sa-deped.png", new Resvg(okSvg).render().asPng());
console.log("logos written: public/deped-logo.png, public/ok-sa-deped.png");
