#!/usr/bin/env node
/**
 * gen-lodestone-layout.mjs — Lays out Lodestone's slot canyon and writes `src/three/world-data/lodestone.json`.
 *
 * The canyon, its alcoves, the hollow and the pothole are declared in `src/three/lodestone/canyon-plan.js`, and which
 * bench stands in which alcove in `src/three/lodestone/host-plan.js`. This script checks the two agree, places the sites
 * (plate, approach mark, floor height), the pad and the hollow's lamps, and writes the JSON the stage, the voyage, the
 * lower tiers and the checks read. Deterministic: run it twice, get the same file.
 *
 * Run: node tools/gen-lodestone-layout.mjs
 */

import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { makeCanyonPlan, SPAWN, SPAWN_LOOK, PAD, ARENA, HOLLOW, POTHOLE, LINE, WALK } from '../src/three/lodestone/canyon-plan.js';
import { HOST_PLAN, LANE, APPROACH, toWorld } from '../src/three/lodestone/host-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const round = n => Math.round(n * 100) / 100;
let problems = 0;
const bad = msg => { problems++; console.error(`  ${msg}`); };

const plan = makeCanyonPlan();
for (const p of plan.problems()) bad(p);

/* ---------------------------------------------------------------- the sites */

const sites = Object.entries(HOST_PLAN).map(([id, p], i) => {
  const al = plan.alcoveById.get(p.alcove);
  if (!al) { bad(`${id}: no alcove ${p.alcove}`); return null; }
  if (al.site !== id) bad(`${id}: alcove ${al.id} is declared for ${al.site}`);
  const [ax, az] = toWorld(p, 0, APPROACH);
  // The plate, its feet and its lane lie on the alcove's level floor, under its roof.
  for (const [lx, lz] of [[-2.5, -0.7], [2.5, -0.7], [-LANE.hw, LANE.from], [LANE.hw, LANE.from], [-LANE.hw, LANE.to], [LANE.hw, LANE.to], [0, APPROACH]]) {
    const [x, z] = toWorld(p, lx, lz);
    if (plan.alcoveAt(x, z) !== al) bad(`${id}: its plate or lane leaves ${al.id} at (${x.toFixed(1)}, ${z.toFixed(1)})`);
    if (Math.abs(plan.height(x, z) - al.floor) > 1e-6) bad(`${id}: the floor under its plate or lane is not level at (${x.toFixed(1)}, ${z.toFixed(1)})`);
  }
  if (!existsSync(join(root, 'src/learn/quests/unit12', `${p.questId}.js`))) bad(`${id}: no quest module ${p.questId}`);
  return {
    id, questId: p.questId, stage: i + 1,
    pos: [p.pos[0], round(al.floor), p.pos[1]],
    approachPos: [round(ax), round(al.floor + 1.6), round(az)],
    label: p.label, structure: p.structure, built: true, alcove: al.id
  };
}).filter(Boolean);
for (let i = 0; i < sites.length; i++) for (let j = i + 1; j < sites.length; j++) {
  const d = Math.hypot(sites[i].pos[0] - sites[j].pos[0], sites[i].pos[2] - sites[j].pos[2]);
  if (d < 20) bad(`${sites[i].id} and ${sites[j].id} are ${d.toFixed(1)} m apart`);
}

/* ---------------------------------------------------------------- the hollow */

const landmarks = [{ asset: 'landing-pad', pos: [PAD[0], 0, PAD[1]], rotY: 0, radius: 10, minTier: 'T3' }];
// From the spawn to the cleft's mouth, along the way a player walks.
for (const [x, z] of [[40.5, 82], [37.5, 70.4]]) landmarks.push({ asset: 'lamp-post', pos: [x, 0, z], rotY: 0, radius: 0.6, minTier: 'T3' });
for (const l of landmarks) {
  const k = plan.sample(l.pos[0], l.pos[2]);
  if (k.shape !== 'hollow' || k.depth < l.radius + 0.6) bad(`${l.asset}@${l.pos[0]},${l.pos[2]} is not on the hollow's floor`);
}
if (Math.hypot(SPAWN[0] - PAD[0], SPAWN[2] - PAD[1]) < 14) bad('the spawn is on the pad');

/* ---------------------------------------------------------------- the world */

if (problems) { console.error(`${problems} layout problem(s); nothing written.`); process.exit(1); }

const world = {
  id: 'lodestone',
  name: 'Lodestone',
  place: 'Iron canyons',
  oneLine: 'd electrons, many charges, complex ions, their shapes, colour and magnetism.',
  sky: 'lodestone-sky',
  ambience: { keyLight: 0xf0a878, fillLight: 0xb08a74, fogColor: 0x6a4434, fogNear: 90, fogFar: 640 },
  walk: WALK,
  canyon: {
    line: LINE.map(p => ({ id: p.id, pos: [p.x, p.y, p.z] })),
    hollow: HOLLOW.rect,
    pothole: { pos: [POTHOLE.x, POTHOLE.floor, POTHOLE.z], r: POTHOLE.r },
    alcoves: plan.alcoves.map(a => ({ id: a.id, site: a.site, rect: a.rect, face: a.face, floor: a.floor, roof: a.roof }))
  },
  arena: { boss: [...ARENA.boss], player: [...ARENA.player] },
  roads: [],
  landmarks,
  sites,
  spawn: { pos: SPAWN, lookAt: SPAWN_LOOK },
  // The still for the baked tier stands at the approach mark, at the eye, on its alcove's floor, looking at the plate.
  t2: { stillCamera: Object.fromEntries(sites.map(s => [s.id, { pos: s.approachPos, lookAt: [s.pos[0], round(s.pos[1] + 1.2), s.pos[2]] }])) },
  t1: { siteOrder: sites.map(s => s.id) }
};

writeFileSync(join(root, 'src/three/world-data/lodestone.json'), JSON.stringify(world, null, 2) + '\n');
console.log(`Lodestone: a canyon ${plan.length.toFixed(0)} m long, ${plan.alcoves.length} alcoves, ${sites.length} sites, ${landmarks.length} landmarks written.`);
