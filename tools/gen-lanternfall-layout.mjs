#!/usr/bin/env node
/**
 * gen-lanternfall-layout.mjs — Lays out Lanternfall's ground and writes
 * `src/three/world-data/lanternfall.json`.
 *
 * Lanternfall is an ice field under a permanent aurora, and the nine benches are the working points
 * of an observatory expedition camped round a frozen lake (`docs/plans/bench-integration.md` §5):
 *
 *   1  wave flume              on the lake's south shore
 *   2  photocell housing       at the foot of an aurora mast, south-east
 *   3  spectrograph sled       in camp 1, east
 *   4  crawler's lab module    north-east
 *   5  records tent, south     one tent, one board with two faces, north
 *   6  records tent, north     (back to back with 5, meeting at the ridge)
 *   7  detector arc            on a mast platform, north-west
 *   8  tile store              in camp 3, west
 *   9  cuvette sled            by a hole cut through the lake's ice, south-west
 *
 * THE HOSTS ARE PLACED BY HAND BELOW, THEN THE SCATTER IS SETTLED. Hosts, the pad and the mast are
 * fixed; spires, ridges, camps, sleds, stakes and the lantern road are rejection-sampled from a fixed
 * seed (so the file is the same every run) and kept clear of every host's real extent (`host-plan.js`),
 * of every approach lane, of the lake and of the boss's ground. The script REFUSES to write the file if
 * anything fixed collides, an approach is not open ground, the arena is not clear, the water hole is
 * not in the lake, or the two halves of the records tent do not meet. `npm run verify:lanternfall` then
 * builds the real world and measures it; this keeps the declaration honest.
 *
 * Run: node tools/gen-lanternfall-layout.mjs
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { HOST_PLAN, WATER_HOLE, TENT_SPAN, LANE } from '../src/three/lanternfall/host-plan.js';

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
const rnd = mulberry32(0x1a77e12);
const round = n => Math.round(n * 100) / 100;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

const LAKE = 24;              // the frozen lake's radius, at the middle
const APPROACH = 5.0;         // how far from the bench's centre the player is asked to stand
const SPAWN = [0, 84];
/** The lantern-eater is fought here: open ground the player walks up to from the spawn. */
const ARENA = { boss: [0, 54], player: [0, 68], radius: 6.5, corridor: { minX: -7, maxX: 7, minZ: 46, maxZ: 74 } };

/* ---------------------------------------------------------------- the sites */

// f: the way the bench faces (the direction from the bench toward where the player stands).
const SITE_DEFS = [
  { id: 'site-1', questId: 'q1-wave', stage: 1, label: 'Bench 1 - Light Waves', pos: [-3, 30], f: [0, 1] },
  { id: 'site-2', questId: 'q2-photon', stage: 2, label: 'Bench 2 - Photons', pos: [36, 30], f: [0, 1] },
  { id: 'site-3', questId: 'q3-lines', stage: 3, label: 'Bench 3 - Line Spectra', pos: [60, -4], f: [-1, 0] },
  { id: 'site-4', questId: 'q4-cloud', stage: 4, label: 'Bench 4 - Orbitals', pos: [42, -46], f: [0, 1] },
  { id: 'site-5', questId: 'q5-numbers', stage: 5, label: 'Bench 5 - Quantum Numbers', pos: [6, -52], f: [0, 1] },
  { id: 'site-6', questId: 'q6-filling', stage: 6, label: 'Bench 6 - Electron Configuration', pos: [6, -52 - TENT_SPAN], f: [0, -1] },
  { id: 'site-7', questId: 'q7-pes', stage: 7, label: 'Bench 7 - Photoelectron Spectroscopy', pos: [-38, -44], f: [0, 1] },
  { id: 'site-8', questId: 'q8-trends', stage: 8, label: 'Bench 8 - Periodic Trends', pos: [-62, -8], f: [1, 0] },
  { id: 'site-9', questId: 'q9-absorb', stage: 9, label: 'Bench 9 - Spectroscopy', pos: [-25, 12], f: [-1, 0] }
];

/** A host-frame point as a world point: x to the player's right, z toward the player. */
function toWorld(def, lx, lz) {
  const [px, pz] = def.pos;
  const [fx, fz] = def.f;
  return [px + lx * fz + lz * fx, pz - lx * fx + lz * fz];
}

