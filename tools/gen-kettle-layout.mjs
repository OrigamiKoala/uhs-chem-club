#!/usr/bin/env node
/**
 * gen-kettle-layout.mjs — Lays out Kettle's ground and writes `src/three/world-data/kettle.json`.
 *
 * Kettle is an automated foundry works on a soda flat. A slag road runs north from the landing pad and the
 * spawn to the blast furnace; the eight hosts stand either side of it (the odd benches on the west, the even
 * on the east, plates turned to the road), a spur runs to each approach, and a lane of work lamps lines the
 * road and every spur in bench order. Behind the open ground in front of the furnace (where the Recipe Golem
 * is fought) stand a row of silos, two conveyors and the stacks; tanks, slag heaps, ingots and crates fill
 * the flat between.
 *
 * The layout is DETERMINISTIC (seeded) and holds itself to the rules `verify:kettle` holds the world to:
 * every footprint disjoint, every host's extent and lane clear of every free prop, every approach on open
 * ground, the boss's ground and the corridor to it kept open.
 *
 * Run: node tools/gen-kettle-layout.mjs
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { HOST_PLAN, LANE, APPROACH } from '../src/three/kettle/host-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0x4e771e);
const round = n => Math.round(n * 100) / 100;

/** Where the Golem is fought: open ground in front of the furnace, with the player's mark south of it. */
const ARENA = { boss: [0, 0, -60], player: [0, 1.6, -44] };
const SPAWN = [0, 1.6, 92];
const PAD = [56, 78];
const WALK = 94;      // props stand inside this; the walk is held to 100

/* ---------------------------------------------------------------- the sites */

const SITE_DEFS = Object.entries(HOST_PLAN).map(([id, plan], i) => ({ id, plan, stage: i + 1, pos: plan.pos, f: plan.face }));

/** A host-frame point as a world point: x to the player's right, z toward the player. */
function toWorld(def, lx, lz) {
  const [px, pz] = def.pos;
  const [fx, fz] = def.f;
  return [px + lx * fz + lz * fx, pz - lx * fx + lz * fz];
}
function hostRect(def, [x0, x1, z0, z1]) {
  const pts = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].map(([lx, lz]) => toWorld(def, lx, lz));
  return { minX: Math.min(...pts.map(p => p[0])), maxX: Math.max(...pts.map(p => p[0])), minZ: Math.min(...pts.map(p => p[1])), maxZ: Math.max(...pts.map(p => p[1])) };
}
const unionRect = (a, b) => ({ minX: Math.min(a.minX, b.minX), maxX: Math.max(a.maxX, b.maxX), minZ: Math.min(a.minZ, b.minZ), maxZ: Math.max(a.maxZ, b.maxZ) });
const rectDist = (x, z, r) => Math.hypot(Math.max(r.minX - x, 0, x - r.maxX), Math.max(r.minZ - z, 0, z - r.maxZ));
const rectOverlap = (a, b) => a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;

const sites = SITE_DEFS.map(d => {
  const [fx, fz] = d.f;
  const area = unionRect(hostRect(d, d.plan.extent), hostRect(d, [-LANE.hw, LANE.hw, LANE.from, LANE.to]));
  const cx = (area.minX + area.maxX) / 2, cz = (area.minZ + area.maxZ) / 2;
  return {
    id: d.id, questId: d.plan.questId, stage: d.stage,
    pos: [d.pos[0], 0, d.pos[1]],
    approachPos: [round(d.pos[0] + fx * APPROACH), 1.6, round(d.pos[1] + fz * APPROACH)],
    label: d.plan.label,
    structure: d.plan.structure, built: true,
    flat: { x: round(cx), z: round(cz), r: round(Math.hypot(area.maxX - area.minX, area.maxZ - area.minZ) / 2 + 0.8) }
  };
});

/* ---------------------------------------------------------------- the props */

