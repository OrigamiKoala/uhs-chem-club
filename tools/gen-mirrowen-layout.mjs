#!/usr/bin/env node
/**
 * gen-mirrowen-layout.mjs — Lays out Mirrowen's ground and writes
 * `src/three/world-data/mirrowen.json`.
 *
 * Mirrowen is a tidal shelf. A round harbour basin lies at the middle and a canal sixteen metres
 * across runs north out of it; the seven benches of "States of Matter" stand on a ring round the basin,
 * each built into a working point of the harbour; a road of work lamps lies between them; stores and
 * a portal crane stand off at the edges; and the far end of the canal is frozen, between two walls of
 * crystal ice, with the ships it trapped listing in the sheet. The Undertow is fought on the open quay
 * beside the frozen stretch, with the ice behind it.
 *
 * The layout is DETERMINISTIC (seeded) and holds itself to the rules `verify:mirrowen` holds the world
 * to: every footprint disjoint, every site clear of every prop and the water, every approach on open
 * ground facing the way the player walks in, the boss's ground kept open.
 *
 * THE BENCHES ARE BUILT INTO THE HARBOUR (`src/three/mirrowen/host-plan.js`). Each host declares its
 * footprint (`extent`, in its own frame) and the generator keeps every free prop out of it and out of
 * the lane in front of its plate; `verify:mirrowen` measures the real build against the declaration.
 *
 * Run: node tools/gen-mirrowen-layout.mjs
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { HOST_PLAN, LANE } from '../src/three/mirrowen/host-plan.js';

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
const rnd = mulberry32(0x31770);
const round = n => Math.round(n * 100) / 100;
const deg = d => d * Math.PI / 180;

const ROAD = 27;           // the quay ring, between the basin and the benches
const BASIN = 15;          // the harbour basin's water
/** The canal: a capsule from (0, -8) to (0, -96), sixteen metres across; the sheet lies on it north of FROZEN_Z. */
const CHANNEL = { ax: 0, az: -8, bx: 0, bz: -96, half: 8 };
const FROZEN_Z = -56;
/** Where the Undertow is fought: open quay on the east bank, the frozen stretch to its west and the ice behind it. */
const ARENA = { boss: [30, 0, -78], player: [30, 1.6, -62] };
const SHORE = 148;

const distSeg = (x, z, a, b) => {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const L2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2));
  return Math.hypot(x - (a[0] + dx * t), z - (a[1] + dz * t));
};
/** Signed distance to open water (negative over it), as terrain.js computes it. */
const waterSD = (x, z) => Math.min(Math.hypot(x, z) - BASIN, distSeg(x, z, [CHANNEL.ax, CHANNEL.az], [CHANNEL.bx, CHANNEL.bz]) - CHANNEL.half);

/* ---------------------------------------------------------------- the sites */

const APPROACH = 4.6;      // how far in front of the plate the player is asked to stand

const QUESTS = [
  ['q1-states', 'Three States'],
  ['q2-grip', 'The Grip Between'],
  ['q3-boil', 'Liquids and Vapour'],
  ['q4-solids', 'Kinds of Solid'],
  ['q5-crossing', 'The Crossing'],
  ['q6-solution', 'Taken Into Solution'],
  ['q7-separate', 'Pulling Apart']
];

/** Where each host stands: at an angle (degrees from the south, toward the east) and a radius, its plate facing the middle of the harbour. */
const SITE_DEFS = QUESTS.map(([questId, title], i) => {
  const id = `site-${i + 1}`;
  const plan = HOST_PLAN[id];
  const a = deg(plan.angle);
  const out = [Math.sin(a), Math.cos(a)];
  const r = plan.radius;
  const f = [-out[0], -out[1]];
  return { id, questId, title, stage: i + 1, pos: [out[0] * r, out[1] * r], f };
});

/** A host-frame point as a world point: x to the player's right, z toward the player. */
function toWorld(def, lx, lz) {
  const [px, pz] = def.pos;
  const [fx, fz] = def.f;
  return [px + lx * fz + lz * fx, pz - lx * fx + lz * fz];
}
function hostRect(def, [x0, x1, z0, z1]) {
  const pts = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].map(([lx, lz]) => toWorld(def, lx, lz));
  return {
    minX: Math.min(...pts.map(p => p[0])), maxX: Math.max(...pts.map(p => p[0])),
    minZ: Math.min(...pts.map(p => p[1])), maxZ: Math.max(...pts.map(p => p[1]))
  };
}
const unionRect = (a, b) => ({ minX: Math.min(a.minX, b.minX), maxX: Math.max(a.maxX, b.maxX), minZ: Math.min(a.minZ, b.minZ), maxZ: Math.max(a.maxZ, b.maxZ) });
function rectDist(x, z, r) {
  const dx = Math.max(r.minX - x, 0, x - r.maxX), dz = Math.max(r.minZ - z, 0, z - r.maxZ);
  return Math.hypot(dx, dz);
}