/** A rectangle given in a host's own frame, as a world AABB. */
function hostRect(def, [x0, x1, z0, z1]) {
  const pts = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].map(([lx, lz]) => toWorld(def, lx, lz));
  return {
    minX: Math.min(...pts.map(p => p[0])), maxX: Math.max(...pts.map(p => p[0])),
    minZ: Math.min(...pts.map(p => p[1])), maxZ: Math.max(...pts.map(p => p[1]))
  };
}

const unionRect = (a, b) => ({
  minX: Math.min(a.minX, b.minX), maxX: Math.max(a.maxX, b.maxX), minZ: Math.min(a.minZ, b.minZ), maxZ: Math.max(a.maxZ, b.maxZ)
});

const sites = SITE_DEFS.map(d => {
  const [px, pz] = d.pos;
  const [fx, fz] = d.f;
  const plan = HOST_PLAN[d.id];
  // The ground that must be level: the host's machinery and the lane in front of its plate.
  const area = unionRect(hostRect(d, plan.extent), hostRect(d, [-LANE.hw, LANE.hw, LANE.from, LANE.to]));
  const cx = (area.minX + area.maxX) / 2, cz = (area.minZ + area.maxZ) / 2;
  const r = Math.hypot(area.maxX - area.minX, area.maxZ - area.minZ) / 2 + 0.8;
  return {
    id: d.id, questId: d.questId, stage: d.stage,
    pos: [round(px), 0, round(pz)],
    approachPos: [round(px + fx * APPROACH), 1.6, round(pz + fz * APPROACH)],
    label: d.label, structure: plan.structure, built: true,
    flat: { x: round(cx), z: round(cz), r: round(r) }
  };
});

/* ------------------------------------------------------------- the landmarks */

const L = [];
function lm(asset, x, z, { rotY = 0, scale = 1, radius = 2, minTier = 'T3', host = null } = {}) {
  const e = { asset, pos: [round(x), 0, round(z)], radius: round(radius), minTier };
  if (rotY) e.rotY = round(rotY);
  if (scale !== 1) e.scale = round(scale);
  if (host) e.host = host;
  L.push(e);
  return e;
}

// THE HOSTS. Each declares a footprint inside its machinery, behind the plate; the real extents are the
// KEEP rects below. (A circle cannot both hold a 15 m camp and stay behind the approach.)
const HOST_CIRCLE = {      // [local x, local z behind the plate (positive), radius]
  'site-1': [0, 5.5, 6.5], 'site-2': [0, 4.0, 4.2], 'site-3': [4.5, 4.0, 7.5], 'site-4': [0, 6.5, 5.5],
  'site-5': [0, 3.0, 0.45], 'site-6': [0, 3.0, 0.45], 'site-7': [2.0, 4.0, 6.0], 'site-8': [3.0, 5.0, 8.5],
  'site-9': [0.5, 4.5, 5.0]
};
const HOST_ASSET = {
  'site-1': 'wave-tank', 'site-2': 'photocell-mast', 'site-3': 'spectrograph-sled', 'site-4': 'crawler-lab',
  'site-5': 'records-tent', 'site-6': 'records-tent', 'site-7': 'detector-mast', 'site-8': 'tile-store', 'site-9': 'water-hole'
};
for (const d of SITE_DEFS) {
  const [lx, back, radius] = HOST_CIRCLE[d.id];
  const [x, z] = toWorld(d, lx, -back);
  lm(HOST_ASSET[d.id], x, z, { radius, host: d.id });
}

// Fixed ground: the pad and the mast somebody left.
lm('landing-pad', 52, 80, { radius: 8.5 });
lm('comms-mast', 64, 70, { radius: 1.4 });

/* ----------------------------------------------- real extents (keep-outs) */

/**
 * Rects (world AABB) of what a circle cannot describe. Free props stay out of every one, by `margin`;
 * the hosts are held to each other at margin 0. `owner` is the site whose host a rect belongs to (its
 * own lane may cross it).
 */
const KEEP = [];
const keep = (name, r, { margin = 0.8, owner = null, lane = false } = {}) => KEEP.push({ name, ...r, margin, owner, lane });