const landmarks = [];
const taken = [];       // { x, z, r }
const KEEP = [];        // rects no free prop may stand in
const keep = (name, r, { margin = 0.8, owner = null } = {}) => KEEP.push({ name, ...r, margin, owner });
function fits(x, z, r, pad = 0.6) {
  if (Math.abs(x) > WALK - r || Math.abs(z) > WALK - r) return false;
  if (!taken.every(t => Math.hypot(x - t.x, z - t.z) >= t.r + r + pad)) return false;
  return KEEP.every(k => rectDist(x, z, k) >= r + k.margin);
}
function add(asset, x, z, radius, extra = {}) {
  landmarks.push({ asset, pos: [round(x), 0, round(z)], radius, ...extra });
  taken.push({ x, z, r: radius });
}

for (const d of SITE_DEFS) {
  keep(`${d.id} host`, hostRect(d, d.plan.extent), { owner: d.id });
  keep(`${d.id} approach`, hostRect(d, [-LANE.hw, LANE.hw, LANE.from, LANE.to]), { margin: 0.2, owner: d.id });
}
for (const s of sites) taken.push({ x: s.approachPos[0], z: s.approachPos[2], r: 3.2 });

// The works road (spawn to the arena's mark), the spurs, the pad and its spur, and the boss's ground and the corridor to it.
const roads = [];
const trunk = [[0, SPAWN[2] + 2], [0, ARENA.player[2] + 1]];
roads.push({ id: 'works-road', width: 3.4, pts: trunk });
for (let z = SPAWN[2]; z >= -38; z -= 5) taken.push({ x: 0, z, r: 3.4 });
for (const s of sites) {
  const [ax, , az] = s.approachPos;
  roads.push({ id: `spur-${s.id}`, width: 2.4, pts: [[0, az], [ax * 1.0, az]] });
  for (let x = 4; x <= Math.abs(ax); x += 3) taken.push({ x: Math.sign(ax) * x, z: az, r: 2.2 });
}
roads.push({ id: 'pad-spur', width: 2.6, pts: [[0, 84], [PAD[0] - 9.0, PAD[1]]] });
for (let x = 4; x < PAD[0] - 8; x += 3) taken.push({ x, z: 84 + (PAD[1] - 84) * (x / (PAD[0] - 9)), r: 2.6 });
taken.push({ x: ARENA.boss[0], z: ARENA.boss[2], r: 11 });
taken.push({ x: ARENA.player[0], z: ARENA.player[2], r: 5 });
for (let z = ARENA.player[2]; z >= ARENA.boss[2]; z -= 4) taken.push({ x: 0, z, r: 4.4 });

// The landing pad.
add('landing-pad', PAD[0], PAD[1], 10, { minTier: 'T3' });
taken.push({ x: PAD[0], z: PAD[1], r: 21 });

/* ---- the plant: the furnace behind the arena, silos in a row, conveyors, stacks, tanks ---- */
add('furnace', 0, -92, 13, { minTier: 'T3' });
for (const x of [-60, -48, -36, -24, 24, 36, 48, 60]) add('silo', x, -76, 3.2, { minTier: 'T3' });
for (const sx of [-1, 1]) add('conveyor', sx * 32, -90, 10, { minTier: 'T3' });
for (const sx of [-1, 1]) add('chimney', sx * 58, -94, 3.2, { minTier: 'T3' });
for (const sx of [-1, 1]) for (const z of [-24, 4, 30]) if (fits(sx * 72, z, 5)) add('tank', sx * 72, z, 5, { minTier: 'T3' });

function scatter(asset, count, test, radius, extra = () => ({})) {
  let placed = 0;
  for (let k = 0; k < 6000 && placed < count; k++) {
    const x = (rnd() - 0.5) * 2 * WALK, z = (rnd() - 0.5) * 2 * WALK;
    if (!test(x, z) || !fits(x, z, radius)) continue;
    add(asset, x, z, radius, extra());
    placed++;
  }
}
const outer = (x, z) => Math.abs(x) > 56 || z > 70;
scatter('slag-heap', 12, (x, z) => outer(x, z) || Math.abs(z) > 62, 3.6, () => ({ scale: round(0.8 + rnd() * 0.5), rotY: round(rnd() * 6.28), minTier: 'T3' }));
scatter('ingot-stack', 6, (x, z) => z < -50 || Math.abs(x) > 56, 2.0, () => ({ rotY: round(rnd() * 6.28), minTier: 'T4' }));
scatter('crate-stack', 6, (x, z) => Math.abs(x) > 50 || z > 66, 2.0, () => ({ rotY: round(rnd() * 6.28), minTier: 'T4' }));

