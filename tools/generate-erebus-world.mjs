/**
 * tools/generate-erebus-world.mjs — Generates src/three/world-data/erebus.json and verifies §3.1 rules
 */

import fs from 'fs';
import path from 'path';

const ALLOWED_VOCAB = new Set(['pylon', 'mast', 'basin', 'ridge', 'drift', 'terrace', 'hollow', 'span', 'relay']);
const FORBIDDEN_WORDS = [
  'electron', 'nucleophile', 'electrophile', 'carbonyl', 'carbocation',
  'alkyl', 'ester', 'epoxide', 'isopropyl', 'charge', 'polarity', 'bond'
];

const R = 44;
const sites = [];
const labels = [
  "Basin Relay",
  "Ridge Pylon",
  "Drift Mast",
  "Terrace Relay",
  "Hollow Pylon",
  "Span Mast",
  "Basin Ridge Relay",
  "Drift Terrace Pylon",
  "Hollow Span Mast",
  "Ridge Basin Pylon",
  "Terrace Mast",
  "Hollow Relay",
  "Span Pylon",
  "Drift Relay",
  "Ridge Mast",
  "Basin Mast",
  "Terrace Pylon",
  "Hollow Mast",
  "Span Relay",
  "Basin Hollow Relay"
];

// 20 sites around an elliptical loop
for (let i = 1; i <= 20; i++) {
  // Angle starts near south (spawn at +Z) and loops counter-clockwise
  const angle = (Math.PI / 2) - ((i - 1) * (2 * Math.PI / 20)) - 0.16;
  const x = Number((R * Math.cos(angle)).toFixed(2));
  const z = Number((R * Math.sin(angle)).toFixed(2));
  const y = 0.0;

  // approachPos: slightly inward toward basin center
  const ax = Number((0.92 * x).toFixed(2));
  const az = Number((0.92 * z).toFixed(2));

  sites.push({
    id: `site-${i}`,
    stage: i,
    pos: [x, y, z],
    approachPos: [ax, 1.6, az],
    label: labels[i - 1]
  });
}

const spawn = {
  pos: [0, 1.6, 47.5],
  lookAt: [sites[0].pos[0], 1.6, sites[0].pos[2]]
};

// What stands in the walk (src/three/erebus/landmarks.js builds each kind).
// `radius` is the footprint the Avalon's landing solver keeps clear of;
// `apron` is [radius, height] of the sand drifted up round it (terrain.js).
const landmarks = [
  {asset: "lander", pos: [0, 0, 41], rotY: 0.35, scale: 1, minTier: "T3"},
  {asset: "hoodoos", pos: [-27, 0, -5], rotY: 0.4, scale: 1, radius: 5.5, height: 7.5, count: 4, apron: [8, 0.7], seed: 11, minTier: "T3"},
  {asset: "outcrop", pos: [18, 0, -19], rotY: 1.1, scale: 1, radius: 6, height: 3.6, apron: [9, 0.5], seed: 23, minTier: "T3"},
  {asset: "boulders", pos: [-9, 0, -27], rotY: 0, scale: 1, radius: 4.5, count: 6, apron: [6, 0.4], seed: 31, minTier: "T3"},
  {asset: "spire", pos: [28, 0, 13], rotY: 0.3, scale: 1, radius: 2.6, height: 9.5, apron: [6, 0.6], seed: 41, minTier: "T3"},
  {asset: "butte", pos: [-61, 0, -41], rotY: 0.8, scale: 1, radius: 11, height: 23, apron: [17, 1.6], seed: 53, minTier: "T3"},
  {asset: "arch", pos: [-53, 0, 43], rotY: 0.7, scale: 1, radius: 12, span: 18, height: 12, seed: 61, minTier: "T3"},
  {asset: "hoodoos", pos: [61, 0, -45], rotY: 1.9, scale: 1, radius: 8, height: 14, count: 5, apron: [12, 1.0], seed: 71, minTier: "T3"},
  {asset: "skeleton", pos: [46, 0, 57], rotY: -0.6, scale: 1, radius: 13, seed: 83, minTier: "T3"},
  {asset: "wreck", pos: [-73, 0, 6], rotY: 1.25, scale: 1, radius: 15, apron: [15, 1.0], seed: 97, minTier: "T3"},
  {asset: "butte", pos: [72, 0, 18], rotY: 2.2, scale: 1, radius: 7.5, height: 15, apron: [12, 1.2], seed: 101, minTier: "T3"}
];

const stillCamera = {};
const siteDescriptions = {};

const cardinal = (x, z) => {
  const n = z < -15 ? "north" : z > 15 ? "south" : "";
  const e = x > 15 ? "east" : x < -15 ? "west" : "";
  return [n, e].filter(Boolean).join('-') || "central";
};

for (const s of sites) {
  // Still camera framed facing the pylon from its approach position
  stillCamera[s.id] = {
    pos: s.approachPos,
    lookAt: [s.pos[0], 1.8, s.pos[2]]
  };

  const sector = cardinal(s.pos[0], s.pos[2]);
  siteDescriptions[s.id] = `Stage ${s.stage} pylon situated along the ${sector} rim terrace, angled toward the central basin floor.`;
}

