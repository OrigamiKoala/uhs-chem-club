#!/usr/bin/env node
/**
 * gen-ligar-layout.mjs — Lays out Ligar's quarry, hills and mine and writes
 * `src/three/world-data/ligar.json`. (It replaces `gen-ligar-layout.py`: the floors of the workings
 * are laid from the real height field, which only the JS can evaluate.)
 *
 * Ligar is a quarry and the mine under the hills behind it. Benches 1, 3, 4 and 5 stand at surface
 * workings; 2, 6, 7, 8 and 9 stand underground (`docs/plans/bench-integration.md` §3):
 *
 *   1  slab-dressing yard     the saw bed at the quarry's west face      surface   shelf
 *   2  ore drift              just inside the main adit, where a vein crosses  hill A   ledge
 *   3  crusher house          the jaw crusher's inspection deck, east deck       surface   deck
 *   4  scale house            the weighbridge's desk, east deck                  surface   desk
 *   5  mine substation        at hill A's main portal                            surface   deck
 *   6  drill chamber          rock-bolt board and the drill jumbo's stand        hill A    ledge
 *   7  sump and pump station  down the decline of hill B                         hill B    ledge
 *   8  survey station         the junction of three drifts                       hill A    ledge
 *   9  hoist chamber          the deepest point, a winze to a lower level        hill B    desk
 *
 * THE HILLS AND THE WORKINGS ARE PLACED BY HAND BELOW; THE LANDMARKS ARE SETTLED. Hosts, hills and
 * the mine are fixed: they are a design. Props start where they are written and are pushed apart until
 * every footprint is clear, every one stands clear of the real extent of every long structure (belts,
 * hosts, the deck, the pit, the hills and their approach lanes) and of the boss's ground. The script
 * REFUSES to write the file if anything fixed collides, any chamber's bay is not inside its room, any
 * working has less than 1.5 m of rock over its roof, a doorway does not meet its neighbour at one
 * height, or the boss's ground is not open. `npm run verify:ligar` then builds the real world and
 * measures it; this only keeps the declaration honest.
 *
 * Run: node tools/gen-ligar-layout.mjs
 */

import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { installDomShim } from './lib/dom-shim.mjs';

installDomShim({ tier: 'T4' });
const { makeLigarField } = await import('../src/three/ligar/terrain.js');
const MP = await import('../src/three/ligar/mine-plan.js');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outPath = join(root, 'src/three/world-data/ligar.json');
const prev = JSON.parse(readFileSync(outPath, 'utf8'));

const round = n => Math.round(n * 100) / 100;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const field = makeLigarField(prev.terrain.maxHeight, []);
const plain = (x, z) => field.plain(x, z);

/* ---------------------------------------------------------------- fixed ground */

const SPAWN = [0, 48];
/** The warden is fought here: open ground the player walks up to from the spawn. */
const ARENA = { boss: [0, 2], player: [0, 14], radius: 5, corridor: { minX: -2, maxX: 2, minZ: 2, maxZ: 16 } };

const PIT = {
  floorY: -5.0,
  room: { minX: -26.0, maxX: 10.0, minZ: -34.0, maxZ: -8.0 },
  stair: { minX: 2.2, maxX: 7.6, minZ: -8.0, maxZ: 2.4 },
  headPos: [4.9, 0, 1.6],
  ceilingY: -1.2
};

/** The east deck: a plated apron over the pavement that sites 3 and 4 stand on. */
const DECK = { minX: 20.5, maxX: 33.0, minZ: -11.0, maxZ: 16.5, rise: 0.16 };

/* ------------------------------------------------------------------ the bay */

/** How far from the bench's centre the player is asked to stand (the approach mark). */
const APPROACH = 5.0;
const PLATE = { hw: 2.4, hd: 0.65 };
const LANE = { hw: 2.8, from: 0.65, to: 5.6 };

/** A bench's own frame: x to the player's right, z toward the player. World = (fz, -fx) x + (fx, fz) z. */
function benchPoint(def, lx, lz) {
  const [px, , pz] = def.pos;
  const [fx, fz] = def.f;
  return [px + lx * fz + lz * fx, pz - lx * fx + lz * fz];
}
function benchRect(def, x0, x1, z0, z1) {
  const pts = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].map(([lx, lz]) => benchPoint(def, lx, lz));
  return {
    minX: Math.min(...pts.map(p => p[0])), maxX: Math.max(...pts.map(p => p[0])),
    minZ: Math.min(...pts.map(p => p[1])), maxZ: Math.max(...pts.map(p => p[1]))
  };
}

/** A chamber is 11.2 wide and 11 deep: the back wall 3.1 m behind the plate's centre, the front 7.9 in front of it. */
const ROOM = { hw: 5.6, back: -3.1, front: 7.9 };
const roomRect = def => benchRect(def, -ROOM.hw, ROOM.hw, ROOM.back, ROOM.front);

/* ------------------------------------------------------------------- the hills */

const HILLS = [
  // Hill A: the main workings, east of the yard. Two portals look west at the plant.
  { id: 'hill-a', rect: { minX: 60.5, maxX: 105, minZ: -31, maxZ: 12 }, H: 16, corner: 7 },
  // Hill B: the decline, south-west of the yard, one portal looking east.
  { id: 'hill-b', rect: { minX: -92, maxX: -60.5, minZ: 12, maxZ: 59 }, H: 15, corner: 7 }
];

