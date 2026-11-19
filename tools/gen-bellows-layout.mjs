#!/usr/bin/env node
/**
 * gen-bellows-layout.mjs — Lays out Bellows' gas works and writes `src/three/world-data/bellows.json`.
 *
 * Deterministic, derived from `src/three/bellows/works-plan.js` and `src/three/bellows/host-plan.js`. Site ids
 * (`site-1..6`), `questId`, `label`, `stage` and `built` are unchanged from the world before the rebuild; only
 * where each site stands has moved. The old generator is in `archive/2026-11-18/site-bellows/`.
 *
 * Run: node tools/gen-bellows-layout.mjs
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ROOMS, sitePlacement, PAD, SPAWN, SPAWN_LOOK, ARENA, SEA } from '../src/three/bellows/works-plan.js';
import { HOST_PLAN } from '../src/three/bellows/host-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const round = n => Math.round(n * 100) / 100;

/** The labels as they stood before the rebuild: a site's words never change with its ground. */
const LABELS = {
  'site-1': 'Bench 1 - Pressure and Temperature',
  'site-2': 'Bench 2 - The Gas Laws',
  'site-3': 'Bench 3 - Ideal Gas Law',
  'site-4': 'Bench 4 - Partial Pressures',
  'site-5': 'Bench 5 - Speed and Escape',
  'site-6': 'Bench 6 - Real Gases'
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

// The pad on the landing stage is the one landmark the voyage reads. Everything else is built from the plan.
const landmarks = [{ asset: 'landing-pad', pos: [PAD[0], 0, PAD[1]], radius: 9, minTier: 'T3' }];

/* ---------------------------------------------------------------- what the place breathes */

const vents = [
  // The cold box's vent on its roof (the Compressor's exhaust is the tower's own, `plant.js`).
  { x: 61.3, y: 53.6, z: -67.3, size: 0.8, rate: 0.6, rise: 10, life: 7, alpha: 0.24 }
];

/* ---------------------------------------------------------------- t2 & t1 */

const stillCamera = {};
for (const s of sites) {
  stillCamera[s.id] = { pos: [...s.approachPos], lookAt: [s.pos[0], round(s.pos[1] + 1.2), s.pos[2]] };
}

const data = {
  id: 'bellows',
  name: 'Bellows',
  place: 'Cloud deck',
  oneLine: 'Gas laws, the ideal gas equation, and kinetic molecular theory.',
  sky: 'bellows-sky',
  terrain: { heightmap: 'bellows-works', size: [200, 200], maxHeight: 12, material: 'tread-plate' },
  ambience: { keyLight: 16773334, fillLight: 7312336, fogColor: 12833768, fogNear: 60, fogFar: 760, dustDensity: 0.3 },
  deck: { seaLevel: SEA },
  arena: { boss: ARENA.boss, player: ARENA.player },
  spawn: { pos: SPAWN, lookAt: SPAWN_LOOK },
  sites,
  landmarks,
  vents,
  t2: { stillCamera },
  t1: { siteOrder: sites.map(s => s.id) },
  tracks: []
};

writeFileSync(join(root, 'src/three/world-data/bellows.json'), JSON.stringify(data, null, 2) + '\n');
console.log(`wrote src/three/world-data/bellows.json: ${sites.length} sites, ${landmarks.length} landmarks`);