const sites = SITE_DEFS.map(d => {
  const plan = HOST_PLAN[d.id];
  const [fx, fz] = d.f;
  // The ground that must be level: the host's machinery and the lane in front of its plate.
  const area = unionRect(hostRect(d, plan.extent), hostRect(d, [-LANE.hw, LANE.hw, LANE.from, LANE.to]));
  const cx = (area.minX + area.maxX) / 2, cz = (area.minZ + area.maxZ) / 2;
  const r = Math.hypot(area.maxX - area.minX, area.maxZ - area.minZ) / 2 + 0.8;
  return {
    id: d.id, questId: d.questId, stage: d.stage,
    pos: [round(d.pos[0]), 0, round(d.pos[1])],
    approachPos: [round(d.pos[0] + fx * APPROACH), 1.6, round(d.pos[1] + fz * APPROACH)],
    label: `Bench ${d.stage} - ${d.title}`,
    structure: plan.structure, built: true,
    flat: { x: round(cx), z: round(cz), r: round(r) }
  };
});

/* ---------------------------------------------------------------- the props */

const landmarks = [];
const taken = [];   // { x, z, r }
/** Rects (world AABB) that no free prop may stand in: every host's real extent and its lane. */
const KEEP = [];
const keep = (name, r, { margin = 0.8, owner = null } = {}) => KEEP.push({ name, ...r, margin, owner });
function fits(x, z, r, pad = 0.6) {
  if (!taken.every(t => Math.hypot(x - t.x, z - t.z) >= t.r + r + pad)) return false;
  if (!KEEP.every(k => rectDist(x, z, k) >= r + k.margin)) return false;
  if (waterSD(x, z) < r + 3) return false;
  if (Math.hypot(x, z) > 96) return false;
  return true;
}
function add(asset, x, z, radius, extra = {}) {
  landmarks.push({ asset, pos: [round(x), 0, round(z)], radius, ...extra });
  taken.push({ x, z, r: radius });
}

// Every host claims its whole footprint, and the lane in front of its plate, before anything free is placed.
for (const d of SITE_DEFS) {
  keep(`${d.id} host`, hostRect(d, HOST_PLAN[d.id].extent), { owner: d.id });
  keep(`${d.id} approach`, hostRect(d, [-LANE.hw, LANE.hw, LANE.from, LANE.to]), { margin: 0.2, owner: d.id });
}
for (const s of sites) taken.push({ x: s.approachPos[0], z: s.approachPos[2], r: 3.2 });
// The basin and its bank, the quay ring (as a ring of claims), the spawn and its road, the boss's ground and its lane.
taken.push({ x: 0, z: 0, r: BASIN + 3.5 });
for (let i = 0; i < 48; i++) {
  const a = (i / 48) * Math.PI * 2;
  if (waterSD(ROAD * Math.sin(a), ROAD * Math.cos(a)) < 4) continue;
  taken.push({ x: ROAD * Math.sin(a), z: ROAD * Math.cos(a), r: 2.2 });
}
for (let z = 40; z <= 92; z += 5) taken.push({ x: 0, z, r: 3.4 });
taken.push({ x: ARENA.boss[0], z: ARENA.boss[2], r: 11 });
taken.push({ x: ARENA.player[0], z: ARENA.player[2], r: 5 });
const LANES = [{ points: [[13, -27], [13, -54], [30, -60]], width: 3.0 }];
for (const lane of LANES) {
  for (let i = 0; i < lane.points.length - 1; i++) {
    const [a, b] = [lane.points[i], lane.points[i + 1]];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let t = 0; t <= L; t += 3) taken.push({ x: a[0] + (b[0] - a[0]) * t / L, z: a[1] + (b[1] - a[1]) * t / L, r: 2.4 });
  }
}
// Each spoke, from the quay ring out to the bench's approach.
for (const s of sites) {
  const [ax, , az] = s.approachPos;
  const n = Math.hypot(ax, az);
  for (let r = Math.min(ROAD + 2, n); r <= Math.max(ROAD + 2, n); r += 3) taken.push({ x: ax / n * r, z: az / n * r, r: 2.2 });
}

