#!/usr/bin/env node
/**
 * gen-bellows-layout.mjs — Lays out Bellows' ground and writes
 * `src/three/world-data/bellows.json`.
 *
 * Bellows is a cloud deck: one great circular steel platform riding a sea of
 * pressurised cloud, with the Compressor standing at its middle and the six
 * benches of "Gases" built INTO the gas works round it (`src/three/bellows/host-plan.js`:
 * a gauge gallery on a gasholder, the Compressor's piston deck, a metering skid, a
 * blending manifold on a pipe rack, a leak-test station at a vent stack, the liquefier's
 * cold box), a road of work lamps between them, free-standing works (holders, scoops,
 * vents, racks) and the Avalon's pad on the near side. No gantry stands on a ring. The layout is DETERMINISTIC (seeded), and the
 * generator holds itself to the rules `verify:bellows` holds the world to: every
 * footprint disjoint, every site clear of every prop, every approach on open deck
 * facing the way the player walks in, and everything inside the rail.
 *
 * Run: node tools/gen-bellows-layout.mjs
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { HOST_PLAN, LANE } from '../src/three/bellows/host-plan.js';

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
const rnd = mulberry32(0xbe110e5);
const round = n => Math.round(n * 100) / 100;

const DECK = 82;           // the deck's radius; the rail stands just inside it
const INSIDE = 77;         // nothing is placed past this: room for the rail and a walk behind it
const APPROACH = 4.6;      // how far in front of the plate the player is asked to stand
const TOWER = 12;          // the Compressor's footprint

/* ---------------------------------------------------------------- the sites */

/**
 * Where each host stands. `free` hosts stand at an angle (degrees from the south, toward the east) and a radius, facing the
 * middle of the deck with their machinery out behind the plate. `tower` hosts stand at the Compressor's foot at `towerGap`
 * from its centre, facing away from it, so the tower is the machinery behind the plate.
 */
const SITE_DEFS = [
  { id: 'site-1', questId: 'q1-knocks', title: 'Pressure and Temperature', at: [-40, 46] },
  { id: 'site-2', questId: 'q2-laws', title: 'The Gas Laws', at: [-100, null] },
  { id: 'site-3', questId: 'q3-ideal', title: 'Ideal Gas Law', at: [-150, 44] },
  { id: 'site-4', questId: 'q4-mixtures', title: 'Partial Pressures', at: [165, 46] },
  { id: 'site-5', questId: 'q5-speed', title: 'Speed and Escape', at: [125, 44] },
  { id: 'site-6', questId: 'q6-real', title: 'Real Gases', at: [100, null] }
].map((d, i) => {
  const plan = HOST_PLAN[d.id];
  const a = d.at[0] * Math.PI / 180;
  const out = [Math.sin(a), Math.cos(a)];
  const r = plan.anchor === 'tower' ? plan.towerGap : d.at[1];
  // f: the way the bench faces (from the bench toward where the player stands).
  const f = plan.anchor === 'tower' ? out : [-out[0], -out[1]];
  return { ...d, stage: i + 1, structure: plan.structure, pos: [round(out[0] * r), round(out[1] * r)], f };
});

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

function rectDist(x, z, r) {
  const dx = Math.max(r.minX - x, 0, x - r.maxX), dz = Math.max(r.minZ - z, 0, z - r.maxZ);
  return Math.hypot(dx, dz);
}

const sites = SITE_DEFS.map(d => {
  const [ax, az] = toWorld(d, 0, APPROACH);
  return {
    id: d.id, questId: d.questId, stage: d.stage,
    pos: [d.pos[0], 0, d.pos[1]],
    approachPos: [round(ax), 1.6, round(az)],
    label: `Bench ${d.stage} - ${d.title}`,
    structure: d.structure, built: true
  };
});

/* ---------------------------------------------------------------- the props */

const landmarks = [];
const taken = [];       // { x, z, r }
/** Rects (world AABB) that no free prop may stand in: every host's real extent and its lane, and the boss's ground. */
const KEEP = [];
const keep = (name, r, { margin = 0.8, owner = null, lane = false } = {}) => KEEP.push({ name, ...r, margin, owner, lane });
const inside = (x, z, r, pad = 0) => Math.hypot(x, z) + r <= INSIDE - pad;
const fits = (x, z, r, pad = 0.6) => inside(x, z, r) && taken.every(t => Math.hypot(x - t.x, z - t.z) >= t.r + r + pad)
  && KEEP.every(k => rectDist(x, z, k) >= r + k.margin);
function add(asset, x, z, radius, extra = {}) {
  landmarks.push({ asset, pos: [round(x), 0, round(z)], radius, ...extra });
  taken.push({ x, z, r: radius });
}

// The Compressor stands at the middle of everything.
add('compressor-tower', 0, 0, TOWER, { minTier: 'T3' });