for (const d of SITE_DEFS) {
  keep(`${d.id} host`, hostRect(d, HOST_PLAN[d.id].extent), { owner: d.id });
  // The approach lane: the plate's front edge out to where the camera stands, and a little beyond.
  keep(`${d.id} approach`, hostRect(d, [-LANE.hw, LANE.hw, LANE.from, LANE.to]), { margin: 0.2, owner: d.id, lane: true });
}
keep('boss arena', { minX: ARENA.boss[0] - ARENA.radius, maxX: ARENA.boss[0] + ARENA.radius, minZ: ARENA.boss[1] - ARENA.radius, maxZ: ARENA.boss[1] + ARENA.radius }, { margin: 0 });
keep('arena corridor', ARENA.corridor, { margin: 0 });

const inRect = (x, z, r, pad = 0) => x > r.minX - pad && x < r.maxX + pad && z > r.minZ - pad && z < r.maxZ + pad;
/** The distance from a point to a rect (0 inside). */
function rectDist(x, z, r) {
  const dx = Math.max(r.minX - x, 0, x - r.maxX), dz = Math.max(r.minZ - z, 0, z - r.maxZ);
  return Math.hypot(dx, dz);
}

/* ------------------------------------------------------------------ scatter */

const taken = L.map(l => ({ x: l.pos[0], z: l.pos[2], r: l.radius }));
// The spawn and the way in from it.
taken.push({ x: 0, z: 84, r: 4 }, { x: 0, z: 66, r: 4 }, { x: 0, z: 48, r: 4 });
for (const s of sites) taken.push({ x: s.approachPos[0], z: s.approachPos[2], r: 3.2 });
const fits = (x, z, r, pad = 0.6) => taken.every(t => Math.hypot(x - t.x, z - t.z) >= t.r + r + pad)
  && KEEP.every(k => rectDist(x, z, k) >= r + k.margin);
function add(asset, x, z, radius, extra = {}) {
  L.push({ asset, pos: [round(x), 0, round(z)], radius, ...extra });
  taken.push({ x, z, r: radius });
}

// The ice country: spires, ridges, camps and the things somebody left.
function scatter(asset, count, rMin, rMax, radius, extra = () => ({})) {
  let placed = 0;
  for (let k = 0; k < 4000 && placed < count; k++) {
    const a = rnd() * Math.PI * 2;
    const r = rMin + rnd() * (rMax - rMin);
    const x = r * Math.sin(a), z = r * Math.cos(a);
    if (Math.abs(x) > 92 || Math.abs(z) > 92) continue;
    // Keep clear of the lake, whatever else.
    if (Math.hypot(x, z) < LAKE + radius + 4) continue;
    if (!fits(x, z, radius)) continue;
    add(asset, x, z, radius, extra());
    placed++;
  }
  return placed;
}
scatter('ice-spire', 14, 62, 92, 3.0, () => ({ scale: round(0.8 + rnd() * 1.0), rotY: round(rnd() * 6.28), minTier: 'T3' }));
scatter('ice-spire', 6, 30, 44, 2.4, () => ({ scale: round(0.6 + rnd() * 0.6), rotY: round(rnd() * 6.28), minTier: 'T3' }));
scatter('pressure-ridge', 9, 60, 92, 6.5, () => ({ scale: round(0.8 + rnd() * 0.5), rotY: round(rnd() * 6.28), minTier: 'T3' }));
scatter('aurora-mast', 3, 66, 90, 2.0, () => ({ minTier: 'T3' }));
scatter('camp', 3, 58, 88, 3.6, () => ({ rotY: round(rnd() * 6.28), minTier: 'T3' }));
scatter('sled', 4, 40, 90, 1.8, () => ({ rotY: round(rnd() * 6.28), minTier: 'T4' }));
scatter('stake-marker', 6, 36, 90, 0.35, () => ({ minTier: 'T4' }));

/* ------------------------------------------------------------- the lantern road */

/**
 * The road: from the spawn to each approach in the order the benches open, going round the lake, a
 * lantern post every ~9.5 m on the outer side of the way (the inner when something stands there).
 */