// The landing pad: south-east, on open shelf, with the room a hull needs round it.
add('landing-pad', 62, 68, 10, { minTier: 'T3' });
taken.push({ x: 62, z: 68, r: 21 });
taken.push({ x: 30, z: 74, r: 3 });   // the spur from the spawn road to the pad

/* ---- the harbour ---- */
add('harbour-light', -9, 19, 2.2, { minTier: 'T3' });
function store(x, z) {
  const rotY = Math.atan2(-x, -z);
  add('shed', x, z, 6.0, { rotY: round(rotY), minTier: 'T3' });
}
store(72, 6);
store(-72, -2);
store(-30, 82);
add('gantry-crane', -62, -50, 7.2, { minTier: 'T3' });

/* ---- the Fifth's ice: walls on both banks of the frozen stretch and across its end ---- */
let wallSeed = 0;
const wall = (x, z, scale = 1) => add('ice-wall', x, z, round(4.4 * scale), { scale, minTier: 'T3' });
for (const sx of [-1, 1]) for (let z = -72; z >= -92; z -= 10) wall(sx * (CHANNEL.half + 5.2), z + (wallSeed++ % 3) * 0.5);
for (let x = -42; x <= 42; x += 10.5) wall(x, -106.5, 1.15);

/* ---- hulls the ice took ---- */
const hulls = [
  { x: 0, z: -86, length: 28, beam: 8.6, roll: 0.05, yaw: 0, freeboard: 4.2 },
  { x: 0, z: -64, length: 10, beam: 5, roll: -0.04, yaw: 0, freeboard: 2.4, tug: true }
];

function scatter(asset, count, test, radius, extra = () => ({})) {
  let placed = 0;
  for (let k = 0; k < 6000 && placed < count; k++) {
    const x = (rnd() - 0.5) * 200, z = (rnd() - 0.5) * 200;
    if (!test(x, z)) continue;
    if (!fits(x, z, radius)) continue;
    add(asset, x, z, radius, extra());
    placed++;
  }
  return placed;
}
const near = (cx, cz, r) => (x, z) => Math.hypot(x - cx, z - cz) < r;

scatter('crate-stack', 3, (x, z) => near(72, 6, 16)(x, z) || near(-72, -2, 16)(x, z), 2.0, () => ({ rotY: round(rnd() * 6.28), minTier: 'T3' }));
scatter('drum-rack', 3, (x, z) => near(-30, 82, 16)(x, z) || near(72, 6, 16)(x, z), 1.8, () => ({ rotY: round(rnd() * 6.28), minTier: 'T4' }));

// Mooring bollards along the quay edge of the basin, off the canal's mouth.
for (let i = 0; i < 28; i++) {
  const a = (i / 28) * Math.PI * 2 + 0.05;
  const x = (BASIN + 2.6) * Math.sin(a), z = (BASIN + 2.6) * Math.cos(a);
  if (waterSD(x, z) < 2.2) continue;
  landmarks.push({ asset: 'bollard', pos: [round(x), 0, round(z)], radius: 0.5, minTier: 'T4' });
}

/* -------------------------------------------------------------- the lamps */

const POSTS = 26;
for (let i = 0; i < POSTS; i++) {
  const a = (i / POSTS) * Math.PI * 2 + 0.06;
  const r = ROAD + 2.4;
  const x = r * Math.sin(a), z = r * Math.cos(a);
  if (waterSD(x, z) < 5) continue;
  const near2 = sites.some(s => {
    const n = Math.hypot(s.approachPos[0], s.approachPos[2]);
    return Math.hypot(x - s.approachPos[0] * (r / n), z - s.approachPos[2] * (r / n)) < 3.4;
  });
  if (near2) continue;
  if (Math.abs(x) < 4 && z > 20) continue;
  landmarks.push({ asset: 'lamp-post', pos: [round(x), 0, round(z)], radius: 0.6, minTier: 'T3' });
}
// Down the spawn road, and along the lane to the boss's ground.
for (const z of [48, 60, 72]) for (const x of [-3.6, 3.6]) landmarks.push({ asset: 'lamp-post', pos: [x, 0, z], radius: 0.6, minTier: 'T3' });
for (const [x, z] of [[16.4, -34], [16.4, -46], [22, -57.5], [26, -66.5], [34, -66.5]]) landmarks.push({ asset: 'lamp-post', pos: [x, 0, z], radius: 0.6, minTier: 'T3' });

