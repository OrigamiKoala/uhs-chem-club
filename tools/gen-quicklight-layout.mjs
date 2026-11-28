#!/usr/bin/env node
/**
 * gen-quicklight-layout.mjs — Lays out Quicklight's refinery and writes `src/three/world-data/quicklight.json`.
 *
 * The alleys, the ramps, the courts and the rooms are declared in `src/three/quicklight/refinery-plan.js`, and which bench stands
 * in which room in `src/three/quicklight/host-plan.js`. This script checks the two agree, places the sites (plate, approach mark,
 * floor), the pad and the lamp posts on the two yards, and writes the JSON the stage, the voyage, the lower tiers and the checks
 * read. A site is `built` exactly when its quest has a module in `src/learn/quests/unit11/`. Deterministic: run it twice, get the
 * same file. (The first build's generator, which laid the benches in two columns either side of a spine road on a flat plate, is
 * in `archive/2026-11-17/site-quicklight/tools/`.)
 *
 * Run: node tools/gen-quicklight-layout.mjs
 */

import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  makeRefineryPlan, SPAWN, SPAWN_LOOK, PAD, ARENA, STACK, GRADE, PLOT, CELLAR, PIT, CAT, WALK
} from '../src/three/quicklight/refinery-plan.js';
import { HOST_PLAN, LANE, APPROACH, toWorld } from '../src/three/quicklight/host-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const round = n => Math.round(n * 100) / 100;
let problems = 0;
const bad = msg => { problems++; console.error(`  ${msg}`); };

const plan = makeRefineryPlan();
for (const p of plan.problems()) bad(p);

/* ---------------------------------------------------------------- the sites */

const sites = Object.entries(HOST_PLAN).map(([id, p], i) => {
  const room = plan.roomById.get(p.room);
  if (!room) { bad(`${id}: no room ${p.room}`); return null; }
  if (room.site !== id) bad(`${id}: ${room.id} is declared for ${room.site}`);
  const [ax, az] = toWorld(p, 0, APPROACH);
  // The plate, its feet and its lane lie on the room's level floor, inside it.
  for (const [lx, lz] of [[-2.5, -0.7], [2.5, -0.7], [-LANE.hw, LANE.from], [LANE.hw, LANE.from], [-LANE.hw, LANE.to], [LANE.hw, LANE.to], [0, APPROACH]]) {
    const [x, z] = toWorld(p, lx, lz);
    if (plan.volumeAt(x, z) !== room.vol) bad(`${id}: its plate or lane leaves ${room.id} at (${x.toFixed(1)}, ${z.toFixed(1)})`);
    if (Math.abs(plan.height(x, z) - room.level) > 1e-6) bad(`${id}: the floor under its plate or lane is not level at (${x.toFixed(1)}, ${z.toFixed(1)})`);
  }
  const built = existsSync(join(root, 'src/learn/quests/unit11', `${p.questId}.js`));
  return {
    id, questId: p.questId, stage: i + 1,
    pos: [p.pos[0], round(room.level), p.pos[1]],
    approachPos: [round(ax), round(room.level + 1.6), round(az)],
    label: p.label, structure: p.structure, built, room: room.id
  };
}).filter(Boolean);
for (let i = 0; i < sites.length; i++) for (let j = i + 1; j < sites.length; j++) {
  const d = Math.hypot(sites[i].pos[0] - sites[j].pos[0], sites[i].pos[2] - sites[j].pos[2]);
  if (d < 20) bad(`${sites[i].id} and ${sites[j].id} are ${d.toFixed(1)} m apart`);
}

/* ---------------------------------------------------------------- the pad and the lamp posts */