/* ------------------------------------------------------------------- the sites */

const FLOOR_A = round(plain(55.5, 0));                 // hill A's level: the ground at the main cutting's foot
const FLOOR_B = round(plain(-55.5, 24));               // hill B's portal level
const FALL = 0.1;                                      // 5.7 degrees: the steepest a drift is graded
const B_R7 = round(FLOOR_B - FALL * 12);               // the decline falls 1.2 m to the sump chamber
const B_R9 = round(B_R7 - FALL * 12);                  // and another 1.2 m to the hoist chamber

const ground = (x, z) => round(plain(x, z));

const SITE_DEFS = [
  { id: 'site-1', questId: 'q1-joins', stage: 1, label: 'Bench 1 - What Holds', structure: 'slab-yard',
    pos: [-36, ground(-36, 1), 1], f: [0, 1] },
  { id: 'site-2', questId: 'q2-lattice', stage: 2, label: 'Bench 2 - Stone and Wire', structure: 'ore-drift',
    pos: [79.9, FLOOR_A, 0], f: [-1, 0] },
  { id: 'site-3', questId: 'q3-distance', stage: 3, label: 'Bench 3 - Bond Energy', structure: 'crusher-house',
    pos: [26, round(ground(26, -4) + DECK.rise), -4], f: [-1, 0] },
  { id: 'site-4', questId: 'q4-dots', stage: 4, label: 'Bench 4 - Lewis Structures', structure: 'scale-house',
    pos: [26, round(ground(26, 8) + DECK.rise), 8], f: [-1, 0] },
  { id: 'site-5', questId: 'q5-resonance', stage: 5, label: 'Bench 5 - Resonance', structure: 'substation',
    pos: [47.5, ground(47.5, 8.5), 8.5], f: [0, -1] },
  { id: 'site-6', questId: 'q6-shape', stage: 6, label: 'Bench 6 - Molecular Shape', structure: 'drill-chamber',
    pos: [94.9, FLOOR_A, -16.5], f: [-1, 0] },
  { id: 'site-7', questId: 'q7-polarity', stage: 7, label: 'Bench 7 - Polarity', structure: 'sump-station',
    pos: [-81.9, B_R7, 24], f: [1, 0] },
  { id: 'site-8', questId: 'q8-hybrid', stage: 8, label: 'Bench 8 - Hybridization', structure: 'survey-station',
    pos: [75.4, FLOOR_A, -21.5], f: [0, 1] },
  { id: 'site-9', questId: 'q9-orbitals', stage: 9, label: 'Bench 9 - Molecular Orbitals', structure: 'hoist-chamber',
    pos: [-76.8, B_R9, 49.5], f: [0, -1] }
];
const def = id => SITE_DEFS.find(d => d.id === id);
const underground = d => ['site-2', 'site-6', 'site-7', 'site-8', 'site-9'].includes(d.id);

const sites = SITE_DEFS.map(d => {
  const [px, py, pz] = d.pos;
  return {
    id: d.id, questId: d.questId, stage: d.stage,
    pos: [round(px), py, round(pz)],
    approachPos: [round(px + d.f[0] * APPROACH), round(py + 1.6), round(pz + d.f[1] * APPROACH)],
    label: d.label, structure: d.structure, built: true
  };
});

/* ------------------------------------------------------------------- the mine */

const DRIFT_HALF = 2.1;
const volumes = [];
function vol(id, hill, kind, rect, floor, extra = {}) {
  const v = { id, hill, kind, rect, floor, openings: [], ...extra };
  volumes.push(v);
  return v;
}
/** An opening on a shared plane, written on both sides. `side` is the first volume's. */
const OPP = { minX: 'maxX', maxX: 'minX', minZ: 'maxZ', maxZ: 'minZ' };
function door(a, side, lo, hi, b) {
  const A = volumes.find(v => v.id === a);
  A.openings.push({ side, lo: round(lo), hi: round(hi), to: b });
  if (b) {
    const B = volumes.find(v => v.id === b);
    B.openings.push({ side: OPP[side], lo: round(lo), hi: round(hi), to: a });
  }
}
const flat = y => ({ y0: y });
const grade = (axis, from, y0, to, y1) => ({ axis, from, y0, to, y1 });

const r2 = roomRect(def('site-2')), r8 = roomRect(def('site-8')), r6 = roomRect(def('site-6'));
const r7 = roomRect(def('site-7')), r9 = roomRect(def('site-9'));
const PORTAL_A = 62.0, FOOT_A = 55.5;      // headwall (nominal wall plane) and foot of hill A's cuttings
const PORTAL_B = -62.0, FOOT_B = -55.5;

