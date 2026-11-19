#!/usr/bin/env node
/**
 * gen-lanternfall-layout.mjs — Lays out Lanternfall's lake shore and glacier walk and writes
 * `src/three/world-data/lanternfall.json`.
 *
 * Deterministic, derived from `src/three/lanternfall/glacier-plan.js` (the walk, the rooms, the height field) and
 * `src/three/lanternfall/host-plan.js`. Site ids (`site-1..10`), `questId`, `label`, `stage` and `built` are kept
 * exactly as they were (read from the file this replaces, so the generator can never rename a bench).
 *
 * Run: node tools/gen-lanternfall-layout.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  ROOMS, sitePlacement, PAD, PAD_R, SPAWN, SPAWN_LOOK, ARENA, LAKE, makeGlacierPlan
} from '../src/three/lanternfall/glacier-plan.js';
import { HOST_PLAN } from '../src/three/lanternfall/host-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'src/three/world-data/lanternfall.json');
const round = n => Math.round(n * 100) / 100;
const plan = makeGlacierPlan();
const prior = JSON.parse(readFileSync(out, 'utf8'));
const priorSite = id => prior.sites.find(s => s.id === id);

/* ---------------------------------------------------------------- the sites */

const sites = ROOMS.map(rm => {
  const was = priorSite(rm.site);
  if (!was || was.questId !== rm.questId) throw new Error(`${rm.site}: the plan names ${rm.questId}, the world had ${was?.questId}`);
  const { pos, approachPos } = sitePlacement(rm);
  return {
    id: was.id, questId: was.questId, stage: was.stage, roomId: rm.id,
    pos, approachPos, label: was.label, structure: HOST_PLAN[rm.site].structure, built: was.built
  };
});

/* ---------------------------------------------------------------- landmarks */

const landmarks = [];
const add = (asset, x, z, radius, extra = {}) => {
  landmarks.push({ asset, pos: [round(x), round(plan.height(x, z)), round(z)], radius, ...extra });
};

// The pad on the south yard.
add('landing-pad', PAD[0], PAD[1], PAD_R + 0.6, { minTier: 'T3' });

// THE LANTERN ROAD: posts down every open volume of the walk, 0.6 m in from a side, every ~11 m, alternating sides,
// never in front of a door or an opening, and never on the pad.
{
  const posts = [];
  const IN = 0.75;
  for (const v of plan.openVols) {
    const r = v.rect;
    const alongX = (r.maxX - r.minX) >= (r.maxZ - r.minZ);
    const len = alongX ? r.maxX - r.minX : r.maxZ - r.minZ;
    const n = Math.max(1, Math.round(len / 11));
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const flip = (i + (v.id.length % 2)) % 2 === 0;
      let x, z, side;
      if (alongX) { x = r.minX + (r.maxX - r.minX) * t; z = flip ? r.minZ + IN : r.maxZ - IN; side = flip ? 'minZ' : 'maxZ'; }
      else { z = r.minZ + (r.maxZ - r.minZ) * t; x = flip ? r.minX + IN : r.maxX - IN; side = flip ? 'minX' : 'maxX'; }
      // Not in an opening's mouth on that side (a door or the way on).
      const along = side.endsWith('X') ? z : x;
      const blocked = v.openings.some(o => o.side === side && along > o.lo - 1.6 && along < o.hi + 1.6);
      if (blocked) {
        const other = { minX: 'maxX', maxX: 'minX', minZ: 'maxZ', maxZ: 'minZ' }[side];
        const blocked2 = v.openings.some(o => o.side === other && along > o.lo - 1.6 && along < o.hi + 1.6);
        if (blocked2) continue;
        if (side === 'minX') x = r.maxX - IN; else if (side === 'maxX') x = r.minX + IN;
        else if (side === 'minZ') z = r.maxZ - IN; else z = r.minZ + IN;
      }
      if (Math.hypot(x - PAD[0], z - PAD[1]) < PAD_R + 6) continue;
      // Clear of the boss's ring and of the spawn.
      if (Math.hypot(x - ARENA.boss[0], z - ARENA.boss[2]) < 9 || Math.hypot(x - ARENA.player[0], z - ARENA.player[2]) < 4) continue;
      if (Math.hypot(x - SPAWN[0], z - SPAWN[2]) < 2) continue;
      if (posts.some(p => Math.hypot(p[0] - x, p[1] - z) < 6)) continue;
      posts.push([x, z]);
    }
  }
  for (const [x, z] of posts) add('lantern-post', x, z, 0.45, { minTier: 'T3' });
}

// THE AURORA MASTS on the east moraine: one over the vault (its photocell cable goes down to Bench 2), two up the crest.
add('aurora-mast', 66.6, 7.6, 1.2, { minTier: 'T3' });
add('aurora-mast', 61, -22, 1.2, { minTier: 'T3' });
add('aurora-mast', 61.5, -50, 1.2, { minTier: 'T3' });
// The comms mast on the outwash plain's rise, south of the yard.
add('comms-mast', -24, 86, 1.6, { minTier: 'T3' });
// The expedition's living camp beyond the yard's south edge, and the sled it came on.
add('camp', -8, 81, 2.4, { rotY: 0.4, minTier: 'T3' });
add('camp', 14, 83, 2.4, { rotY: -0.3, minTier: 'T3' });
add('sled', 4, 79, 1.2, { rotY: 1.2, minTier: 'T4' });

/* ---------------------------------------------------------------- t2 & t1 */

const stillCamera = {};
for (const s of sites) {
  stillCamera[s.id] = { pos: [...s.approachPos], lookAt: [s.pos[0], round(s.pos[1] + 1.2), s.pos[2]] };
}

const data = {
  id: 'lanternfall',
  name: prior.name,
  place: prior.place,
  oneLine: prior.oneLine,
  sky: prior.sky,
  terrain: { heightmap: 'lanternfall-glacier', size: [240, 240], maxHeight: 16, material: 'packed-ice' },
  ambience: prior.ambience,
  lake: { x: LAKE.x, z: LAKE.z, rx: LAKE.rx, rz: LAKE.rz, radius: LAKE.rz },
  arena: { boss: ARENA.boss, player: ARENA.player },
  spawn: { pos: SPAWN, lookAt: SPAWN_LOOK },
  sites,
  landmarks,
  t2: { stillCamera },
  t1: { siteOrder: sites.map(s => s.id) },
  tracks: []
};

writeFileSync(out, JSON.stringify(data, null, 2) + '\n');
console.log(`wrote src/three/world-data/lanternfall.json: ${sites.length} sites, ${landmarks.length} landmarks`);