// The alleys are lit from the pipe racks over them (`quicklight/plant.js`); posts stand only on the two open yards.
const landmarks = [{ asset: 'landing-pad', pos: [PAD[0], GRADE, PAD[1]], rotY: 0, radius: 10, minTier: 'T3' }];
const post = (x, z) => landmarks.push({ asset: 'lamp-post', pos: [round(x), round(plan.height(x, z)), round(z)], rotY: 0, radius: 0.6, minTier: 'T3' });
// The laydown yard: along its east edge by the two alleys' mouths, and its south/west perimeter clear of the pad.
post(-61.2, -56);
post(-61.2, -74);
post(-74, -55.4);
post(-93.6, -55.4);
post(-93.6, -93.6);
// The flare yard: inside its fence, round the Flare's ground.
for (const [x, z] of [[41.4, 60], [41.4, 74], [41.4, 88.6], [56, 88.6], [56, 53.4], [72, 53.4], [84.6, 60], [55, 67]]) post(x, z);
for (const l of landmarks) {
  if (l.asset === 'landing-pad') continue;
  const v = plan.volumeAt(l.pos[0], l.pos[2]);
  if (!v || v.kind !== 'yard') bad(`lamp-post@${l.pos[0]},${l.pos[2]} is not on a yard`);
  if (Math.hypot(l.pos[0] - ARENA.boss[0], l.pos[2] - ARENA.boss[2]) < 9) bad(`lamp-post@${l.pos[0]},${l.pos[2]} is on the Flare's ground`);
  if (Math.hypot(l.pos[0] - PAD[0], l.pos[2] - PAD[1]) < 11) bad(`lamp-post@${l.pos[0]},${l.pos[2]} is on the pad`);
  if (Math.hypot(l.pos[0] - STACK.x, l.pos[2] - STACK.z) < 6) bad(`lamp-post@${l.pos[0]},${l.pos[2]} is at the stack's foot`);
}
if (Math.hypot(SPAWN[0] - PAD[0], SPAWN[2] - PAD[1]) < 14) bad('the spawn is on the pad');
if (plan.volumeAt(SPAWN[0], SPAWN[2])?.id !== 'yard') bad('the spawn is not on the laydown yard');
if (plan.volumeAt(ARENA.boss[0], ARENA.boss[2])?.id !== 'flare' || plan.volumeAt(ARENA.player[0], ARENA.player[2])?.id !== 'flare') bad('the Flare\'s ground is not in the flare yard');

/* ---------------------------------------------------------------- the world */

if (problems) { console.error(`${problems} layout problem(s); nothing written.`); process.exit(1); }

const world = {
  id: 'quicklight',
  name: 'Quicklight',
  place: 'Storm-belt refinery',
  oneLine: 'Reaction rates, rate laws, half-life, collisions, mechanisms and catalysts.',
  sky: 'quicklight-sky',
  ambience: { keyLight: 0xf3d4a4, fillLight: 0x8da0b8, fogColor: 0x4d5463, fogNear: 50, fogFar: 520 },
  walk: WALK,
  refinery: {
    levels: { grade: GRADE, plot: PLOT, cellar: CELLAR, pit: PIT, cat: CAT },
    volumes: plan.volumes.map(v => ({ id: v.id, kind: v.kind, rect: v.rect })),
    rooms: plan.rooms.map(r => ({ id: r.id, site: r.site, shell: r.shell, rect: r.vol.rect, floor: r.level, top: r.top }))
  },
  arena: { boss: [...ARENA.boss], player: [...ARENA.player] },
  roads: [],
  landmarks,
  sites,
  spawn: { pos: SPAWN, lookAt: SPAWN_LOOK },
  // The still for the baked tier stands at the approach mark, at the eye, on its room's floor, looking at the plate.
  t2: { stillCamera: Object.fromEntries(sites.map(s => [s.id, { pos: s.approachPos, lookAt: [s.pos[0], round(s.pos[1] + 1.2), s.pos[2]] }])) },
  t1: { siteOrder: sites.map(s => s.id) }
};

writeFileSync(join(root, 'src/three/world-data/quicklight.json'), JSON.stringify(world, null, 2) + '\n');
console.log(`Quicklight: ${plan.volumes.length} volumes (${plan.rooms.length} rooms), ${sites.length} sites, ${landmarks.length} landmarks written.`);