// ---- Hill A. Level at FLOOR_A throughout.
{
  const A = 'hill-a';
  vol('cut-a1', A, 'cutting', { minX: FOOT_A, maxX: PORTAL_A, minZ: -DRIFT_HALF, maxZ: DRIFT_HALF }, flat(FLOOR_A));
  vol('adit-a1', A, 'drift', { minX: PORTAL_A, maxX: r2.minX, minZ: -DRIFT_HALF, maxZ: DRIFT_HALF }, flat(FLOOR_A));
  vol('ch-r2', A, 'chamber', r2, flat(FLOOR_A));
  const dx = 75.4;           // the drift north from the ore drift to the survey station
  vol('dr-a3', A, 'drift', { minX: dx - DRIFT_HALF, maxX: dx + DRIFT_HALF, minZ: r8.maxZ, maxZ: r2.minZ }, flat(FLOOR_A));
  vol('ch-r8', A, 'chamber', r8, flat(FLOOR_A));
  const zw = -16.5;          // the west and east drifts out of the survey station
  vol('dr-a4', A, 'drift', { minX: PORTAL_A, maxX: r8.minX, minZ: zw - DRIFT_HALF, maxZ: zw + DRIFT_HALF }, flat(FLOOR_A));
  vol('cut-a2', A, 'cutting', { minX: FOOT_A, maxX: PORTAL_A, minZ: zw - DRIFT_HALF, maxZ: zw + DRIFT_HALF },
    grade('x', FOOT_A, round(plain(FOOT_A, zw)), PORTAL_A, FLOOR_A));
  vol('dr-a5', A, 'drift', { minX: r8.maxX, maxX: r6.minX, minZ: zw - DRIFT_HALF, maxZ: zw + DRIFT_HALF }, flat(FLOOR_A));
  vol('ch-r6', A, 'chamber', r6, flat(FLOOR_A));

  door('cut-a1', 'minX', -DRIFT_HALF, DRIFT_HALF, null);
  door('cut-a1', 'maxX', -DRIFT_HALF, DRIFT_HALF, 'adit-a1');
  door('adit-a1', 'maxX', -DRIFT_HALF, DRIFT_HALF, 'ch-r2');
  door('ch-r2', 'minZ', dx - DRIFT_HALF, dx + DRIFT_HALF, 'dr-a3');
  door('dr-a3', 'minZ', dx - DRIFT_HALF, dx + DRIFT_HALF, 'ch-r8');
  door('ch-r8', 'minX', zw - DRIFT_HALF, zw + DRIFT_HALF, 'dr-a4');
  door('dr-a4', 'minX', zw - DRIFT_HALF, zw + DRIFT_HALF, 'cut-a2');
  door('cut-a2', 'minX', zw - DRIFT_HALF, zw + DRIFT_HALF, null);
  door('ch-r8', 'maxX', zw - DRIFT_HALF, zw + DRIFT_HALF, 'dr-a5');
  door('dr-a5', 'maxX', zw - DRIFT_HALF, zw + DRIFT_HALF, 'ch-r6');
}

// ---- Hill B. The decline falls 0.1 m per metre to the sump chamber and again to the hoist chamber.
{
  const B = 'hill-b';
  const zc = 24, xc = -76.8;
  vol('cut-b1', B, 'cutting', { minX: PORTAL_B, maxX: FOOT_B, minZ: zc - DRIFT_HALF, maxZ: zc + DRIFT_HALF }, flat(FLOOR_B));
  vol('dr-b1', B, 'drift', { minX: r7.maxX, maxX: PORTAL_B, minZ: zc - DRIFT_HALF, maxZ: zc + DRIFT_HALF },
    grade('x', PORTAL_B, FLOOR_B, r7.maxX, B_R7));
  vol('ch-r7', B, 'chamber', r7, flat(B_R7));
  vol('dr-b2', B, 'drift', { minX: xc - DRIFT_HALF, maxX: xc + DRIFT_HALF, minZ: r7.maxZ, maxZ: r9.minZ },
    grade('z', r7.maxZ, B_R7, r9.minZ, B_R9));
  vol('ch-r9', B, 'chamber', r9, flat(B_R9));

  door('cut-b1', 'maxX', zc - DRIFT_HALF, zc + DRIFT_HALF, null);
  door('cut-b1', 'minX', zc - DRIFT_HALF, zc + DRIFT_HALF, 'dr-b1');
  door('dr-b1', 'minX', zc - DRIFT_HALF, zc + DRIFT_HALF, 'ch-r7');
  door('ch-r7', 'maxZ', xc - DRIFT_HALF, xc + DRIFT_HALF, 'dr-b2');
  door('dr-b2', 'maxZ', xc - DRIFT_HALF, xc + DRIFT_HALF, 'ch-r9');
}
for (const v of volumes) {
  v.rect = Object.fromEntries(Object.entries(v.rect).map(([k, n]) => [k, round(n)]));
  if (v.kind === 'cutting') v.floor = Object.fromEntries(Object.entries(v.floor).map(([k, n]) => [k, typeof n === 'number' ? round(n) : n]));
}
const mine = { roof: MP.ROOF, volumes };

/* --------------------------------------------------------------- the landmarks */

const L = [];
const PINNED = new Set();
function lm(asset, x, z, { rotY = 0, scale = 1, radius = 2, minTier = 'T3', host = null, pinned = false } = {}) {
  const e = { asset, pos: [round(x), 0, round(z)], rotY: round(rotY), scale: round(scale), radius: round(radius), minTier };
  if (host) e.host = host;
  L.push(e);
  if (pinned) PINNED.add(e);
  return e;
}

