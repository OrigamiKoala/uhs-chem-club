#!/usr/bin/env node
/**
 * gen-brinewire-layout.mjs — Lays out Brinewire's ground and writes `src/three/world-data/brinewire.json`.
 *
 * Brinewire is a copper marsh: a salt flat crossed by the grid, on boardwalks. A plank spine runs south from the landing pad
 * and the spawn through the middle of it to the switch-house court on the shore of the largest pool (the lagoon), where the Clamp
 * is fought. Six boardwalk spurs run out from the spine (the odd benches on the west, the even on the east, plates turned to the
 * spine), each ending in a deck that holds one host. The pools are the rectangles of brine between the spurs; the walkable ground
 * is the boardwalks and the mud banks beside them, and `brinewire.js` fences each pool with a box. A lattice pylon or a brine tank
 * on a footing stands in the middle of every pool, and cables are strung from pylon to pylon over the pools; transformers, cable
 * reels, salt heaps and stacks stand on the land behind the hosts.
 *
 * The layout is DETERMINISTIC (seeded) and holds itself to the rules `verify:brinewire` holds the world to: every
 * footprint disjoint, every host's extent and lane clear of every pool and every free prop, every approach on open
 * ground, the boss's plaza and the corridor to it kept open. A site is `built` exactly when its quest has a module
 * in `src/learn/quests/unit10/`. A host exists for every quest of the plan whether or not its quest is built.
 *
 * Run: node tools/gen-brinewire-layout.mjs
 */

import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { HOST_PLAN, LANE, APPROACH } from '../src/three/brinewire/host-plan.js';

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
const rnd = mulberry32(0xb41e77);
const round = n => Math.round(n * 100) / 100;

/** Where the Clamp is fought: the switch-house court on the shore of the largest pool, with the player's mark south of it. */
const ARENA = { boss: [0, 0, -54], player: [0, 1.6, -38] };
const PLAZA = { minX: -14, maxX: 14, minZ: -62, maxZ: -32 };
const SPAWN = [0, 1.6, 92];
const PAD = [60, 84];
const WALK = 94;      // props stand inside this; the walk is held to 100
const CAUSEWAY = 4;   // half the causeway's width of land either side of its middle line (the pools stand off this)

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
const rectOverlap = (a, b, gap = 0) => a.minX < b.maxX + gap && a.maxX > b.minX - gap && a.minZ < b.maxZ + gap && a.maxZ > b.minZ - gap;

const questExists = id => existsSync(join(root, 'src/learn/quests/unit10', `${id}.js`));

const sites = SITE_DEFS.map(d => {
  const [fx, fz] = d.f;
  const area = unionRect(hostRect(d, d.plan.extent), hostRect(d, [-LANE.hw, LANE.hw, LANE.from, LANE.to]));
  const cx = (area.minX + area.maxX) / 2, cz = (area.minZ + area.maxZ) / 2;
  return {
    id: d.id, questId: d.plan.questId, stage: d.stage,
    pos: [d.pos[0], 0, d.pos[1]],
    approachPos: [round(d.pos[0] + fx * APPROACH), 1.6, round(d.pos[1] + fz * APPROACH)],
    label: d.plan.label,
    structure: d.plan.structure, built: questExists(d.plan.questId),
    flat: { x: round(cx), z: round(cz), r: round(Math.hypot(area.maxX - area.minX, area.maxZ - area.minZ) / 2 + 0.8) }
  };
});

/* ---------------------------------------------------------------- the pools */