for (const d of SITE_DEFS) {
  keep(`${d.id} host`, hostRect(d, HOST_PLAN[d.id].extent), { owner: d.id });
  // The approach lane: the plate's front edge out to where the camera stands, and a little beyond.
  keep(`${d.id} approach`, hostRect(d, [-LANE.hw, LANE.hw, LANE.from, LANE.to]), { margin: 0.2, owner: d.id, lane: true });
}
// The Compressor is fought on the way in from the spawn: open deck round the boss and the corridor the player walks along.
const ARENA = { boss: [0, 20], player: [0, 34], radius: 6.5, corridor: { minX: -7, maxX: 7, minZ: 13, maxZ: 38 } };
keep('boss arena', { minX: ARENA.boss[0] - ARENA.radius, maxX: ARENA.boss[0] + ARENA.radius, minZ: ARENA.boss[1] - ARENA.radius, maxZ: ARENA.boss[1] + ARENA.radius }, { margin: 0 });
keep('arena corridor', ARENA.corridor, { margin: 0 });

// The spawn and the way in from it, and the room the Avalon needs round its pad.
const SPAWN = [0, 62];
taken.push({ x: SPAWN[0], z: SPAWN[1], r: 4 }, { x: 0, z: 48, r: 4 });
for (const s of sites) taken.push({ x: s.approachPos[0], z: s.approachPos[2], r: 3.2 });
const PAD = [27, 50];
taken.push({ x: PAD[0], z: PAD[1], r: 26 });

// The landing pad itself: flush with the deck, on open plate.
landmarks.push({ asset: 'landing-pad', pos: [PAD[0], 0, PAD[1]], radius: 8.5, minTier: 'T3' });

// The comms mast, standing off the pad's far side.
add('comms-mast', -56, 40, 1.4, { minTier: 'T3' });

// The lamp road: a ring of work lamps between the Compressor and the benches.
const POSTS = 28;
for (let i = 0; i < POSTS; i++) {
  const a = (i / POSTS) * Math.PI * 2 + 0.05;
  const r = 36;
  const x = r * Math.sin(a), z = r * Math.cos(a);
  if (fits(x, z, 0.6, 0.4)) add('lamp-post', x, z, 0.6, { minTier: 'T3' });
}

// The free-standing works: holders, scoops, vents, racks, crates and the things somebody left moored.
function scatter(asset, count, rMin, rMax, radius, extra = () => ({})) {
  let placed = 0;
  for (let k = 0; k < 6000 && placed < count; k++) {
    const a = rnd() * Math.PI * 2;
    const r = rMin + rnd() * (rMax - rMin);
    const x = r * Math.sin(a), z = r * Math.cos(a);
    if (!fits(x, z, radius)) continue;
    add(asset, x, z, radius, extra());
    placed++;
  }
}
scatter('gasholder', 3, 56, 70, 7.6, () => ({ rotY: round(rnd() * 6.28), minTier: 'T3' }));
scatter('vent-stack', 2, 20, 30, 2.6, () => ({ minTier: 'T3' }));
scatter('pipe-rack', 2, 58, 70, 8, () => ({ rotY: round(rnd() * 6.28), minTier: 'T3' }));
scatter('scoop-pylon', 8, 68, 75, 2.6, () => ({ rotY: round(rnd() * 6.28), minTier: 'T3' }));
scatter('bladder-moor', 3, 54, 70, 3.8, () => ({ rotY: round(rnd() * 6.28), minTier: 'T3' }));
scatter('crate-stack', 8, 24, 72, 2.6, () => ({ rotY: round(rnd() * 6.28), minTier: 'T4' }));

/* ---------------------------------------------------------------- self-check */

let problems = 0;
const bad = msg => { problems++; console.error(`  LAYOUT: ${msg}`); };
const nm = l => `${l.asset}@${l.pos[0]},${l.pos[2]}`;
const rectOverlap = (a, b) => a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;