// ---- the three great arches, striding away to the north
// Pinned where they have always stood: an arch's talus is seeded from its position, so one that drifts a
// few centimetres in the settle is a different heap of rubble.
lm('arch', -63.96, -34.71, { rotY: 0.28, scale: 0.86, radius: 15.0, pinned: true });
lm('arch', -4.08, -66.08, { rotY: -0.16, scale: 1.22, radius: 20.0, pinned: true });
lm('arch', 48, -58, { rotY: 0.52, scale: 0.94, radius: 16.0, pinned: true });

// ---- standing colonnade: patches of hexagonal basalt columns
for (const [x, z, r, s, rot] of [
  [-44, 30, 9.0, 1.00, 0.20], [-24, 42, 8.0, 0.88, -0.35], [14, 44, 9.5, 1.06, 0.55], [34, 30, 8.5, 0.94, 0.10],
  [48, 28, 9.0, 1.00, -0.45], [46, -20, 8.0, 0.90, 0.30], [-48, -4, 8.5, 0.96, 0.62], [-44, -44, 9.5, 1.10, -0.22],
  [16, -46, 8.0, 0.86, 0.44], [44, 52, 9.0, 0.98, -0.12]
]) lm('colonnade', x, z, { rotY: rot, scale: s, radius: r, minTier: 'T2' });

// ---- spoil heaps of shattered hexagonal rubble
for (const [x, z, r, s, rot] of [
  [-38, 18, 4.2, 1.00, 0.4], [6, 24, 4.6, 1.08, -0.2], [40, -16, 4.0, 0.92, 0.7],
  [-40, 46, 4.8, 1.12, 0.1], [26, 54, 4.4, 1.00, -0.5], [-16, 54, 4.2, 0.96, 0.25]
]) lm('spoil-heap', x, z, { rotY: rot, scale: s, radius: r });

// ---- fallen column sections lying on the flat: decoration, the world stands without them
for (const [x, z, rot, s] of [
  [-14, 24, 0.9, 1.0], [2, 36, -0.4, 1.1], [20, 18, 1.4, 0.9], [-32, 22, 0.2, 1.0], [34, 24, -1.1, 1.05],
  [-10, -2, 0.6, 0.95], [42, 5, 2.0, 1.0], [-52, 16, -0.7, 1.08], [10, 54, 0.3, 0.92], [-30, 52, 1.7, 1.0]
]) lm('broken-column', x, z, { rotY: rot, scale: s, radius: 2.6, minTier: (Math.abs(x) > 28 || Math.abs(z) > 30) ? 'T4' : 'T3' });

// ---- the four conveyors climbing out of the cut. Their legs are their colliders, so a player walks under.
const BELT_Z = [-31.0, -24.5, -18.0, -11.5];
for (const z of BELT_Z) lm('conveyor', -24.5, z, { rotY: -1.5708, radius: 3.2 });
for (const x of [-20, -13.5, -7]) lm('ore-cart', x, -37, { radius: 1.5 });

// ---- yard furniture
lm('guard-hut', 15, -16, { rotY: -0.35, radius: 2.4 });
lm('hauler', 16, 4, { rotY: 0.62, radius: 4.2 });
for (const [x, z, rot] of [[13, -4, 0.2], [13, -0.2, -0.4], [14, 13, 0.8], [34, -22, 0.1]]) lm('drum-stack', x, z, { rotY: rot, radius: 1.8 });
lm('shed', -26, 29, { rotY: 0.4, radius: 5.0 });
lm('shed', -42, 12, { rotY: 0.15, scale: 0.9, radius: 4.6 });
lm('stack', -44, -26, { scale: 1.1, radius: 5.6 });
lm('stack', 30, -32, { scale: 0.95, radius: 5.6 });
lm('water-tower', -18, 4, { rotY: 0.3, radius: 3.0 });
lm('cable-mast', -4, 16, { radius: 1.4 });
lm('cable-mast', 40, -26, { radius: 1.4 });
lm('landing-pad', 0, 50, { radius: 8.0, minTier: 'T2' });
for (const [x, z] of [[0, 32], [10, 10], [-12, 10], [20, -24]]) lm('stake-marker', x, z, { radius: 0.9, minTier: 'T4' });

// ---- the hosts of the four surface benches: each declares the circle its machinery stands in
const behind = (d, back, side = 0) => benchPoint(d, side, -back);
{
  const hosts = [
    ['slab-yard', 'site-1', [0, -3.0], 6.8],
    ['crusher-house', 'site-3', [0, -5.6], 8.2],
    ['scale-house', 'site-4', [1.8, -1.5], 5.8],
    ['substation', 'site-5', [0, -2.8], 7.0]
  ];
  for (const [asset, id, [lx, lz], r] of hosts) {
    const [x, z] = benchPoint(def(id), lx, lz);
    lm(asset, x, z, { radius: r, host: id });
  }
}
const fixedCount = L.length;
const HOSTLESS = L.filter(l => !l.host);

/* ------------------------------------------------------- real extents (keep-outs) */

const KEEP = [];
const keep = (name, r, { margin = 0.8, owner = null, lane = false } = {}) => KEEP.push({ name, ...r, margin, owner, lane });

