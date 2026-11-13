#!/usr/bin/env node
/**
 * gen-kettle-layout.mjs — Lays out Kettle's ground and writes `src/three/world-data/kettle.json`.
 *
 * Kettle is one ironworks building (`docs/plans/kettle-world.md` section 11). Its rooms, doorways and the two heaps
 * outside are declared in `src/three/kettle/works-plan.js`, and the eight hosts in `kettle/host-plan.js`; this script
 * writes them into the world's JSON with the sites, the yard's lamps, the pad, the spawn and the Golem's ground, and
 * holds the layout to the rules `verify:kettle` holds the built world to:
 *
 *   every room on the 2 m grid and no two overlapping; every door on a plane two rooms share, level across its
 *   threshold; every plate, its lane and its approach mark inside its own room, on a level floor; the Golem's ground
 *   inside the cast house; the pad, the spawn and the yard's lamps clear of the works and the heaps.
 *
 * The layout is DETERMINISTIC: there is nothing random in it (the seed is kept for the yard lamps' stagger only).
 *
 * Run: node tools/gen-kettle-layout.mjs
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { HOST_PLAN, LANE, APPROACH, toWorld } from '../src/three/kettle/host-plan.js';
import { buildVolumes, makeWorksPlan, HILLS, CLERESTORY, SPAWN, PAD, ARENA, WALK, FURNACE } from '../src/three/kettle/works-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const round = n => Math.round(n * 100) / 100;

let problems = 0;
const bad = msg => { problems++; console.error(`  LAYOUT: ${msg}`); };

const works = { volumes: buildVolumes(), hills: HILLS, clerestory: CLERESTORY, furnace: FURNACE };
const plan = makeWorksPlan({ works });

/* ---------------------------------------------------------------- the rooms */

const overlap = (a, b) => a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
for (const v of plan.volumes) {
  for (const k of ['minX', 'maxX', 'minZ', 'maxZ']) if (v.rect[k] % 2 !== 0) bad(`${v.id}: ${k} = ${v.rect[k]} is off the 2 m grid`);
  if (v.kind === 'bay' && (v.rect.maxX - v.rect.minX < 11.2 || v.rect.maxZ - v.rect.minZ < 11 || v.roof < 4.4)) bad(`${v.id}: a bench's room must be at least 11.2 x 11 m with 4.4 m of headroom`);
}
for (let i = 0; i < plan.volumes.length; i++) for (let j = i + 1; j < plan.volumes.length; j++) {
  if (overlap(plan.volumes[i].rect, plan.volumes[j].rect)) bad(`${plan.volumes[i].id} and ${plan.volumes[j].id} overlap`);
}
for (const v of plan.volumes) {
  for (const o of v.openings) {
    const r = v.rect;
    const along = o.side === 'minX' || o.side === 'maxX' ? [r.minZ, r.maxZ] : [r.minX, r.maxX];
    if (o.lo < along[0] || o.hi > along[1] || o.hi - o.lo < 2) bad(`${v.id}: its ${o.side} opening ${o.lo}..${o.hi} is off its side or under 2 m wide`);
    if (!o.to) continue;
    const other = plan.byId.get(o.to);
    if (!other) { bad(`${v.id}: a door to ${o.to}, which is no room`); continue; }
    const planeA = r[o.side], opp = { minX: 'maxX', maxX: 'minX', minZ: 'maxZ', maxZ: 'minZ' }[o.side];
    if (other.rect[opp] !== planeA) bad(`${v.id} and ${o.to} do not share the plane their door is on`);
    if (o.pass === false) continue;
    // Level across the threshold: both floors, sampled at both jambs.
    for (const s of [o.lo + 0.01, o.hi - 0.01]) {
      const e = 0.01;
      const [x, z] = o.side === 'minX' ? [planeA, s] : o.side === 'maxX' ? [planeA, s] : [s, planeA];
      const here = o.side === 'minX' || o.side === 'maxX'
        ? [plan.floorOf(v, o.side === 'minX' ? x + e : x - e, z), plan.floorOf(other, o.side === 'minX' ? x - e : x + e, z)]
        : [plan.floorOf(v, x, o.side === 'minZ' ? z + e : z - e), plan.floorOf(other, x, o.side === 'minZ' ? z - e : z + e)];
      if (Math.abs(here[0] - here[1]) > 0.02) bad(`${v.id} -> ${o.to}: the floor steps ${Math.abs(here[0] - here[1]).toFixed(2)} m at the door`);
    }
  }
}

/* ---------------------------------------------------------------- the sites */