/* ---------------------------------------------------------------- self-check */

let problems = 0;
const bad = msg => { problems++; console.error(`  LAYOUT: ${msg}`); };
const nm = l => `${l.asset}@${l.pos[0]},${l.pos[2]}`;
const rectOverlap = (a, b) => a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
// Every free prop (and a lamp post) stands clear of every host's real extent and lane.
for (const l of landmarks) {
  for (const k of KEEP) if (rectDist(l.pos[0], l.pos[2], k) < l.radius + (k.margin > 0.5 ? 0.3 : 0.05) - 0.001) bad(`${nm(l)} stands in the ${k.name} keep-out`);
  if (l.asset !== 'ice-wall' && waterSD(l.pos[0], l.pos[2]) < l.radius + 1) bad(`${nm(l)} stands in or on the bank of the water`);
}
// The hosts' extents do not touch each other (one host's own pieces and lane may), and none touches the water or the boss's ground.
for (let i = 0; i < KEEP.length; i++) for (let j = i + 1; j < KEEP.length; j++) {
  const a = KEEP[i], b = KEEP[j];
  if (a.owner && a.owner === b.owner) continue;
  if (rectOverlap(a, b)) bad(`${a.name} and ${b.name} extents overlap`);
}
for (const d of SITE_DEFS) {
  const [x0, x1, z0, z1] = HOST_PLAN[d.id].extent;
  for (const [lx, lz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) {
    const [x, z] = toWorld(d, lx, lz);
    if (waterSD(x, z) < 3.2) bad(`${d.id} reaches ${waterSD(x, z).toFixed(1)} m from the water (its bank stands to 3.2)`);
    if (Math.abs(x) > 96 || Math.abs(z) > 96) bad(`${d.id} reaches the edge of the walk`);
  }
}
for (const k of KEEP.filter(k => !/approach/.test(k.name))) {
  if (rectDist(ARENA.boss[0], ARENA.boss[2], k) < 11) bad(`${k.name} reaches the Undertow's ground`);
  for (const lane of LANES) for (const p of lane.points) if (rectDist(p[0], p[1], k) < lane.width / 2 + 1.2) bad(`the boss lane passes ${k.name}`);
}
for (let i = 0; i < sites.length; i++) for (let j = i + 1; j < sites.length; j++) {
  const got = Math.hypot(sites[i].pos[0] - sites[j].pos[0], sites[i].pos[2] - sites[j].pos[2]);
  if (got < 8) bad(`${sites[i].id} and ${sites[j].id} are ${got.toFixed(1)} apart`);
}
if (problems) { console.error(`${problems} layout problem(s); nothing written.`); process.exit(1); }

/* ---------------------------------------------------------------- the world */

const world = {
  id: 'mirrowen',
  name: 'Mirrowen',
  place: 'Tidal shelf',
  oneLine: 'Solid, liquid and gas, what holds molecules together, and how a mixture comes apart.',
  sky: 'mirrowen-sky',
  terrain: { heightmap: 'mirrowen-shingle', size: [240, 240], maxHeight: 1.0, material: 'frost-shingle' },
  ambience: {
    keyLight: 0xedf3f7,
    fillLight: 0xbdd0dc,
    fogColor: 0xccd7da,
    fogNear: 60,
    fogFar: 700,
    dustDensity: 0.3
  },
  shore: SHORE,
  water: { level: -0.35, basin: { x: 0, z: 0, radius: BASIN }, channel: CHANNEL, frozenZ: FROZEN_Z },
  road: { radius: ROAD },
  lanes: LANES,
  arena: ARENA,
  hulls,
  landmarks,
  sites,
  spawn: { pos: [0, 1.6, 88], lookAt: [0, 1.6, 40] },
  t2: { stillCamera: Object.fromEntries(sites.map(s => [s.id, { pos: s.approachPos, lookAt: [s.pos[0], 1.2, s.pos[2]] }])) },
  t1: {
    siteOrder: sites.map(s => s.id)
  },
  tracks: []
};

writeFileSync(join(root, 'src/three/world-data/mirrowen.json'), JSON.stringify(world, null, 2) + '\n');
const count = a => landmarks.filter(l => l.asset === a).length;
console.log(`Mirrowen: ${landmarks.length} landmarks (${count('lamp-post')} lamps, ${count('ice-wall')} ice walls, ${count('bollard')} bollards), ${sites.length} sites, ${hulls.length} hulls written.`);