/* ---- the lamps: down the road, and along every spur, in bench order ---- */
const lampAt = (x, z) => landmarks.push({ asset: 'lamp-post', pos: [round(x), 0, round(z)], radius: 0.6, minTier: 'T3' });
for (let z = SPAWN[2] - 4, i = 0; z >= -36; z -= 10, i++) lampAt(i % 2 ? 2.8 : -2.8, z);
for (const s of sites) {
  const [ax, , az] = s.approachPos;
  const dir = Math.sign(ax);
  for (let x = 12, i = 0; x <= Math.abs(ax) - 4.5; x += 11, i++) lampAt(dir * x, az + (i % 2 ? 1.9 : -1.9));
}
for (let x = 14; x < PAD[0] - 12; x += 12) lampAt(x, 84 + (PAD[1] - 84) * (x / (PAD[0] - 9)) + 2.2);

/* ---------------------------------------------------------------- self-check */

let problems = 0;
const bad = msg => { problems++; console.error(`  LAYOUT: ${msg}`); };
const nm = l => `${l.asset}@${l.pos[0]},${l.pos[2]}`;
for (const l of landmarks) {
  for (const k of KEEP) if (rectDist(l.pos[0], l.pos[2], k) < l.radius + (k.margin > 0.5 ? 0.3 : 0.05) - 0.001) bad(`${nm(l)} stands in the ${k.name} keep-out`);
}
for (let i = 0; i < KEEP.length; i++) for (let j = i + 1; j < KEEP.length; j++) {
  const a = KEEP[i], b = KEEP[j];
  if (a.owner && a.owner === b.owner) continue;
  if (rectOverlap(a, b)) bad(`${a.name} and ${b.name} extents overlap`);
}
for (const l of landmarks.filter(l => l.asset !== 'lamp-post' && l.asset !== 'landing-pad')) {
  if (Math.hypot(l.pos[0] - ARENA.boss[0], l.pos[2] - ARENA.boss[2]) < 11 + l.radius) bad(`${nm(l)} reaches the Golem's ground`);
}
for (let i = 0; i < sites.length; i++) for (let j = i + 1; j < sites.length; j++) {
  const got = Math.hypot(sites[i].pos[0] - sites[j].pos[0], sites[i].pos[2] - sites[j].pos[2]);
  if (got < 8) bad(`${sites[i].id} and ${sites[j].id} are ${got.toFixed(1)} apart`);
}
if (problems) { console.error(`${problems} layout problem(s); nothing written.`); process.exit(1); }

/* ---------------------------------------------------------------- the world */

const world = {
  id: 'kettle',
  name: 'Kettle',
  place: 'Foundry works',
  oneLine: 'Counting what goes into a reaction and what comes out of it.',
  sky: 'kettle-sky',
  terrain: { heightmap: 'kettle-flat', size: [240, 240], maxHeight: 1.0, material: 'soda-crust' },
  ambience: { keyLight: 0xffe0b0, fillLight: 0xcdbf9f, fogColor: 0xbfa77d, fogNear: 60, fogFar: 650, dustDensity: 0.4 },
  road: { radius: 0 },
  arena: ARENA,
  roads,
  landmarks,
  sites,
  spawn: { pos: SPAWN, lookAt: [0, 1.6, 40] },
  t2: { stillCamera: Object.fromEntries(sites.map(s => [s.id, { pos: s.approachPos, lookAt: [s.pos[0], 1.2, s.pos[2]] }])) },
  t1: { siteOrder: sites.map(s => s.id) },
  tracks: []
};

writeFileSync(join(root, 'src/three/world-data/kettle.json'), JSON.stringify(world, null, 2) + '\n');
const count = a => landmarks.filter(l => l.asset === a).length;
console.log(`Kettle: ${landmarks.length} landmarks (${count('silo')} silos, ${count('lamp-post')} lamps, ${count('slag-heap')} slag heaps), ${sites.length} sites, ${roads.length} roads written.`);