const pools = [];
const pool = (id, minX, maxX, minZ, maxZ, extra = {}) => pools.push({ id, minX, maxX, minZ, maxZ, ...extra });
const SPUR = 3.4;                                   // a spur's half-width of land
const WEST = SITE_DEFS.filter((_, i) => i % 2 === 0).map(d => d.pos[1]).sort((a, b) => b - a);   // 62, 28, -6
const EAST = SITE_DEFS.filter((_, i) => i % 2 === 1).map(d => d.pos[1]).sort((a, b) => b - a);   // 46, 12, -22
const PX0 = 4.5, PX1 = 35;                          // a pool runs from just off the causeway to just short of the host heads
// West: north of the first spur, between the spurs, and south of the last (to the plaza's shoulder).
pool('pool-w0', -PX1, -PX0, WEST[0] + SPUR, 93);
for (let i = 0; i < 2; i++) pool(`pool-w${i + 1}`, -PX1, -PX0, WEST[i + 1] + SPUR, WEST[i] - SPUR);
pool('pool-w3', -PX1, -15.5, -59, WEST[2] - SPUR);
// East: north of the pad's spur is land; the pad's spur is z = 84.
pool('pool-e0', PX0, PX1, EAST[0] + SPUR, 84 - SPUR);
for (let i = 0; i < 2; i++) pool(`pool-e${i + 1}`, PX0, PX1, EAST[i + 1] + SPUR, EAST[i] - SPUR);
pool('pool-e3', 15.5, PX1, -59, EAST[2] - SPUR);
// The largest pool (the lagoon) lies along the court's south shore, wider than the walk.
pool('pool-lagoon', -95, 95, -130, PLAZA.minZ, { largest: true });
// The pools beyond the walk, to keep the pattern going to the horizon (no collider).
pool('far-w', -200, -112, -100, 100, { decor: true });
pool('far-e', 112, 200, -100, 100, { decor: true });
pool('far-s', -80, 80, 112, 190, { decor: true });
for (const p of pools) { p.area = round((p.maxX - p.minX) * (p.maxZ - p.minZ)); }

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
// Land props keep out of every pool (the near ones are fenced; the far ones are water), and out of the plaza.
for (const p of pools) keep(p.id, p, { margin: 1.0 });
keep('plaza', PLAZA, { margin: 1.0 });
for (const s of sites) taken.push({ x: s.approachPos[0], z: s.approachPos[2], r: 3.2 });

// The causeway (spawn to the plaza), the spurs, the pad's spur, and the boss's ground and the corridor to it.
const roads = [];
roads.push({ id: 'causeway', width: 4.0, pts: [[0, SPAWN[2] + 2], [0, PLAZA.maxZ + 1]] });
keep('causeway', { minX: -CAUSEWAY, maxX: CAUSEWAY, minZ: PLAZA.maxZ, maxZ: SPAWN[2] + 6 }, { margin: 0.8 });
for (const s of sites) {
  const [ax, , az] = s.approachPos;
  roads.push({ id: `spur-${s.id}`, width: 3.2, pts: [[0, az], [ax, az]] });
  keep(`spur ${s.id}`, { minX: Math.min(0, ax), maxX: Math.max(0, ax), minZ: az - SPUR, maxZ: az + SPUR }, { margin: 0.4 });
}
roads.push({ id: 'pad-spur', width: 3.0, pts: [[0, 84], [PAD[0] - 9.0, 84]] });
keep('pad spur', { minX: 0, maxX: PAD[0] - 9, minZ: 84 - SPUR, maxZ: 84 + SPUR }, { margin: 0.4 });
taken.push({ x: ARENA.boss[0], z: ARENA.boss[2], r: 11 });
taken.push({ x: ARENA.player[0], z: ARENA.player[2], r: 5 });

// The landing pad.
add('landing-pad', PAD[0], PAD[1], 10, { minTier: 'T3' });
taken.push({ x: PAD[0], z: PAD[1], r: 21 });

/* ---- the pool landmarks: a lattice pylon or a brine tank on a footing in the middle of every pool, the switch house in the court's west pool, and a row of rotor piers and pylons along the lagoon ---- */
const POOL_R = 4.4;
const POOL_KIND = { 'pool-w0': 'pylon', 'pool-w1': 'brine-tank', 'pool-w2': 'pylon', 'pool-e0': 'pylon', 'pool-e1': 'brine-tank', 'pool-e2': 'pylon', 'pool-e3': 'pylon' };
for (const p of pools.filter(p => !p.decor && !p.largest)) {
  const x = (p.minX + p.maxX) / 2, z = (p.minZ + p.maxZ) / 2;
  if (p.id === 'pool-w3') { add('switch-house', x, z, 7.0, { rotY: round(Math.PI / 2), minTier: 'T3' }); continue; }
  add(POOL_KIND[p.id], x, z, POOL_R, { rotY: 0, minTier: 'T3' });
}
for (const x of [-72, -36, 36, 72]) add('rotor-pier', x, -92, 2.6, { rotY: 0, minTier: 'T3' });
for (const x of [-54, 0, 54]) add('pylon', x, -92, POOL_R, { rotY: 0, minTier: 'T3' });