// Every footprint is disjoint.
for (let i = 0; i < landmarks.length; i++) for (let j = i + 1; j < landmarks.length; j++) {
  const need = landmarks[i].radius + landmarks[j].radius;
  const got = Math.hypot(landmarks[i].pos[0] - landmarks[j].pos[0], landmarks[i].pos[2] - landmarks[j].pos[2]);
  if (got < need) bad(`${nm(landmarks[i])} and ${nm(landmarks[j])} overlap by ${(need - got).toFixed(2)}`);
}
// Free props stand clear of every real extent.
for (const l of landmarks) {
  if (['compressor-tower', 'landing-pad', 'comms-mast'].includes(l.asset)) continue;
  for (const k of KEEP) if (rectDist(l.pos[0], l.pos[2], k) < l.radius + k.margin - 0.001) bad(`${nm(l)} stands in the ${k.name} keep-out`);
}
// The Compressor, the pad and the mast too, at margin 0.
for (const l of landmarks) {
  if (!['compressor-tower', 'landing-pad', 'comms-mast'].includes(l.asset)) continue;
  for (const k of KEEP) {
    if (k.name === 'boss arena' || k.name === 'arena corridor') { if (l.asset !== 'compressor-tower' && rectDist(l.pos[0], l.pos[2], k) < l.radius) bad(`${nm(l)} stands in the ${k.name}`); continue; }
    // A tower host stands against the Compressor's plinth by design (its own check is below, in the host's frame).
    if (l.asset === 'compressor-tower' && /^site-\d host$|^site-\d approach$/.test(k.name) && HOST_PLAN[k.name.slice(0, 6)].anchor === 'tower') continue;
    const gap = rectDist(l.pos[0], l.pos[2], k) - l.radius;
    if (gap < 0.3) bad(`${nm(l)} stands in (or against) the ${k.name} keep-out (${gap.toFixed(2)} m)`);
  }
}
// The tower hosts keep clear of the plinth, and the plate is no nearer it than the bay's 1.95 m allows.
for (const d of SITE_DEFS.filter(x => HOST_PLAN[x.id].anchor === 'tower')) {
  // The Compressor's centre in the host's own frame, and its distance to the host's extent there.
  const [fx, fz] = d.f;
  const dx = -d.pos[0], dz = -d.pos[1];
  const lx = dx * fz - dz * fx, lz = dx * fx + dz * fz;
  const [x0, x1, z0, z1] = HOST_PLAN[d.id].extent;
  const back = Math.hypot(Math.max(x0 - lx, 0, lx - x1), Math.max(z0 - lz, 0, lz - z1));
  if (back < 11.8 + 0.3) bad(`${d.id}'s extent comes within ${back.toFixed(2)} m of the Compressor's centre; its plinth is 11.8`);
  if (Math.hypot(d.pos[0], d.pos[1]) - 0.65 - 11.8 < 1.95) bad(`${d.id}'s plate is nearer the plinth than the bay's behind air (1.95 m)`);
}
// The hosts' extents do not touch each other (one host's own pieces and lane may).
for (let i = 0; i < KEEP.length; i++) for (let j = i + 1; j < KEEP.length; j++) {
  const a = KEEP[i], b = KEEP[j];
  if (a.owner && a.owner === b.owner) continue;
  if (['boss arena', 'arena corridor'].includes(a.name) && ['boss arena', 'arena corridor'].includes(b.name)) continue;
  if (rectOverlap(a, b)) bad(`${a.name} and ${b.name} extents overlap`);
}
// Sites 8 apart, at least; and every approach is on the deck, inside the rail.
for (let i = 0; i < sites.length; i++) for (let j = i + 1; j < sites.length; j++) {
  const got = Math.hypot(sites[i].pos[0] - sites[j].pos[0], sites[i].pos[2] - sites[j].pos[2]);
  if (got < 8) bad(`${sites[i].id} and ${sites[j].id} are ${got.toFixed(1)} apart`);
}
for (const d of SITE_DEFS) {
  for (const [x, z] of [[-1, -1], [1, -1]].map(([sx, sz]) => toWorld(d, sx * HOST_PLAN[d.id].extent[sx < 0 ? 0 : 1] * (sx < 0 ? 1 : 1) / (sx < 0 ? 1 : 1), HOST_PLAN[d.id].extent[2]))) {
    if (Math.hypot(x, z) > INSIDE) bad(`${d.id}'s machinery reaches ${Math.hypot(x, z).toFixed(1)} m from the middle (the rail is at ${INSIDE})`);
  }
}
// The boss's ground is open.
for (const l of landmarks) {
  if (l.asset === 'compressor-tower') continue;
  if (Math.hypot(l.pos[0] - ARENA.boss[0], l.pos[2] - ARENA.boss[1]) < l.radius + ARENA.radius) bad(`${nm(l)} stands on the boss's ground`);
  if (rectDist(l.pos[0], l.pos[2], ARENA.corridor) < l.radius) bad(`${nm(l)} stands in the arena corridor`);
}
if (problems) { console.error(`${problems} layout problem(s); nothing written.`); process.exit(1); }

/* ---------------------------------------------------------------- the world */

const world = {
  id: 'bellows',
  name: 'Bellows',
  place: 'Cloud deck',
  oneLine: 'Learn how pressure, temperature, volume and amount tie together in a gas, and where the gas law stops being true.',
  sky: 'bellows-sky',
  terrain: { heightmap: 'bellows-deck', size: [200, 200], maxHeight: 0, material: 'tread-plate' },
  ambience: {
    keyLight: 0xfff0d6,
    fillLight: 0x6f93d0,
    fogColor: 0xc3d3e8,
    fogNear: 60,
    fogFar: 760,
    dustDensity: 0.3
  },
  deck: { radius: DECK, seaLevel: -46 },
  landmarks,
  sites,
  spawn: { pos: [SPAWN[0], 1.6, SPAWN[1]], lookAt: [0, 1.6, 30] },
  t2: { stillCamera: Object.fromEntries(sites.map(s => [s.id, { pos: s.approachPos, lookAt: [s.pos[0], 1.2, s.pos[2]] }])) },
  t1: {
    siteOrder: sites.map(s => s.id)
  },
  tracks: []
};

writeFileSync(join(root, 'src/three/world-data/bellows.json'), JSON.stringify(world, null, 2) + '\n');
const counts = {};
for (const l of landmarks) counts[l.asset] = (counts[l.asset] || 0) + 1;
console.log(`Bellows: ${landmarks.length} landmarks (${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}), ${sites.length} sites written.`);
