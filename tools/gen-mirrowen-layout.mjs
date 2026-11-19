#!/usr/bin/env node
/**
 * gen-mirrowen-layout.mjs — Lays out Mirrowen's harbour and writes `src/three/world-data/mirrowen.json`.
 *
 * Deterministic, derived from `src/three/mirrowen/harbour-plan.js` and `src/three/mirrowen/host-plan.js`.
 * Site ids (`site-1..7`), `questId`, `label`, `stage` and `built` are unchanged from the world before
 * the rebuild; only where each site stands has moved.
 *
 * Run: node tools/gen-mirrowen-layout.mjs
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  ROOMS, sitePlacement, PAD, SPAWN, SPAWN_LOOK, ARENA, WATER, makeHarbourPlan
} from '../src/three/mirrowen/harbour-plan.js';
import { HOST_PLAN } from '../src/three/mirrowen/host-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const round = n => Math.round(n * 100) / 100;
const plan = makeHarbourPlan();

/** The labels as they stood before the rebuild: a site's words never change with its ground. */
const LABELS = {
  'site-1': 'Bench 1 - Three States',
  'site-2': 'Bench 2 - The Grip Between',
  'site-3': 'Bench 3 - Liquids and Vapour',
  'site-4': 'Bench 4 - Kinds of Solid',
  'site-5': 'Bench 5 - The Crossing',
  'site-6': 'Bench 6 - Taken Into Solution',
  'site-7': 'Bench 7 - Pulling Apart'
};

const sites = ROOMS.map((rm, i) => {
  const { pos, approachPos } = sitePlacement(rm);
  return {
    id: rm.site,
    questId: rm.questId,
    stage: i + 1,
    roomId: rm.id,
    pos,
    approachPos,
    label: LABELS[rm.site],
    structure: HOST_PLAN[rm.site].structure,
    built: true
  };
});

/* ---------------------------------------------------------------- landmarks */

const landmarks = [];
const add = (asset, x, z, radius, extra = {}) => {
  landmarks.push({ asset, pos: [round(x), round(plan.height(x, z)), round(z)], radius, ...extra });
};

// The pad on the town terrace.
add('landing-pad', PAD[0], PAD[1], 10, { minTier: 'T3' });

// Work lamps along the quays, a metre in from the edge, none within 9 m of the Undertow.
const lampPosts = [
  // Terrace and the harbour stair.
  [20, 45.2], [40, 45.2], [-6, 50.8],
  // Main quay, along the basin's edge.
  [-56, 23.2], [-38, 23.2], [-20, 23.2], [-2, 23.2], [12, 23.2], [44, 23.2],
  // Mole.
  [41.2, 10], [41.2, -8], [41.2, -26], [41.2, -44], [50.8, -56],
  // Mole head (clear of the arena) and the pump yard.
  [46, -64], [80.8, -64], [46, -94.8], [80.8, -94.8], [42.8, -68],
  // North quay.
  [-4, -63.2], [-22, -63.2], [-38, -63.2], [-66, -63.2], [-30, -94.8], [-62, -94.8],
  // West shore.
  [-41.2, -24], [-41.2, -2], [-41.2, 14]
];
for (const [x, z] of lampPosts) add('lamp-post', x, z, 0.45, { minTier: 'T3' });

// The portal crane on its rails over the ice-breaker's berth; the walk passes between its legs.
add('gantry-crane', 32, 26.5, 6.2, { rotY: 0, minTier: 'T3' });

// Warehouse rows on the land behind the shore's wall and the town's south wall (off the walk).
for (const z of [-84, -66, -24, -6, 12]) add('shed', -82, z, 6.0, { rotY: round(Math.PI / 2), minTier: 'T3' });
for (const x of [22, 44, 66, 86]) add('shed', x, 104, 6.0, { rotY: 0, minTier: 'T3' });

// Mooring bollards on the quay edge beside each ship.
for (const x of [-12, 4, 24]) add('bollard', x, 22.9, 0.42, { minTier: 'T3' });
for (const z of [-30, -18, 2]) add('bollard', 51.1, z, 0.42, { minTier: 'T3' });
for (const x of [-68, -54]) add('bollard', x, -62.9, 0.42, { minTier: 'T3' });

// The Fifth's ice: walls of crystal standing in the frozen canal by the lock gate and west of the freighter.
for (const [x, z, s] of [[-51, -56, 0.8], [-51, -42, 0.75], [-112, -58, 1.0], [-112, -40, 1.0], [-118, -49, 0.9]]) {
  add('ice-wall', x, z, round(4.4 * s), { scale: s, minTier: 'T4' });
}

/* ---------------------------------------------------------------- what the place breathes */

const vents = [
  // The ice-breaker's funnel, the tanker's funnel, the pump house's chimney, the tug's funnel in the dock.
  { x: 27, y: 11.4, z: 7, size: 1.4, rate: 1.1, rise: 16, life: 9, alpha: 0.32, lean: 0.9 },
  { x: 65, y: 12.6, z: 9, size: 0.9, rate: 0.6, rise: 12, life: 8, alpha: 0.22, lean: 0.9 },
  { x: 32, y: 17.6, z: -94, size: 0.8, rate: 0.5, rise: 10, life: 8, alpha: 0.2, lean: 0.9 }
];

/* ---------------------------------------------------------------- worn routes */

/** The lines people walk most, which show pale in the setts. */
const paths = [
  { a: [-20, 46], b: [-20, 30], w: 2.2 }, { a: [-20, 30], b: [46, 30], w: 2.6 }, { a: [18, 30], b: [18, 22], w: 1.8 },
  { a: [46, 30], b: [46, -64], w: 2.4 }, { a: [46, -64], b: [62, -72], w: 2.2 }, { a: [46, -64], b: [0, -64], w: 2.2 },
  { a: [0, -64], b: [-44, -64], w: 2.4 }, { a: [-60, -64], b: [-44, -64], w: 1.8 }, { a: [-44, -34], b: [-44, 30], w: 2.4 },
  { a: [-44, -33], b: [-40, -33], w: 1.6 }, { a: [-44, -13], b: [-40, -13], w: 1.6 }
];

/* ---------------------------------------------------------------- t2 & t1 */

const stillCamera = {};
for (const s of sites) {
  stillCamera[s.id] = { pos: [...s.approachPos], lookAt: [s.pos[0], round(s.pos[1] + 1.2), s.pos[2]] };
}

const data = {
  id: 'mirrowen',
  name: 'Mirrowen',
  place: 'Tidal shelf',
  oneLine: 'States of matter, phase changes, and solutions.',
  sky: 'mirrowen-sky',
  terrain: { heightmap: 'mirrowen-harbour', size: [240, 240], maxHeight: 5, material: 'frost-shingle' },
  ambience: { keyLight: 15594487, fillLight: 12439772, fogColor: 13424602, fogNear: 60, fogFar: 700, dustDensity: 0.3 },
  water: { level: WATER },
  arena: { boss: ARENA.boss, player: ARENA.player },
  spawn: { pos: SPAWN, lookAt: SPAWN_LOOK },
  sites,
  landmarks,
  vents,
  paths,
  t2: { stillCamera },
  t1: { siteOrder: sites.map(s => s.id) },
  tracks: []
};

writeFileSync(join(root, 'src/three/world-data/mirrowen.json'), JSON.stringify(data, null, 2) + '\n');
console.log(`wrote src/three/world-data/mirrowen.json: ${sites.length} sites, ${landmarks.length} landmarks`);
