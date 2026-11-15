#!/usr/bin/env node
/**
 * gen-cinderhalo-layout.mjs — Lays out Cinder Halo's craters and cells and writes `src/three/world-data/cinderhalo.json` from the one plan
 * in `src/three/cinderhalo/site-plan.js`. Deterministic: there is nothing random in it.
 *
 * Run: node tools/gen-cinderhalo-layout.mjs
 */

import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { HOST_PLAN, PARTS, CUTS, CUT_SEGS, CELL, APPROACH, SPAWN, PAD, ARENA, hostToWorld, height, walkable, routeTo } from '../src/three/cinderhalo/site-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const round = n => Math.round(n * 100) / 100;
const questExists = id => existsSync(join(root, 'src/learn/quests/unit14', `${id}.js`));

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
    crater: plan.crater,
    built: questExists(plan.questId),
    route: routeTo(id).map(p => p.map(round)),
    floor: PARTS[plan.crater].floor
  };
});

const landmarks = [];
const lamp = (x, z) => {
  if (!walkable(x, z)) throw new Error(`a lamp post at ${x}, ${z} stands off the walk`);
  landmarks.push({ asset: 'lamp-post', pos: [round(x), 0, round(z)], rotY: 0, radius: 0.6 });
};
landmarks.push({ asset: 'landing-pad', pos: [PAD[0], 0, PAD[1]], rotY: 0, radius: 10 });

// A lamp where each cutting leaves a floor and where it arrives, on the right of the way down; and one outside each cell's vestibule.
for (const s of CUT_SEGS) {
  const dx = s.bx - s.ax; const dz = s.bz - s.az; const L = Math.hypot(dx, dz);
  const ux = dx / L; const uz = dz / L;
  // At each end, just inside the floor's edge and to the right of the cutting's line, clear of the way round the floor.
  for (const [x, z] of [[s.ax + ux * 0.1, s.az + uz * 0.1], [s.bx - ux * 0.1, s.bz - uz * 0.1]]) lamp(x - uz * 3.0, z + ux * 3.0);
}
for (const plan of Object.values(HOST_PLAN)) {
  const [x, z] = hostToWorld(plan, (CELL.vest.x1 + 1.6) * plan.mirror, CELL.vest.z1 + 1.8);
  lamp(x, z);
}
// The Core on the great crater's floor, its split facing the player's ground.
landmarks.push({ asset: 'transmutation-core', pos: [ARENA.dome[0], 0, ARENA.dome[1]], rotY: 0, radius: ARENA.domeR + 5 });

const out = {
  id: 'cinderhalo',
  name: 'Cinder Halo',
  place: 'Crater sea',
  oneLine: 'Radioactivity, the three radiations, nuclear equations, stability, half-life, and the energy in a nucleus.',
  sky: 'cinderhalo-sky',
  ambience: { fogColor: 0x5b524b, fogNear: 70, fogFar: 460 },
  spawn: { pos: [...SPAWN], lookAt: [0, 1.6, 30] },
  pad: { pos: [PAD[0], 0, PAD[1]], r: 10 },
  arena: { boss: [...ARENA.boss], player: [...ARENA.player] },
  arenaRoute: routeTo('arena').map(p => p.map(round)),
  parts: Object.fromEntries(Object.entries(PARTS).map(([k, m]) => [k, { ...m, ground: round(height(m.x, m.z)) }])),
  cuts: CUTS.map(r => [...r]),
  roads: [],
  sites,
  landmarks,
  t2: {
    stillCamera: Object.fromEntries(Object.entries(HOST_PLAN).map(([id, plan]) => {
      const y = PARTS[plan.crater].floor;
      const eye = hostToWorld(plan, 0, APPROACH); const at = hostToWorld(plan, 0, 0);
      return [id, { pos: [round(eye[0]), y + 1.6, round(eye[1])], lookAt: [round(at[0]), y + 1.1, round(at[1])] }];
    }))
  },
  t1: { siteOrder: Object.keys(HOST_PLAN) }
};

const outPath = join(root, 'src/three/world-data/cinderhalo.json');
writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`Wrote ${outPath}: ${sites.length} sites, ${landmarks.length} landmarks.`);