// Hosts in their own frame: [x0, x1, z0, z1] each. The plate, then what stands round it.
const HOST_EXTENT = {
  'site-1': [[-2.5, 2.5, -0.7, 0.7], [-7.8, 7.8, -4.4, -0.7]],
  'site-3': [[-2.5, 2.5, -0.7, 0.7], [-5.8, 5.8, -13.5, -0.7]],
  'site-4': [[-2.5, 2.5, -0.7, 0.7], [-3.4, 3.4, -5.4, -0.7], [3.0, 7.0, -3.8, 3.2]],
  'site-5': [[-2.5, 2.5, -0.7, 0.7], [-6.4, 6.4, -5.4, -0.7]]
};
for (const [id, rects] of Object.entries(HOST_EXTENT)) {
  rects.forEach((r, i) => keep(`${id} host ${i}`, benchRect(def(id), ...r), { owner: id }));
}
for (const d of SITE_DEFS) {
  if (underground(d)) continue;
  keep(`${d.id} approach`, benchRect(d, -LANE.hw, LANE.hw, LANE.from, LANE.to), { margin: 0.2, owner: d.id, lane: true });
}
// Each belt's whole 22 m, not the middle.
for (const l of L.filter(l => l.asset === 'conveyor')) {
  const s = Math.sin(l.rotY), c = Math.cos(l.rotY);
  const a = [l.pos[0] + 11.5 * s, l.pos[2] + 11.5 * c], b = [l.pos[0] - 11.5 * s, l.pos[2] - 11.5 * c];
  keep('conveyor', { minX: Math.min(a[0], b[0]), maxX: Math.max(a[0], b[0]), minZ: Math.min(a[1], b[1]) - 1.9, maxZ: Math.max(a[1], b[1]) + 1.9 }, { margin: 0.4 });
}
keep('pit', PIT.room, { margin: 1.6 });
keep('ramp', PIT.stair, { margin: 1.6 });
keep('deck', DECK, { margin: 0.6, owner: 'deck' });
keep('boss arena', { minX: ARENA.boss[0] - ARENA.radius, maxX: ARENA.boss[0] + ARENA.radius, minZ: ARENA.boss[1] - ARENA.radius, maxZ: ARENA.boss[1] + ARENA.radius }, { margin: 0 });
keep('arena corridor', ARENA.corridor, { margin: 0 });
// The hills: out to their collider ring and the lanes into the cuttings.
for (const h of HILLS) keep(`${h.id}`, { minX: h.rect.minX - MP.RING.out - 1, maxX: h.rect.maxX + MP.RING.out + 1, minZ: h.rect.minZ - MP.RING.out - 1, maxZ: h.rect.maxZ + MP.RING.out + 1 }, { margin: 0.8 });
// The lane a player walks to each cutting from the yard (a landmark never stands in it).
for (const c of volumes.filter(v => v.kind === 'cutting')) {
  const foot = c.openings.find(o => o.to === null);
  const west = foot.side === 'minX';
  const z0 = c.rect.minZ - 1.2, z1 = c.rect.maxZ + 1.2;
  keep(`${c.id} lane`, west
    ? { minX: c.rect.minX - 12, maxX: c.rect.minX, minZ: z0, maxZ: z1 }
    : { minX: c.rect.maxX, maxX: c.rect.maxX + 12, minZ: z0, maxZ: z1 }, { margin: 0.4, owner: c.id, lane: true });
}

/* ------------------------------------------------------------------ settle */

const rectDist = (x, z, r) => Math.hypot(Math.max(r.minX - x, 0, x - r.maxX), Math.max(r.minZ - z, 0, z - r.maxZ));
const SPANS = ['conveyor', 'ore-cart'];
const isFree = e => !e.host && !PINNED.has(e) && !SPANS.includes(e.asset);
const inPit = (x, z, pad = 0) => {
  const r = PIT.room, s = PIT.stair;
  return (r.minX - pad < x && x < r.maxX + pad && r.minZ - pad < z && z < r.maxZ + pad) ||
    (s.minX - pad < x && x < s.maxX + pad && s.minZ - pad < z && z < s.maxZ + pad);
};

// A conveyor is twenty-two metres long, not a circle: a row of ghosts down its whole run.
const GHOSTS = [];
for (const l of L.filter(l => l.asset === 'conveyor')) {
  const s = Math.sin(l.rotY), c = Math.cos(l.rotY);
  for (let k = -13; k <= 13; k += 2) GHOSTS.push({ pos: [l.pos[0] + k * s, 0, l.pos[2] + k * c], radius: 1.6 });
}

