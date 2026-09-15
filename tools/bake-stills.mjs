/**
 * bake-stills.mjs — Generates lightweight Star Wars / Dune fallback backdrops for Tier 1
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../public/fallback');
const artDir = path.join(__dirname, '../public/art');
fs.mkdirSync(outDir, { recursive: true });

const LOCATIONS = ['bridge', 'starmap', 'quarters', 'cargo', 'comms', 'airlock'];

// Synchronize high-res art into fallback if present
for (const loc of LOCATIONS) {
  const artPath = path.join(artDir, `${loc}.jpg`);
  const outPath = path.join(outDir, `${loc}.jpg`);
  if (fs.existsSync(artPath)) {
    fs.copyFileSync(artPath, outPath);
    console.log(`Synchronized high-res art backdrop: ${outPath}`);
  }
}

const SVG_TEMPLATE = (name, accent) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <defs>
    <radialGradient id="sky" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#3d2210"/>
      <stop offset="60%" stop-color="#181310"/>
      <stop offset="100%" stop-color="#0c0d11"/>
    </radialGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="transparent"/>
      <stop offset="50%" stop-color="${accent}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="transparent"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#sky)"/>
  <!-- Weathered Durasteel Ribs -->
  <polygon points="100,1080 300,0 350,0 200,1080" fill="#1b1e25"/>
  <polygon points="1820,1080 1620,0 1570,0 1720,1080" fill="#1b1e25"/>
  <!-- Light Beam -->
  <rect x="200" y="520" width="1520" height="4" fill="url(#beam)"/>
  <!-- Tactical Holo Ring -->
  <circle cx="960" cy="500" r="280" fill="none" stroke="${accent}" stroke-width="2" stroke-dasharray="12 6" opacity="0.45"/>
  <circle cx="960" cy="500" r="140" fill="${accent}" opacity="0.08"/>
  <text x="960" y="515" fill="${accent}" font-family="monospace" font-size="28" font-weight="bold" letter-spacing="8" text-anchor="middle">
    AVALON // ${name.toUpperCase()} // SECTOR-4
  </text>
</svg>
`;

const ACCENTS = {
  bridge: '#ff9f1c',
  starmap: '#f4a261',
  quarters: '#a3824c',
  cargo: '#c85a17',
  comms: '#38b000',
  airlock: '#d90429'
};

for (const loc of LOCATIONS) {
  const svg = SVG_TEMPLATE(loc, ACCENTS[loc] || '#ff9f1c');
  const svgPath = path.join(outDir, `${loc}.svg`);
  fs.writeFileSync(svgPath, svg.trim());
}