const approach = id => { const s = sites.find(x => x.id === id).approachPos; return [s[0], s[2]]; };
const ROAD = [
  SPAWN, approach('site-1'), approach('site-2'), approach('site-3'), approach('site-4'), approach('site-5'),
  [-3, -47.5], [-3, -64], approach('site-6'), approach('site-7'), approach('site-8'), approach('site-9')
];
let posts = 0;
for (let i = 0; i < ROAD.length - 1; i++) {
  const a = ROAD[i], b = ROAD[i + 1];
  const len = dist(a, b);
  const dx = (b[0] - a[0]) / len, dz = (b[1] - a[1]) / len;
  for (let t = 5; t < len - 3; t += 9.5) {
    const x0 = a[0] + dx * t, z0 = a[1] + dz * t;
    for (const side of [1, -1]) {
      const x = x0 - dz * 2.9 * side, z = z0 + dx * 2.9 * side;
      if (Math.hypot(x, z) < LAKE + 2) continue;
      if (!fits(x, z, 0.6, 0.4)) continue;
      add('lantern-post', x, z, 0.6, { minTier: 'T3' });
      posts++;
      break;
    }
  }
}

/* ------------------------------------------------------------------- checks */

let fail = 0;
const bad = m => { fail++; console.log('FAIL', m); };
const nm = l => `${l.asset}@${l.pos[0]},${l.pos[2]}`;

// Every footprint is disjoint.
for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
  const need = L[i].radius + L[j].radius;
  const got = dist([L[i].pos[0], L[i].pos[2]], [L[j].pos[0], L[j].pos[2]]);
  if (got < need) bad(`${nm(L[i])} and ${nm(L[j])} overlap by ${(need - got).toFixed(2)}`);
}
// Free props stand clear of every real extent.
for (const l of L) {
  if (l.host || ['landing-pad', 'comms-mast'].includes(l.asset)) continue;
  for (const k of KEEP) if (rectDist(l.pos[0], l.pos[2], k) < l.radius + k.margin - 0.001) bad(`${nm(l)} stands in the ${k.name} keep-out`);
}
for (const l of L) {      // the pad and the mast too, at margin 0
  if (!['landing-pad', 'comms-mast'].includes(l.asset)) continue;
  for (const k of KEEP) if (rectDist(l.pos[0], l.pos[2], k) < l.radius) bad(`${nm(l)} stands in the ${k.name} keep-out`);
}
// Sites stand clear of every prop that is not their own host.
const tentHalves = ['site-5', 'site-6'];
for (const s of sites) for (const l of L) {
  if (l.host === s.id) continue;
  if (tentHalves.includes(s.id) && tentHalves.includes(l.host)) continue;     // one tent, two benches
  const got = dist([s.pos[0], s.pos[2]], [l.pos[0], l.pos[2]]);
  if (got < l.radius + 4.2) bad(`${s.id} is inside ${nm(l)} (${got.toFixed(2)})`);
}
// A host's circle does not reach its approach.
for (const s of sites) {
  const h = L.find(l => l.host === s.id);
  const toApproach = dist([s.approachPos[0], s.approachPos[2]], [h.pos[0], h.pos[2]]);
  if (toApproach < h.radius + 0.5) bad(`${s.id}'s approach is inside its own host ${nm(h)}`);
}
// The structures' real extents do not touch each other (one host's own pieces and lane may).
for (let i = 0; i < KEEP.length; i++) for (let j = i + 1; j < KEEP.length; j++) {
  const a = KEEP[i], b = KEEP[j];
  if (a.owner && a.owner === b.owner) continue;
  if (['boss arena', 'arena corridor'].includes(a.name) && ['boss arena', 'arena corridor'].includes(b.name)) continue;
  // The two halves of the records tent meet at the ridge, and each one's lane runs clear of the other's tent.
  const tent = [a.owner, b.owner].every(o => o === 'site-5' || o === 'site-6');
  if (tent && !a.lane && !b.lane) continue;
  if (a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ) bad(`${a.name} and ${b.name} extents overlap`);
}
// Sites 8 apart, at least.
for (let i = 0; i < sites.length; i++) for (let j = i + 1; j < sites.length; j++) {
  const got = dist([sites[i].pos[0], sites[i].pos[2]], [sites[j].pos[0], sites[j].pos[2]]);
  if (tentHalves.includes(sites[i].id) && tentHalves.includes(sites[j].id)) continue;
  if (got < 8) bad(`${sites[i].id} and ${sites[j].id} are ${got.toFixed(1)} apart`);
}
// The boss's ground is open.
for (const l of L) {
  if (dist([l.pos[0], l.pos[2]], ARENA.boss) < l.radius + ARENA.radius) bad(`${nm(l)} stands on the boss's ground`);
  if (rectDist(l.pos[0], l.pos[2], ARENA.corridor) < l.radius) bad(`${nm(l)} stands in the arena corridor`);
}
// The water hole is in the lake, ring and all; the bench is not.
{
  const d = SITE_DEFS[8];
  const hole = toWorld(d, WATER_HOLE.lx, WATER_HOLE.lz);
  const r = Math.hypot(hole[0], hole[1]);
  if (r + 1.9 > LAKE) bad(`the water hole is ${r.toFixed(1)} m from the lake's middle: its ring does not fit inside the ${LAKE} m lake`);
  if (Math.hypot(d.pos[0], d.pos[1]) < LAKE + 1.5) bad('bench 9 stands on the lake');
}
// The wave flume's pump pipe reaches the lake; the flume itself stands on the shore.
{
  const d = SITE_DEFS[0];
  const intake = toWorld(d, -4.8, -9.0);
  if (Math.hypot(intake[0], intake[1]) > LAKE - 0.2) bad(`the flume's intake ends at ${Math.hypot(intake[0], intake[1]).toFixed(1)} m: it does not reach the lake`);
}
// The two halves of the records tent meet: same line, back to back, TENT_SPAN apart.
{
  const a = SITE_DEFS[4], b = SITE_DEFS[5];
  if (a.pos[0] !== b.pos[0] || Math.abs(a.pos[1] - b.pos[1] - TENT_SPAN) > 1e-9 || a.f[1] !== -b.f[1]) bad('the records tent halves are not back to back');
}
// Every site faces cardinally (the host colliders are axis-aligned boxes).
for (const s of sites) {
  const dx = s.approachPos[0] - s.pos[0], dz = s.approachPos[2] - s.pos[2];
  if (Math.min(Math.abs(dx), Math.abs(dz)) > 1e-6) bad(`${s.id} does not face along an axis`);
}
// Everything stands on the terrain.
for (const l of L) if (Math.abs(l.pos[0]) > 120 || Math.abs(l.pos[2]) > 120) bad(`${nm(l)} is off the terrain`);
if (posts < 24) bad(`only ${posts} lantern posts light the road`);

