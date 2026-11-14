#!/usr/bin/env node
/**
 * gen-thornmere-layout.mjs — Lays out Thornmere's mounds and writes `src/three/world-data/thornmere.json` from the one plan in
 * `src/three/thornmere/site-plan.js`. Deterministic: there is nothing random in it.
 *
 * Run: node tools/gen-thornmere-layout.mjs
 */

import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { HOST_PLAN, MOUNDS, RIDGES, ROOM, APPROACH, SPAWN, PAD, ARENA, EDGE_IN, hostToWorld, height, walkable, routeTo } from '../src/three/thornmere/site-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const round = n => Math.round(n * 100) / 100;
const questExists = id => existsSync(join(root, 'src/learn/quests/unit13', `${id}.js`));

const sites = Object.entries(HOST_PLAN).map(([id, plan]) => {
  const ap = hostToWorld(plan, 0, APPROACH);
  return {
    id,
    questId: plan.questId,
    stage: plan.stage,
    pos: [round(plan.pos[0]), 0, round(plan.pos[1])],
    approachPos: [round(ap[0]), 1.6, round(ap[1])],
    label: plan.label,
    structure: plan.structure,
    mound: plan.mound,
    built: questExists(plan.questId),
    route: routeTo(id).map(p => p.map(round)),
    flat: { x: plan.centre[0], z: plan.centre[1], r: MOUNDS[plan.mound].r - EDGE_IN }
  };
});

const landmarks = [];
const lamp = (x, z) => {
  if (!walkable(x, z)) throw new Error(`a lamp post at ${x}, ${z} stands in the tar`);
  landmarks.push({ asset: 'lamp-post', pos: [round(x), 0, round(z)], rotY: 0, radius: 0.6 });
};
landmarks.push({ asset: 'landing-pad', pos: [PAD[0], 0, PAD[1]], rotY: 0, radius: 10 });

// A lamp where each ridge leaves a mound and where it arrives, on the right of the way; and one beside each door.
for (const [a, b] of RIDGES) {
  const A = MOUNDS[a]; const B = MOUNDS[b];
  const dx = B.x - A.x; const dz = B.z - A.z; const L = Math.hypot(dx, dz);
  const ux = dx / L; const uz = dz / L;
  for (const d of [A.r - 0.3, L - (B.r - 0.3)]) lamp(A.x + ux * d - uz * 2.5, A.z + uz * d + ux * 2.5);
}
for (const plan of Object.values(HOST_PLAN)) {
  const side = plan.structure === 'fallen-trunk' ? 9.6 : plan.structure === 'plate-works' ? 4.4 : 3.6;
  const out = plan.structure === 'fallen-trunk' ? ROOM.cz + 9.6 : ROOM.cz + ROOM.r + 2.6;
  const [x, z] = hostToWorld(plan, side, out);
  lamp(x, z);
}
// The gate across the back of the last mound, facing the player's ground.
landmarks.push({ asset: 'carapace-gate', pos: [ARENA.boss[0], 0, ARENA.boss[2] - 9], rotY: 0, radius: 14 });

const out = {
  id: 'thornmere',
  name: 'Thornmere',
  sky: 'thornmere-sky',
  ambience: { fogColor: 0x8f9087, fogNear: 60, fogFar: 420 },
  spawn: [...SPAWN],
  pad: { pos: [PAD[0], 0, PAD[1]], r: 10 },
  arena: { boss: [...ARENA.boss], player: [...ARENA.player] },
  mounds: Object.fromEntries(Object.entries(MOUNDS).map(([k, m]) => [k, { ...m, ground: round(height(m.x, m.z)) }])),
  ridges: RIDGES.map(r => [...r]),
  roads: [],
  sites,
  landmarks
};

const outPath = join(root, 'src/three/world-data/thornmere.json');
writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`Wrote ${outPath}: ${sites.length} sites, ${landmarks.length} landmarks.`);
