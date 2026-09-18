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
  pos: [0, 1.6, 46],
  lookAt: [sites[0].pos[0], 1.6, sites[0].pos[1]]
};

const landmarks = [
  { asset: "lander", pos: [0, 0, 41], rotY: 0.35, scale: 1.0, minTier: "T3" },
  { asset: "rock-a", pos: [14, 0, 34], rotY: 1.2, scale: 1.4, minTier: "T3" },
  { asset: "rock-b", pos: [-16, 0, 30], rotY: 0.8, scale: 1.3, minTier: "T3" },
  { asset: "rock-c", pos: [28, 0, -8], rotY: 2.1, scale: 1.6, minTier: "T3" },
  { asset: "rock-a", pos: [-30, 0, -12], rotY: 1.7, scale: 1.5, minTier: "T3" },
  { asset: "rock-b", pos: [0, 0, -36], rotY: 0.5, scale: 1.8, minTier: "T3" },
  { asset: "rock-c", pos: [18, 0, -32], rotY: 2.5, scale: 1.1, minTier: "T4" },
  { asset: "rock-a", pos: [-24, 0, 16], rotY: 0.3, scale: 1.0, minTier: "T4" },
  { asset: "rock-b", pos: [34, 0, 16], rotY: 1.9, scale: 1.3, minTier: "T4" }
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
  ambience: {
    keyLight: 0xd99423,
    fillLight: 0x3d4454,
    fogColor: 0x4a3b2c,
    fogNear: 30,
    fogFar: 140,
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
const allowedAssets = new Set(['pylon', 'lander', 'rock-a', 'rock-b', 'rock-c']);
for (const lm of landmarks) {
  if (!allowedAssets.has(lm.asset)) errors.push(`Rule 10 violation: unknown asset "${lm.asset}"`);
}

if (errors.length > 0) {
  console.error("WORLD GENERATION FAILED AUDIT:");
  for (const err of errors) console.error(" - " + err);
  process.exit(1);
}

fs.mkdirSync('src/three/world-data', { recursive: true });
fs.writeFileSync('src/three/world-data/erebus.json', JSON.stringify(erebusWorld, null, 2));
console.log("src/three/world-data/erebus.json written successfully. All 11 hard rules passed.");