console.log(`${L.length} landmarks, ${sites.length} sites, ${posts} lantern posts, ${fail} failures`);
if (fail) { console.log('refusing to write'); process.exit(1); }

/* --------------------------------------------------------------------- write */

const world = {
  id: 'lanternfall',
  name: 'Lanternfall',
  place: 'Aurora ice',
  oneLine: 'Learn how light, energy levels, orbitals and periodic trends explain the electrons you met on Tallow.',
  sky: 'lanternfall-sky',
  terrain: { heightmap: 'lanternfall-ice', size: [240, 240], maxHeight: 4.0, material: 'packed-ice' },
  ambience: {
    keyLight: 0x9fe8c4,
    fillLight: 0x3b5a8f,
    fogColor: 0x1a2f45,
    fogNear: 40,
    fogFar: 520,
    dustDensity: 0.4
  },
  lake: { x: 0, z: 0, radius: LAKE },
  landmarks: L,
  sites,
  spawn: { pos: [0, 1.6, 84], lookAt: [0, 1.6, 30] },
  // The baked tier frames each site from its approach mark, looking at the plate.
  t2: { stillCamera: Object.fromEntries(sites.map(s => [s.id, { pos: s.approachPos, lookAt: [s.pos[0], 1.2, s.pos[2]] }])) },
  t1: { siteOrder: sites.map(s => s.id) },
  tracks: []
};

writeFileSync(join(root, 'src/three/world-data/lanternfall.json'), JSON.stringify(world, null, 2) + '\n');
console.log('written src/three/world-data/lanternfall.json');