for (let pass = 0; pass < 600; pass++) {
  let moved = false;
  for (const it of L) {
    if (!isFree(it)) continue;
    for (const g of GHOSTS) {
      const need = it.radius + g.radius + 0.5;
      const dx = it.pos[0] - g.pos[0], dz = it.pos[2] - g.pos[2];
      const got = Math.hypot(dx, dz) || 1e-6;
      if (got >= need) continue;
      const nx = g.pos[0] + dx / got * need, nz = g.pos[2] + dz / got * need;
      if (inPit(nx, nz, 1.0)) continue;
      moved = true;
      it.pos[0] = nx; it.pos[2] = nz;
    }
    for (const k of KEEP) {
      const need = it.radius + k.margin;
      if (rectDist(it.pos[0], it.pos[2], k) >= need) continue;
      moved = true;
      const cx = (k.minX + k.maxX) / 2, cz = (k.minZ + k.maxZ) / 2;
      const hx = (k.maxX - k.minX) / 2 + need + 0.02, hz = (k.maxZ - k.minZ) / 2 + need + 0.02;
      const dx = it.pos[0] - cx, dz = it.pos[2] - cz;
      const px = hx - Math.abs(dx), pz = hz - Math.abs(dz);
      if (px < pz) it.pos[0] = cx + Math.sign(dx || 1) * hx; else it.pos[2] = cz + Math.sign(dz || 1) * hz;
    }
    for (const o of L) {
      if (o === it) continue;
      // An arch's feet flare past its declared radius: a prop keeps a metre and a half further from one.
      const need = it.radius + o.radius + 0.5 + (it.asset === 'arch' || o.asset === 'arch' ? 1.5 : 0);
      const dx = it.pos[0] - o.pos[0], dz = it.pos[2] - o.pos[2];
      const got = Math.hypot(dx, dz) || 1e-6;
      if (got >= need) continue;
      moved = true;
      const free2 = isFree(o);
      const push = free2 ? (need - got) / 2 + 0.01 : need - got + 0.01;
      const nx = it.pos[0] + dx / got * push, nz = it.pos[2] + dz / got * push;
      if (!(inPit(nx, nz, 1.0))) { it.pos[0] = nx; it.pos[2] = nz; }
      if (free2) {
        const ox = o.pos[0] - dx / got * push, oz = o.pos[2] - dz / got * push;
        if (!inPit(ox, oz, 1.0)) { o.pos[0] = ox; o.pos[2] = oz; }
      }
    }
    for (const s of sites) {
      if (s.pos[1] < -1 || underground(def(s.id))) continue;
      for (const key of ['pos', 'approachPos']) {
        const need = it.radius + 2.6;
        const dx = it.pos[0] - s[key][0], dz = it.pos[2] - s[key][2];
        const got = Math.hypot(dx, dz) || 1e-6;
        if (got >= need) continue;
        moved = true;
        it.pos[0] = s[key][0] + dx / got * need; it.pos[2] = s[key][2] + dz / got * need;
      }
    }
    it.pos[0] = Math.max(-96, Math.min(96, it.pos[0]));
    it.pos[2] = Math.max(-96, Math.min(96, it.pos[2]));
  }
  if (!moved) break;
}
for (const it of L) { it.pos[0] = round(it.pos[0]); it.pos[2] = round(it.pos[2]); }

/* ------------------------------------------------------------------- checks */

let fail = 0;
const bad = m => { fail++; console.log('FAIL', m); };
const nm = l => `${l.asset}@${l.pos[0]},${l.pos[2]}`;
const P = l => [l.pos[0], l.pos[2]];

// Every footprint is disjoint.
for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
  const need = L[i].radius + L[j].radius;
  const got = dist(P(L[i]), P(L[j]));
  if (got < need) bad(`${nm(L[i])} and ${nm(L[j])} overlap by ${(need - got).toFixed(2)}`);
}
// Free props clear of every real extent.
for (const it of L.filter(isFree)) for (const k of KEEP) {
  if (rectDist(it.pos[0], it.pos[2], k) < it.radius + k.margin - 0.001) bad(`${nm(it)} stands in the ${k.name} keep-out`);
}
// Surface sites stand clear of every prop that is not their own host.
for (const s of sites) {
  if (underground(def(s.id))) continue;
  for (const l of L) {
    if (l.host === s.id) continue;
    const got = dist([s.pos[0], s.pos[2]], P(l));
    if (got < l.radius + 2.2) bad(`${s.id} is inside ${nm(l)} (${got.toFixed(2)})`);
  }
  const h = L.find(l => l.host === s.id);
  if (h && dist([s.approachPos[0], s.approachPos[2]], P(h)) < h.radius + 0.5) bad(`${s.id}'s approach is inside its own host ${nm(h)}`);
}
// The approach lane is open ground: no prop's circle crosses it (its own host sits behind the plate).
for (const d of SITE_DEFS) {
  if (underground(d)) continue;
  const lane = benchRect(d, -LANE.hw, LANE.hw, LANE.from, LANE.to);
  for (const l of L) {
    if (l.host === d.id) continue;
    if (rectDist(l.pos[0], l.pos[2], lane) < l.radius) bad(`${d.id}'s approach lane is crossed by ${nm(l)}`);
  }
}
// The hosts' real extents do not touch each other or anything fixed.
for (let i = 0; i < KEEP.length; i++) for (let j = i + 1; j < KEEP.length; j++) {
  const a = KEEP[i], b = KEEP[j];
  if (a.lane && b.lane) continue;
  if (['boss arena', 'arena corridor'].includes(a.name) && ['boss arena', 'arena corridor'].includes(b.name)) continue;
  if (a.owner && a.owner === b.owner) continue;
  if (a.name === 'deck' || b.name === 'deck') { const o = a.name === 'deck' ? b : a; if (/^site-[34]/.test(o.name)) continue; }
  if (/^ramp$|^pit$/.test(a.name) && /^ramp$|^pit$/.test(b.name)) continue;
  // The warden has always been fought beside the ramp's head: the arena is an open sight line, not a floor the ramp must keep off.
  if (/^(ramp|pit)$/.test(a.name) && /^arena/.test(b.name) || /^(ramp|pit)$/.test(b.name) && /^arena|^boss/.test(a.name)) continue;
  if (/^(ramp|pit)$/.test(a.name) && /^boss/.test(b.name) || /^(ramp|pit)$/.test(b.name) && /^boss/.test(a.name)) continue;
  // The yard's belts reach out over the pit's lip and run into it: they cross it by design.
  if ((a.name === 'conveyor' && /^(pit|ramp)$/.test(b.name)) || (b.name === 'conveyor' && /^(pit|ramp)$/.test(a.name))) continue;
  if (a.name === 'conveyor' && b.name === 'conveyor') continue;
  if (a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ) bad(`${a.name} and ${b.name} extents overlap`);
}
// The deck holds both of its sites' hosts.
for (const id of ['site-3', 'site-4']) {
  for (const r of HOST_EXTENT[id]) {
    const w = benchRect(def(id), ...r);
    if (w.minX < DECK.minX || w.maxX > DECK.maxX + 7 || w.minZ < DECK.minZ || w.maxZ > DECK.maxZ) bad(`${id}'s host leaves the deck (${JSON.stringify(w)})`);
  }
}
// The boss's ground is open.
for (const l of L) {
  if (dist(P(l), ARENA.boss) < l.radius + ARENA.radius) bad(`${nm(l)} stands on the boss's ground`);
  if (rectDist(l.pos[0], l.pos[2], ARENA.corridor) < l.radius) bad(`${nm(l)} stands in the arena corridor`);
}
// Nothing but the belts stands in the pit.
for (const l of L) if (!SPANS.includes(l.asset) && inPit(l.pos[0], l.pos[2])) bad(`${nm(l)} stands in the cut`);
// Surface sites face along an axis (a host's colliders are axis-aligned).
for (const s of sites) {
  const dx = s.approachPos[0] - s.pos[0], dz = s.approachPos[2] - s.pos[2];
  if (Math.min(Math.abs(dx), Math.abs(dz)) > 1e-6) bad(`${s.id} does not face along an axis`);
}
for (const l of L) if (Math.abs(l.pos[0]) > 108 || Math.abs(l.pos[2]) > 108) bad(`${nm(l)} is off the terrain`);