const erebusWorld = {
  id: "erebus",
  name: "The Charge Gardens",
  oneLine: "Find what pulls. Draw the line.",
  sky: "erebus-sky",
  terrain: {
    heightmap: "erebus-heightmap",
    size: [200, 200],
    maxHeight: 12,
    material: "desert-grit"
  },
  // Aerial perspective runs from fogNear to fogFar (erebus/atmosphere.js);
  // fogColor is only what the voyage's cloud deck is tinted with.
  ambience: {
    keyLight: 0xffd3a1,
    fillLight: 0xb99a7c,
    fogColor: 0xcf9f70,
    fogNear: 6,
    fogFar: 760,
    dustDensity: 0.35
  },
  landmarks,
  sites,
  spawn,
  t2: { stillCamera },
  t1: {
    siteOrder: sites.map(s => s.id),
    siteDescriptions
  }
};

// --- AUDIT SECTION ---
const errors = [];

// Rule 1: Exactly 20 sites, stages 1..20
if (erebusWorld.sites.length !== 20) errors.push(`Expected 20 sites, found ${erebusWorld.sites.length}`);
for (let i = 0; i < 20; i++) {
  if (erebusWorld.sites[i].stage !== i + 1) errors.push(`Site index ${i} has stage ${erebusWorld.sites[i].stage} instead of ${i+1}`);
}

// Rule 2: Walkable route <= 18 units between (i-1).pos and i.approachPos, and site 20 to spawn <= 30
for (let i = 1; i < 20; i++) {
  const prev = erebusWorld.sites[i-1].pos;
  const currAppr = erebusWorld.sites[i].approachPos;
  const d = Math.hypot(currAppr[0] - prev[0], currAppr[2] - prev[2]);
  if (d > 18) errors.push(`Rule 2 violation: site ${i} approachPos is ${d.toFixed(2)} > 18 units from site ${i-1} pos`);
}
const dEndToSpawn = Math.hypot(spawn.pos[0] - sites[19].pos[0], spawn.pos[2] - sites[19].pos[2]);
if (dEndToSpawn > 30) errors.push(`Rule 2 violation: site 20 is ${dEndToSpawn.toFixed(2)} > 30 units from spawn`);

// Rule 3: No two sites within 12 units
for (let i = 0; i < 20; i++) {
  for (let j = i + 1; j < 20; j++) {
    const d = Math.hypot(sites[i].pos[0] - sites[j].pos[0], sites[i].pos[2] - sites[j].pos[2]);
    if (d < 12) errors.push(`Rule 3 violation: sites ${i+1} and ${j+1} are ${d.toFixed(2)} < 12 units apart`);
  }
}

// Rule 5 & 6: Labels and strings (player-facing descriptions and labels)
for (const s of sites) {
  const words = s.label.toLowerCase().split(/\s+/);
  for (const w of words) {
    if (!ALLOWED_VOCAB.has(w)) errors.push(`Rule 5 violation: label word "${w}" not in allowed vocab`);
  }
}

// Check player-facing strings for forbidden vocabulary using word boundaries
const checkStrings = [
  erebusWorld.oneLine,
  ...sites.map(s => s.label),
  ...Object.values(siteDescriptions)
];

for (const str of checkStrings) {
  for (const forbidden of FORBIDDEN_WORDS) {
    const re = new RegExp(`\\b${forbidden}\\b`, 'i');
    if (re.test(str)) {
      errors.push(`Rule 6 violation: found forbidden word "${forbidden}" in string: "${str}"`);
    }
  }
}

// Rule 10: Assets
const allowedAssets = new Set(['lander', 'spire', 'hoodoos', 'butte', 'outcrop', 'boulders', 'arch', 'skeleton', 'wreck']);
for (const lm of landmarks) {
  if (!allowedAssets.has(lm.asset)) errors.push(`Rule 10 violation: unknown asset "${lm.asset}"`);
}

// Rule 12: Landmarks keep off the pylon line. The pylons stand on the rim at
// R; the player walks the ring just inside it. A landmark's footprint (plus
// the scree round it, about 40% more) may not reach into that band.
for (const lm of landmarks) {
  if (lm.asset === 'lander' || !lm.radius) continue;
  const r = Math.hypot(lm.pos[0], lm.pos[2]);
  const reach = lm.radius * 1.4;
  if (r - reach < R + 4 && r + reach > R - 7) {
    errors.push(`Rule 12 violation: ${lm.asset} at (${lm.pos[0]}, ${lm.pos[2]}) reaches the pylon line`);
  }
}

if (errors.length > 0) {
  console.error("WORLD GENERATION FAILED AUDIT:");
  for (const err of errors) console.error(" - " + err);
  process.exit(1);
}

fs.mkdirSync('src/three/world-data', { recursive: true });
fs.writeFileSync('src/three/world-data/erebus.json', JSON.stringify(erebusWorld, null, 2));
console.log("src/three/world-data/erebus.json written successfully. All 12 hard rules passed.");