/* ---- the cable runs: from each pylon to the next in its column (and along the lagoon), two conductors a span ---- */
const pylons = landmarks.filter(l => l.asset === 'pylon');
const cables = [];
const column = (pred, key) => {
  const col = pylons.filter(pred).sort(key);
  for (let i = 0; i < col.length - 1; i++) cables.push({ a: [col[i].pos[0], col[i].pos[2]], b: [col[i + 1].pos[0], col[i + 1].pos[2]] });
};
column(l => l.pos[0] < 0 && l.pos[2] > -80, (a, b) => b.pos[2] - a.pos[2]);
column(l => l.pos[0] > 0 && l.pos[2] > -80, (a, b) => b.pos[2] - a.pos[2]);
column(l => l.pos[2] < -80, (a, b) => a.pos[0] - b.pos[0]);

/* ---- the plant on the land: transformers, cable reels, ingot stacks behind the heads ---- */
for (const [x, z] of [[-64, 40], [-64, -20], [64, 28], [64, -8], [-24, -38], [24, 74], [-72, 56], [-74, -34]]) if (fits(x, z, 2.8)) add('transformer', x, z, 2.8, { rotY: round(rnd() * 6.28), minTier: 'T3' });
for (const [x, z] of [[-60, 12], [60, 0], [-66, 70], [66, 52], [-30, -42]]) if (fits(x, z, 2.2)) add('cable-reel', x, z, 2.2, { rotY: round(rnd() * 6.28), minTier: 'T3' });

function scatter(asset, count, test, radius, extra = () => ({})) {
  let placed = 0;
  for (let k = 0; k < 6000 && placed < count; k++) {
    const x = (rnd() - 0.5) * 2 * WALK, z = (rnd() - 0.5) * 2 * WALK;
    if (!test(x, z) || !fits(x, z, radius)) continue;
    add(asset, x, z, radius, extra());
    placed++;
  }
}
const outer = (x, z) => Math.abs(x) > 54 || z > 92;
// A heap's noise pushes its box out to about 1.3 times the rock's radius, so the footprint is declared at that.
for (let n = 0, k = 0; n < 10 && k < 3000; k++) {
  const scale = round(0.8 + rnd() * 0.5), r = round(3.2 * scale * 1.3 + 0.6);
  const x = (rnd() - 0.5) * 2 * WALK, z = (rnd() - 0.5) * 2 * WALK;
  if (!outer(x, z) || !fits(x, z, r)) continue;
  add('salt-heap', x, z, r, { scale, rotY: round(rnd() * 6.28), minTier: 'T3' });
  n++;
}
scatter('ingot-stack', 6, outer, 1.8, () => ({ rotY: round(rnd() * 6.28), minTier: 'T4' }));
scatter('crate-stack', 8, outer, 1.8, () => ({ rotY: round(rnd() * 6.28), minTier: 'T4' }));
// Reeds: a tuft of tall stems, decoration only (no body to walk into).
scatter('reeds', 36, (x, z) => Math.abs(x) > 8 && Math.abs(z) < 96, 1.4, () => ({ rotY: round(rnd() * 6.28), minTier: 'T4' }));

/* ---- the lamps: down the causeway, along every spur and the pad's, and round the plaza ---- */
const lampAt = (x, z) => landmarks.push({ asset: 'lamp-post', pos: [round(x), 0, round(z)], radius: 0.6, minTier: 'T3' });
for (let z = SPAWN[2] - 4, i = 0; z >= PLAZA.maxZ + 2; z -= 10, i++) lampAt(i % 2 ? 2.8 : -2.8, z);
for (const s of sites) {
  const [ax, , az] = s.approachPos;
  const dir = Math.sign(ax);
  for (let x = 12, i = 0; x <= Math.abs(ax) - 3.4; x += 11, i++) lampAt(dir * x, az + (i % 2 ? 1.9 : -1.9));
}
for (let x = 14, i = 0; x < PAD[0] - 12; x += 12, i++) lampAt(x, 84 + (i % 2 ? 2.2 : -2.2));
for (const [x, z] of [[-10, -36], [10, -36], [-10, -50], [10, -50]]) lampAt(x, z);

/* ---------------------------------------------------------------- self-check */