const sites = Object.entries(HOST_PLAN).map(([id, p], i) => {
  const [ax, az] = toWorld(p, 0, APPROACH);
  const room = plan.byId.get(p.room);
  const inRoom = (x, z, m = 0.3) => x > room.rect.minX + m && x < room.rect.maxX - m && z > room.rect.minZ + m && z < room.rect.maxZ - m;
  if (!room) bad(`${id}: no room ${p.room}`);
  else {
    if (room.floor.y1 !== undefined) bad(`${id}: stands on a ramp`);
    for (const [lx, lz] of [[-2.5, -0.7], [2.5, -0.7], [-LANE.hw, LANE.to], [LANE.hw, LANE.to], [0, APPROACH]]) {
      const [x, z] = toWorld(p, lx, lz);
      if (!inRoom(x, z)) bad(`${id}: its plate or lane leaves ${p.room} at (${x.toFixed(1)}, ${z.toFixed(1)})`);
    }
  }
  const y = room ? room.floor.y0 : 0;
  return {
    id, questId: p.questId, stage: i + 1,
    pos: [p.pos[0], round(y), p.pos[1]],
    approachPos: [round(ax), round(y + 1.6), round(az)],
    label: p.label, structure: p.structure, built: true, room: p.room
  };
});
for (let i = 0; i < sites.length; i++) for (let j = i + 1; j < sites.length; j++) {
  const got = Math.hypot(sites[i].pos[0] - sites[j].pos[0], sites[i].pos[2] - sites[j].pos[2]);
  if (got < 8) bad(`${sites[i].id} and ${sites[j].id} are ${got.toFixed(1)} apart`);
}

/* ---------------------------------------------------------------- the yard */

const landmarks = [{ asset: 'landing-pad', pos: [PAD[0], 0, PAD[1]], radius: 10, minTier: 'T3' }];
const lampAt = (x, z) => landmarks.push({ asset: 'lamp-post', pos: [round(x), 0, round(z)], radius: 0.6, minTier: 'T3' });
// From the spawn to the charge door, either side of the way; then out along the way to the pad.
for (let z = SPAWN[2] - 4, i = 0; z >= 50; z -= 8, i++) lampAt(i % 2 ? 5.2 : -5.2, z);
for (let x = 14; x < PAD[0] - 12; x += 12) lampAt(x, 80.5);

const inWorks = (x, z, m) => plan.volumes.some(v => x > v.rect.minX - m && x < v.rect.maxX + m && z > v.rect.minZ - m && z < v.rect.maxZ + m);
const inHill = (x, z, m) => HILLS.some(h => x > h.rect.minX - m && x < h.rect.maxX + m && z > h.rect.minZ - m && z < h.rect.maxZ + m);
for (const l of landmarks) {
  if (inWorks(l.pos[0], l.pos[2], l.radius + 0.5)) bad(`${l.asset}@${l.pos[0]},${l.pos[2]} stands in the works`);
  if (inHill(l.pos[0], l.pos[2], l.radius + 1.5)) bad(`${l.asset}@${l.pos[0]},${l.pos[2]} stands on a heap`);
  if (Math.abs(l.pos[0]) > WALK - l.radius || Math.abs(l.pos[2]) > WALK - l.radius) bad(`${l.asset} is outside the walk`);
}
if (inWorks(SPAWN[0], SPAWN[2], 4) || inHill(SPAWN[0], SPAWN[2], 4)) bad('the spawn is not on open yard');
if (inHill(PAD[0], PAD[1], 22)) bad('a heap stands in the landing pad\'s approach');
{
  const cast = plan.byId.get('cast').rect;
  for (const p of [ARENA.boss, ARENA.player]) if (!(p[0] > cast.minX + 3 && p[0] < cast.maxX - 3 && p[2] > cast.minZ + 5 && p[2] < cast.maxZ - 2)) bad('the Golem\'s ground is not inside the cast house');
}

if (problems) { console.error(`${problems} layout problem(s); nothing written.`); process.exit(1); }

/* ---------------------------------------------------------------- the world */

// The way in, for the baked tier's roads and the ground's worn track: spawn to the charge door, and the pad's spur.
const roads = [
  { id: 'works-road', width: 5, pts: [[SPAWN[0], SPAWN[2] + 2], [0, 46]] },
  { id: 'pad-spur', width: 2.6, pts: [[0, 82], [PAD[0] - 9, PAD[1]]] }
];

const world = {
  id: 'kettle',
  name: 'Kettle',
  place: 'Foundry works',
  oneLine: 'Chemical equations, reaction types, and stoichiometry.',
  sky: 'kettle-sky',
  terrain: { heightmap: 'kettle-works', size: [240, 240], maxHeight: 11, material: 'soda-crust' },
  ambience: { keyLight: 0xffe0b0, fillLight: 0xcdbf9f, fogColor: 0xbfa77d, fogNear: 60, fogFar: 650, dustDensity: 0.4 },
  road: { radius: 0 },
  arena: ARENA,
  roads,
  landmarks,
  works,
  sites,
  spawn: { pos: SPAWN, lookAt: [0, 1.6, 40] },
  // The still for the baked tier stands at the approach mark, at the eye, on that room's floor.
  t2: { stillCamera: Object.fromEntries(sites.map(s => [s.id, { pos: s.approachPos, lookAt: [s.pos[0], round(s.pos[1] + 1.2), s.pos[2]] }])) },
  t1: { siteOrder: sites.map(s => s.id) },
  tracks: []
};

writeFileSync(join(root, 'src/three/world-data/kettle.json'), JSON.stringify(world, null, 2) + '\n');
console.log(`Kettle: ${works.volumes.length} rooms, ${works.volumes.reduce((n, v) => n + v.openings.length, 0) / 2 + 0.5 | 0} doors, ${HILLS.length} heaps, ${sites.length} sites, ${landmarks.length} yard landmarks written.`);