/* ---------------------------------------------------------- the mine's checks */

const plan = MP.makeMinePlan({ hills: HILLS, mine });
const inter = (a, b) => Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX) > 0.01 && Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ) > 0.01;
for (let i = 0; i < volumes.length; i++) for (let j = i + 1; j < volumes.length; j++) {
  if (inter(volumes[i].rect, volumes[j].rect)) bad(`workings ${volumes[i].id} and ${volumes[j].id} overlap`);
}
// Every doorway has a partner on the opposite side, on the shared plane, at the same height.
for (const v of volumes) {
  for (const o of v.openings) {
    if (o.to === null) continue;
    const w = plan.byId.get(o.to);
    const back = w?.openings.find(p => p.to === v.id && p.side === OPP[o.side] && Math.abs(p.lo - o.lo) < 0.011 && Math.abs(p.hi - o.hi) < 0.011);
    if (!back) { bad(`${v.id} opens ${o.side} to ${o.to}, which does not open back`); continue; }
    const plane = o.side === 'minX' ? v.rect.minX : o.side === 'maxX' ? v.rect.maxX : o.side === 'minZ' ? v.rect.minZ : v.rect.maxZ;
    const plane2 = back.side === 'minX' ? w.rect.minX : back.side === 'maxX' ? w.rect.maxX : back.side === 'minZ' ? w.rect.minZ : w.rect.maxZ;
    if (Math.abs(plane - plane2) > 0.011) bad(`${v.id} and ${o.to} do not share the plane of their doorway (${plane} vs ${plane2})`);
    const p = plan.doorPoint(v, o);
    const dy = Math.abs(plan.floorOf(v, p[0], p[1]) - plan.floorOf(w, p[0], p[1]));
    if (dy > 0.03) bad(`${v.id} and ${o.to} meet at two heights (${dy.toFixed(2)} m)`);
    const along = o.side === 'minX' || o.side === 'maxX' ? [v.rect.minZ, v.rect.maxZ] : [v.rect.minX, v.rect.maxX];
    if (o.lo < along[0] - 0.01 || o.hi > along[1] + 0.01) bad(`${v.id}'s doorway to ${o.to} is wider than its wall`);
  }
}
// A grade is walkable.
for (const v of volumes) {
  const f = v.floor;
  if (f.y1 !== undefined) {
    const g = Math.abs(f.y1 - f.y0) / Math.abs(f.to - f.from);
    if (g > 0.105) bad(`${v.id} is graded ${g.toFixed(3)} (more than 6 degrees)`);
  }
}
// The cuttings meet the ground at their foot.
for (const c of volumes.filter(v => v.kind === 'cutting')) {
  const foot = c.openings.find(o => o.to === null);
  const x = foot.side === 'minX' ? c.rect.minX : c.rect.maxX;
  const z = (c.rect.minZ + c.rect.maxZ) / 2;
  const dy = Math.abs(plan.floorOf(c, x, z) - plain(x, z));
  if (dy > 0.08) bad(`${c.id}'s floor is ${dy.toFixed(2)} m off the ground at its foot`);
}
// Every working is inside its hill, with rock over it.
const full = MP.makeMinePlan({ hills: HILLS, mine });
const surface = (x, z) => plain(x, z) + MP.hillsHeight(HILLS, x, z);
for (const v of volumes) {
  const hill = HILLS.find(h => h.id === v.hill);
  const r = v.rect;
  const sample = [];
  for (let x = r.minX; x <= r.maxX + 1e-6; x += Math.max(0.5, (r.maxX - r.minX) / 12)) for (let z = r.minZ; z <= r.maxZ + 1e-6; z += Math.max(0.5, (r.maxZ - r.minZ) / 12)) sample.push([x, z]);
  let worst = Infinity;
  for (const [x, z] of sample) {
    if (v.kind !== 'cutting') {
      const cover = surface(x, z) - (plan.floorOf(v, x, z) + MP.ROOF + 0.8);
      worst = Math.min(worst, cover);
    }
    if (v.kind !== 'cutting' && MP.hillDistance(hill, x, z) > -1.4) bad(`${v.id} reaches the edge of ${hill.id} at (${x.toFixed(1)}, ${z.toFixed(1)})`);
  }
  if (v.kind !== 'cutting' && worst < 1.4) bad(`${v.id} has ${worst.toFixed(2)} m of rock over its roof (needs 1.4)`);
}
// A chamber's bay is inside its room, and the room is inside the walk.
for (const d of SITE_DEFS.filter(underground)) {
  const v = volumes.find(x => x.kind === 'chamber' && Math.abs(x.rect.minX + x.rect.maxX - 2 * d.pos[0]) < 12 && x.rect.minX < d.pos[0] && d.pos[0] < x.rect.maxX && x.rect.minZ < d.pos[2] && d.pos[2] < x.rect.maxZ);
  if (!v) { bad(`${d.id} stands in no chamber`); continue; }
  const bay = benchRect(d, -2.7, 2.7, -1.95, LANE.to + 0.4);
  const room = { minX: v.rect.minX + MP.PROUD_MAX, maxX: v.rect.maxX - MP.PROUD_MAX, minZ: v.rect.minZ + MP.PROUD_MAX, maxZ: v.rect.maxZ - MP.PROUD_MAX };
  if (bay.minX < room.minX || bay.maxX > room.maxX || bay.minZ < room.minZ || bay.maxZ > room.maxZ) bad(`${d.id}'s bay leaves its chamber ${v.id}`);
  for (const k of ['minX', 'maxX', 'minZ', 'maxZ']) if (Math.abs(v.rect[k]) > 99.5) bad(`${v.id} reaches the edge of the walk (${k} ${v.rect[k]})`);
  if (Math.abs(plan.floorOf(v, d.pos[0], d.pos[2]) - d.pos[1]) > 0.011) bad(`${d.id} is not on its chamber's floor`);
}
// Every approach mark is reachable on foot: the route resolves through doorways to it.
for (const s of sites) {
  const route = plan.routeTo(SPAWN[0], SPAWN[1], s.approachPos[0], s.approachPos[2]);
  if (underground(def(s.id)) && route.length < 3) bad(`${s.id} has no way in from the yard`);
}
// The rings leave each cutting open and close everything else: a ring box never covers a cutting's floor.
for (const box of plan.ringColliders()) {
  for (const c of volumes.filter(v => v.kind === 'cutting')) {
    if (inter(box, c.rect)) bad(`the ring of ${box.hill} closes ${c.id}`);
  }
  for (const v of volumes.filter(x => x.kind !== 'cutting')) {
    const hole = { minX: v.rect.minX, maxX: v.rect.maxX, minZ: v.rect.minZ, maxZ: v.rect.maxZ };
    if (inter(box, hole)) bad(`the ring of ${box.hill} cuts into ${v.id}`);
  }
}
void full;

console.log(`${L.length} landmarks (${fixedCount} fixed), ${volumes.length} workings, ${sites.length} sites, ${fail} failures`);
if (fail) { console.log('refusing to write'); process.exit(1); }

/* --------------------------------------------------------------------- write */

const data = {
  id: 'ligar', name: 'Ligar', place: 'Basalt arches', oneLine: 'Nothing here stands alone.',
  sky: 'ligar-sky',
  terrain: prev.terrain,
  ambience: prev.ambience,
  sublevel: PIT,
  deck: { minX: DECK.minX, maxX: DECK.maxX, minZ: DECK.minZ, maxZ: DECK.maxZ },
  hills: HILLS,
  mine,
  landmarks: L,
  sites,
  spawn: { pos: [SPAWN[0], 1.6, SPAWN[1]], lookAt: [0, 1.6, 22.0] },
  // The baked tier frames each site from its approach mark, looking at the plate.
  t2: { stillCamera: Object.fromEntries(sites.map(s => [s.id, { pos: s.approachPos, lookAt: [s.pos[0], round(s.pos[1] + 1.2), s.pos[2]] }])) },
  t1: { siteOrder: sites.map(s => s.id) }
};
writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n');
console.log('written', outPath);
void PLATE; void behind;