let problems = 0;
const POOL_STANDING = new Set(['pylon', 'brine-tank', 'switch-house', 'rotor-pier']);
const bad = msg => { problems++; console.error(`  LAYOUT: ${msg}`); };
const nm = l => `${l.asset}@${l.pos[0]},${l.pos[2]}`;
for (const l of landmarks) {
  if (POOL_STANDING.has(l.asset)) {
    const p = pools.find(q => l.pos[0] - l.radius >= q.minX + 1 && l.pos[0] + l.radius <= q.maxX - 1 && l.pos[2] - l.radius >= q.minZ + 1 && l.pos[2] + l.radius <= q.maxZ - 1);
    if (!p) bad(`${nm(l)} does not stand wholly in a pool`);
    continue;
  }
  // Lamps and the pad belong to the roads and the plaza; they keep out of everything else.
  const onRoads = l.asset === 'lamp-post' || l.asset === 'landing-pad';
  for (const k of KEEP) {
    if (onRoads && (k.name === 'causeway' || k.name === 'plaza' || k.name === 'pad spur' || k.name.startsWith('spur '))) continue;
    if (rectDist(l.pos[0], l.pos[2], k) < l.radius + (k.margin > 0.5 ? 0.3 : 0.05) - 0.001) bad(`${nm(l)} stands in the ${k.name} keep-out`);
  }
}
// No pool meets a host, a lane, a spur, the causeway or the plaza (touching is not meeting).
for (const p of pools) for (const k of KEEP) {
  if (k.name === p.id || pools.some(q => q.id === k.name)) continue;
  if (rectOverlap(p, k, -0.01)) bad(`${p.id} and the ${k.name} keep-out overlap`);
}
for (const k of KEEP) for (const m of KEEP) {
  if (k.name < m.name && k.owner && m.owner && k.owner !== m.owner && rectOverlap(k, m, -0.01)) bad(`${k.name} and ${m.name} extents overlap`);
}
for (const p of pools) for (const q of pools) if (p.id < q.id && rectOverlap(p, q, 0.9)) bad(`${p.id} and ${q.id} are less than a metre apart`);
for (const p of pools) {
  const s = Math.max(...[p.minX, p.maxX].map(Math.abs));
  if (p.decor && (p.minX > -112 && p.maxX < 112 && p.minZ > -100 && p.maxZ < 112)) bad(`${p.id} is a decor pool inside the walk`);
  void s;
}
for (const l of landmarks.filter(l => l.asset !== 'lamp-post' && l.asset !== 'landing-pad' && !POOL_STANDING.has(l.asset))) {
  if (Math.hypot(l.pos[0] - ARENA.boss[0], l.pos[2] - ARENA.boss[2]) < 11 + l.radius) bad(`${nm(l)} reaches the Clamp's ground`);
}
for (let i = 0; i < sites.length; i++) for (let j = i + 1; j < sites.length; j++) {
  const got = Math.hypot(sites[i].pos[0] - sites[j].pos[0], sites[i].pos[2] - sites[j].pos[2]);
  if (got < 8) bad(`${sites[i].id} and ${sites[j].id} are ${got.toFixed(1)} apart`);
}
if (problems) { console.error(`${problems} layout problem(s); nothing written.`); process.exit(1); }

/* ---------------------------------------------------------------- the world */

const world = {
  id: 'brinewire',
  name: 'Brinewire',
  place: 'Copper marsh',
  oneLine: 'Redox reactions, galvanic cells, cell potentials and electrolysis.',
  sky: 'brinewire-sky',
  terrain: { heightmap: 'brinewire-marsh', size: [240, 240], maxHeight: 0.4, material: 'salt-mud' },
  ambience: { keyLight: 0xf4e3bd, fillLight: 0xbfc6c4, fogColor: 0xc4b9a0, fogNear: 45, fogFar: 520, dustDensity: 0.1 },
  road: { radius: 0 },
  arena: ARENA,
  plaza: PLAZA,
  roads,
  pools,
  landmarks,
  cables,
  sites,
  spawn: { pos: SPAWN, lookAt: [0, 1.6, 40] },
  t2: { stillCamera: Object.fromEntries(sites.map(s => [s.id, { pos: s.approachPos, lookAt: [s.pos[0], 1.2, s.pos[2]] }])) },
  t1: { siteOrder: sites.map(s => s.id) },
  tracks: []
};

writeFileSync(join(root, 'src/three/world-data/brinewire.json'), JSON.stringify(world, null, 2) + '\n');
const count = a => landmarks.filter(l => l.asset === a).length;
console.log(`Brinewire: ${landmarks.length} landmarks (${count('pylon')} pylons, ${count('brine-tank')} brine tanks, ${count('lamp-post')} lamps, ${count('salt-heap')} salt heaps), ${cables.length} cable spans, ${pools.length} pools, ${sites.length} sites, ${roads.length} roads written.`);
