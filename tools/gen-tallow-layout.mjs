#!/usr/bin/env node
/**
 * gen-tallow-layout.mjs — Lays out Tallow's refinery and writes
 * `src/three/world-data/tallow.json`.
 *
 * Tallow is one process line, walked from the landing pad inward:
 *
 *   brine pans -> evaporator row -> cracking towers -> pipe bridges ->
 *   conveyor -> weigh hopper and bagging -> loadout scale beside the hauler
 *
 * and each of the six benches stands at the step of the line its quest is about
 * (`docs/plans/bench-integration.md` §2):
 *
 *   1  raw-salt sample point    at the conveyor's tail
 *   2  instrument room          under the evaporator row (the sub-level)
 *   3  process control house    south of the row
 *   4  tower sampling deck      at the foot of a cracking tower
 *   5  weigh hopper             under the conveyor's discharge chute
 *   6  sack-filling scale       on the bagging line beside it
 *
 * THE EQUIPMENT IS PLACED BY HAND BELOW, THEN THE SCATTER IS SETTLED. Process
 * equipment and hosts are fixed: the line is a design, not something to relax.
 * Crates, heaps, debris, stakes and pans start where they are written and are pushed
 * apart until every footprint is clear, every one stands clear of the real extent
 * of every long structure (the belt, the racks, the hosts and their approach
 * lanes), of the sub-level and of the boss's ground. The script REFUSES to write
 * the file if anything fixed collides, any approach is not open ground for 4.4 m in
 * front of its plate, or the boss arena at (0, 0, 30) is not clear. `npm run
 * verify:tallow` then builds the real world and measures it; this keeps the
 * declaration honest.
 *
 * Run: node tools/gen-tallow-layout.mjs
 */

import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { installDomShim } from './lib/dom-shim.mjs';

// plant.js reaches the DOM through the shared texture kit; the shim is what the verifiers build the world behind.
installDomShim({ tier: 'T4' });
const { CONVEYOR } = await import('../src/three/tallow/plant.js');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outPath = join(root, 'src/three/world-data/tallow.json');
const prev = JSON.parse(readFileSync(outPath, 'utf8'));

const round = n => Math.round(n * 100) / 100;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/* -------------------------------------------------------------- fixed ground */

const SPAWN = [0, 44];
const PAD = [34, 42];
/** The Hopper is fought here: open ground the player walks up to from the spawn. */
const ARENA = { boss: [0, 30], player: [0, 42], radius: 9, corridor: { minX: -5, maxX: 5, minZ: 28, maxZ: 46 } };

/* ------------------------------------------------------------------ the sites */

/** How far from the bench's centre the player is asked to stand (the approach mark). */
const APPROACH = 5.0;
/** The plate's half width and depth, and the open ground in front of it that the bay keeps. */
const PLATE = { hw: 2.4, hd: 0.65 };
const LANE = { hw: 2.8, from: 0.65, to: 5.6 };

const FLOOR_Y = -5.0;
const SUB = {
  floorY: FLOOR_Y,
  room: { minX: -22.0, maxX: 14.0, minZ: -46.0, maxZ: -31.0 },
  stair: { minX: -6.6, maxX: -1.4, minZ: -31.0, maxZ: -22.0 },
  headPos: [-4.0, 0, -23.0],
  ceilingY: -0.85
};

// f: the way the bench faces (the direction from the bench toward where the player stands).
const SITE_DEFS = [
  { id: 'site-1', questId: 'q1-grain', stage: 1, label: 'Bench 1 - Atoms', structure: 'sample-point',
    pos: [17.0, 0, 4.0], f: [1, 0] },
  { id: 'site-2', questId: 'q2-core', stage: 2, label: 'Bench 2 - Inside an Atom', structure: 'instrument-room',
    pos: [-4.0, FLOOR_Y, -43.0], f: [0, 1] },
  { id: 'site-3', questId: 'q3-catalogue', stage: 3, label: 'Bench 3 - The Periodic Table', structure: 'control-house',
    pos: [36.0, 0, -18.0], f: [0, 1] },
  { id: 'site-4', questId: 'q4-ledger', stage: 4, label: 'Bench 4 - Isotopes and Ions', structure: 'tower-deck',
    pos: [31.0, 0, -52.0], f: [0, 1] },
  // The weigh hopper hangs under the conveyor's discharge chute; its bench stands 5 m in front of the bin.
  { id: 'site-5', questId: 'q5-assay', stage: 5, label: 'Bench 5 - Atomic Mass', structure: 'weigh-hopper',
    pos: [0, 0, 0], f: [0, 1] },
  { id: 'site-6', questId: 'q6-weigh', stage: 6, label: 'Bench 6 - Counting By Weight', structure: 'bagging-line',
    pos: [0, 0, 0], f: [0, 1] }
];

/* ------------------------------------------------------------- the conveyor */

// Along x, the head to the west (rotY = -PI/2 swings its local +z to world -x), up the
// yard between the sample point and the bagging line.
const CONV = { x: 2.5, z: 4.0, rotY: -Math.PI / 2 };
/** The mouth of the head's discharge chute, in the world. The weigh hopper hangs from it. */
const OUTLET = [CONV.x - CONVEYOR.outlet.z, CONV.z];
const BIN_BACK = 5.0;           // the hopper's bin is this far behind its bench (host frame)
SITE_DEFS[4].pos = [round(OUTLET[0]), 0, round(OUTLET[1] + BIN_BACK)];
SITE_DEFS[5].pos = [round(OUTLET[0] - 11.4), 0, SITE_DEFS[4].pos[2]];

const sites = SITE_DEFS.map(d => {
  const [px, py, pz] = d.pos;
  return {
    id: d.id, questId: d.questId, stage: d.stage,
    pos: [round(px), py, round(pz)],
    approachPos: [round(px + d.f[0] * APPROACH), round(py + 1.6), round(pz + d.f[1] * APPROACH)],
    label: d.label, structure: d.structure, built: true
  };
});

/** A rectangle given in a bench's own frame (x right, z toward the player), as a world AABB. */
function benchRect(def, x0, x1, z0, z1) {
  const [px, , pz] = def.pos;
  const [fx, fz] = def.f;
  // local x -> world (fz, -fx); local z -> world (fx, fz)
  const pts = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].map(([lx, lz]) => [px + lx * fz + lz * fx, pz - lx * fx + lz * fz]);
  return {
    minX: Math.min(...pts.map(p => p[0])), maxX: Math.max(...pts.map(p => p[0])),
    minZ: Math.min(...pts.map(p => p[1])), maxZ: Math.max(...pts.map(p => p[1]))
  };
}

/* ------------------------------------------------------------- the landmarks */

const L = [];
function lm(asset, x, z, { rotY = 0, scale = 1, radius = 2, minTier = 'T3', host = null, on = null } = {}) {
  const e = { asset, pos: [round(x), 0, round(z)], rotY: round(rotY), scale: round(scale), radius: round(radius), minTier };
  if (host) e.host = host;
  if (on) e.on = on;
  L.push(e);
  return e;
}

// THE EVAPORATOR ROW. The middle two stand on the roof of the instrument room; the
// stair comes up between them. Same four vessels as ever, the same turns.
const ROW_Z = -36;
lm('evaporator', -40, ROW_Z, { rotY: 0.0, scale: 1.0, radius: 6.0 });
lm('evaporator', -16, ROW_Z, { rotY: 0.12, scale: 1.06, radius: 6.0, on: 'roof' });
lm('evaporator', 8, ROW_Z, { rotY: 0.24, scale: 1.0, radius: 6.0, on: 'roof' });
lm('evaporator', 32, ROW_Z, { rotY: 0.36, scale: 1.06, radius: 6.0 });

// THE TOWERS. The second stands in the sampling deck's host (bench 4).
const TOWER_BACK = 8.5;
lm('cracking-tower', -28, -66, { rotY: 0.4, scale: 1.12, radius: 4.4 });
lm('tower-deck', sites[3].pos[0], sites[3].pos[2] - TOWER_BACK, { rotY: 0.647, scale: 1.0, radius: 4.4, host: 'site-4' });

// THE PIPE BRIDGES, running north to south through the gaps in the row, from the towers' side
// to the yard. 26 m: -12.6 to +13.3 about the centre.
lm('pipe-bridge', -28, -44.6, { rotY: 0, radius: 1.6 });
lm('pipe-bridge', 18.5, -44.6, { rotY: 0, radius: 1.6 });

// THE CONVEYOR, tail east, head west.
lm('conveyor', CONV.x, CONV.z, { rotY: CONV.rotY, radius: 1.5 });

// THE HOSTS. Each declares the footprint its machinery stands in; the bench is inside it.
const behind = (site, d) => [site.pos[0] - SITE_DEFS[sites.indexOf(site)].f[0] * d, site.pos[2] - SITE_DEFS[sites.indexOf(site)].f[1] * d];
{
  const [x1, z1] = behind(sites[0], 3.0);
  lm('sample-point', x1, z1, { radius: 4.6, host: 'site-1' });
  const [x3, z3] = behind(sites[2], 5.0);
  lm('control-house', x3, z3, { radius: 5.4, host: 'site-3' });
  lm('weigh-hopper', OUTLET[0], OUTLET[1] + 1.4, { radius: 3.4, host: 'site-5' });
  lm('bagging-line', sites[5].pos[0], sites[5].pos[2] - 3.6, { radius: 5.2, host: 'site-6' });
}

const LOADOUT = [-33, 14];
// THE LOADOUT. A truck scale beside the derelict hauler, where the sacks leave.
lm('loadout-scale', LOADOUT[0], LOADOUT[1], { rotY: 0, radius: 4.8 });
lm('hauler', -46, 4, { rotY: 0.62, radius: 6.2 });

// Fixed ground.
lm('landing-pad', PAD[0], PAD[1], { radius: 8.5 });
lm('comms-mast', 43, 33, { radius: 1.2 });

/* ----------------------------------------------------------- the scatter */

const fixedCount = L.length;
const FREE = [];
function free(asset, x, z, opts) { const e = lm(asset, x, z, opts); FREE.push(e); return e; }

for (const [x, z, r, s] of [
  [-54, -20, 10.8, 1.2], [62, 36, 9.0, 1.0], [46, -46, 9.9, 1.1], [-48, 44, 8.1, 0.9], [66, 4, 9.0, 1.0]
]) free('pan-rim', x, z, { scale: s, radius: r });

// Crates: staged at the sample point, the bagging line and the yard's edges.
for (const [x, z, rot] of [
  [22, -8, 0.0], [24.8, 12, 0.5], [-24, 24, -0.3], [-3, 18, 0.2], [10, 16, -0.6], [-14, -6, 0.35], [-30, -2, 0.15], [28, 20, 0.8]
]) free('crate-stack', x, z, { rotY: rot, radius: 1.75 });

// Heaps: harvested salt waiting for the belt, and the older piles.
for (const [x, z, s] of [[28, 6, 1.3], [-36, 24, 1.0], [-30, 38, 1.15], [46, -14, 0.95]]) {
  free('salt-heap', x, z, { scale: s, radius: round(5 * s) });
}

// Ankle height; T4 only. Decoration, so the world stands without them.
for (const [x, z, rot, s] of [
  [-12, 30, 0.0, 1.0], [22, 24, 0.7, 0.85], [-30, -30, 0.3, 1.1], [40, 8, 1.1, 0.9], [-44, 14, 0.5, 1.0], [0, -26, 0.2, 0.95]
]) free('debris-field', x, z, { rotY: rot, scale: s, radius: 2.2, minTier: 'T4' });
for (const [x, z] of [[-20, 40], [16, 36], [-40, -44], [48, 6]]) free('stake-marker', x, z, { radius: 0.35, minTier: 'T4' });

/* ----------------------------------------------- real extents (keep-outs) */

/**
 * Rects (world AABB) of what a circle cannot describe. Free props stay out of every one,
 * by `margin`; the structures themselves are held to each other at margin 0. `owner` is the
 * site whose host a rect belongs to (its own lane may cross it).
 */
const KEEP = [];
const keep = (name, r, { margin = 0.8, owner = null, lane = false, mayMeet = [] } = {}) =>
  KEEP.push({ name, ...r, margin, owner, lane, mayMeet });

// The belt and its stand: the whole 22 m, not the middle. The weigh hopper hangs under its head on purpose.
{
  const a = CONV.x + CONVEYOR.reach.head * Math.sin(CONV.rotY), b = CONV.x + CONVEYOR.reach.tail * Math.sin(CONV.rotY);
  keep('conveyor', { minX: Math.min(a, b), maxX: Math.max(a, b), minZ: CONV.z - 1.9, maxZ: CONV.z + 1.9 }, { mayMeet: ['site-5'] });
}
// Racks: 4.7 m across (beams, ladder), the 26 m run.
for (const l of L) if (l.asset === 'pipe-bridge') keep('pipe-bridge', { minX: l.pos[0] - 2.5, maxX: l.pos[0] + 2.6, minZ: l.pos[2] - 12.8, maxZ: l.pos[2] + 13.4 });

// Hosts, in their own frame: the plate, and the machinery behind it. [x0, x1, z0, z1] each.
const HOST_EXTENT = {
  'site-1': [[-2.5, 2.5, -0.7, 0.7], [-6.0, 6.0, -2.6, -0.7]],
  'site-3': [[-2.5, 2.5, -0.7, 1.6], [-6.4, 6.4, -9.0, -0.7]],
  'site-5': [[-2.5, 2.5, -0.7, 0.7], [-2.0, 2.0, -7.0, -0.7]],
  'site-6': [[-2.5, 2.5, -0.7, 0.7], [-6.2, 9.2, -6.4, -0.7]]
};
for (const [id, rects] of Object.entries(HOST_EXTENT)) {
  const def = SITE_DEFS.find(d => d.id === id);
  rects.forEach((r, i) => keep(`${id} host ${i}`, benchRect(def, ...r), { owner: id, mayMeet: id === 'site-5' ? ['conveyor'] : [] }));
}
// The tower with its guys: the guys reach 8.5 m out. The bench is in front of it.
{
  const t = L.find(l => l.asset === 'tower-deck');
  keep('tower-deck', { minX: t.pos[0] - 9.2, maxX: t.pos[0] + 9.2, minZ: t.pos[2] - 9.2, maxZ: sites[3].pos[2] - 0.65 }, { owner: 'site-4' });
  keep('site-4 host plate', benchRect(SITE_DEFS[3], -2.5, 2.5, -0.65, 0.65), { owner: 'site-4' });
}
// Every approach lane: the plate's front edge out to where the camera stands, and a little beyond.
for (const d of SITE_DEFS) {
  if (d.pos[1] < -1) continue;
  keep(`${d.id} approach`, benchRect(d, -LANE.hw, LANE.hw, LANE.from, LANE.to), { margin: 0.2, owner: d.id, lane: true });
}
// The sub-level and its stair (with a margin for the rim kerb), the boss's ground, the spawn.
keep('instrument room', SUB.room, { margin: 1.6 });
keep('stair', SUB.stair, { margin: 1.6, mayMeet: ['instrument room'] });
keep('boss arena', { minX: ARENA.boss[0] - ARENA.radius, maxX: ARENA.boss[0] + ARENA.radius, minZ: ARENA.boss[1] - ARENA.radius, maxZ: ARENA.boss[1] + ARENA.radius }, { margin: 0 });
keep('arena corridor', ARENA.corridor, { margin: 0 });
// The loadout scale is a slab 9 x 3.4 m beside its hauler.
keep('loadout-scale', { minX: LOADOUT[0] - 4.7, maxX: LOADOUT[0] + 4.7, minZ: LOADOUT[1] - 1.9, maxZ: LOADOUT[1] + 1.9 }, { margin: 0.6 });

/* ------------------------------------------------------------------ settle */

const inRect = (x, z, r, pad = 0) => x > r.minX - pad && x < r.maxX + pad && z > r.minZ - pad && z < r.maxZ + pad;
/** The distance from a point to a rect (0 inside). */
function rectDist(x, z, r) {
  const dx = Math.max(r.minX - x, 0, x - r.maxX), dz = Math.max(r.minZ - z, 0, z - r.maxZ);
  return Math.hypot(dx, dz);
}
const isFree = e => FREE.includes(e);

for (let pass = 0; pass < 600; pass++) {
  let moved = false;
  for (const it of FREE) {
    // Out of every keep-out rect: pushed along the shortest way out.
    for (const k of KEEP) {
      const need = it.radius + k.margin;
      if (rectDist(it.pos[0], it.pos[2], k) >= need) continue;
      moved = true;
      // nearest edge of the rect, pushed `need` clear of it
      const cx = (k.minX + k.maxX) / 2, cz = (k.minZ + k.maxZ) / 2;
      const hx = (k.maxX - k.minX) / 2 + need + 0.02, hz = (k.maxZ - k.minZ) / 2 + need + 0.02;
      const dx = it.pos[0] - cx, dz = it.pos[2] - cz;
      const px = hx - Math.abs(dx), pz = hz - Math.abs(dz);
      if (px < pz) it.pos[0] = cx + Math.sign(dx || 1) * hx; else it.pos[2] = cz + Math.sign(dz || 1) * hz;
    }
    // Clear of every fixed circle and of every other free one.
    for (const o of L) {
      if (o === it) continue;
      const need = it.radius + o.radius + 0.5;
      const dx = it.pos[0] - o.pos[0], dz = it.pos[2] - o.pos[2];
      const got = Math.hypot(dx, dz) || 1e-6;
      if (got >= need) continue;
      moved = true;
      const push = isFree(o) ? (need - got) / 2 + 0.01 : need - got + 0.01;
      it.pos[0] += dx / got * push; it.pos[2] += dz / got * push;
      if (isFree(o)) { o.pos[0] -= dx / got * push; o.pos[2] -= dz / got * push; }
    }
    // Clear of every site and its approach (the lanes are in KEEP too).
    for (const s of sites) {
      if (s.pos[1] < -1) continue;
      for (const key of ['pos', 'approachPos']) {
        const need = it.radius + 2.6;
        const dx = it.pos[0] - s[key][0], dz = it.pos[2] - s[key][2];
        const got = Math.hypot(dx, dz) || 1e-6;
        if (got >= need) continue;
        moved = true;
        it.pos[0] = s[key][0] + dx / got * need; it.pos[2] = s[key][2] + dz / got * need;
      }
    }
    // Stay on the terrain.
    it.pos[0] = Math.max(-108, Math.min(108, it.pos[0]));
    it.pos[2] = Math.max(-108, Math.min(108, it.pos[2]));
  }
  if (!moved) break;
}
for (const it of L) { it.pos[0] = round(it.pos[0]); it.pos[2] = round(it.pos[2]); }

/* ------------------------------------------------------------------- checks */

let fail = 0;
const bad = m => { fail++; console.log('FAIL', m); };
const nm = l => `${l.asset}@${l.pos[0]},${l.pos[2]}`;

// Every footprint is disjoint (the roof evaporators stand on the room by design, and are not exempt from each other).
for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
  const need = L[i].radius + L[j].radius;
  const got = dist([L[i].pos[0], L[i].pos[2]], [L[j].pos[0], L[j].pos[2]]);
  if (got < need) bad(`${nm(L[i])} and ${nm(L[j])} overlap by ${(need - got).toFixed(2)}`);
}

// Free props clear of every real extent.
for (const it of FREE) for (const k of KEEP) {
  if (rectDist(it.pos[0], it.pos[2], k) < it.radius + k.margin - 0.001) bad(`${nm(it)} stands in the ${k.name} keep-out`);
}

// Surface sites stand clear of every prop that is not their own host.
for (const s of sites) {
  if (s.pos[1] < -1) continue;
  for (const l of L) {
    if (l.host === s.id) continue;
    const got = dist([s.pos[0], s.pos[2]], [l.pos[0], l.pos[2]]);
    if (got < l.radius + 2.2) bad(`${s.id} is inside ${nm(l)} (${got.toFixed(2)})`);
  }
}
// A host's site stands inside the host's own circle or just in front of it, and the host's circle does not reach the approach.
for (const s of sites) {
  const h = L.find(l => l.host === s.id);
  if (!h) continue;
  const toApproach = dist([s.approachPos[0], s.approachPos[2]], [h.pos[0], h.pos[2]]);
  if (toApproach < h.radius + 0.5) bad(`${s.id}'s approach is inside its own host ${nm(h)}`);
}
// The approach is open ground at the foot of the plate: no prop circle in the lane (its own host's circle sits behind the plate).
for (const d of SITE_DEFS) {
  if (d.pos[1] < -1) continue;
  const lane = benchRect(d, -LANE.hw, LANE.hw, LANE.from, LANE.to);
  for (const l of L) {
    if (l.host === d.id) continue;
    if (rectDist(l.pos[0], l.pos[2], lane) < l.radius && l.asset !== 'pan-rim') bad(`${d.id}'s approach lane is crossed by ${nm(l)}`);
  }
}
// Sites on one floor stand 8 apart.
for (let i = 0; i < sites.length; i++) for (let j = i + 1; j < sites.length; j++) {
  if (Math.abs(sites[i].pos[1] - sites[j].pos[1]) > 2) continue;
  const got = dist([sites[i].pos[0], sites[i].pos[2]], [sites[j].pos[0], sites[j].pos[2]]);
  if (got < 8) bad(`${sites[i].id} and ${sites[j].id} are ${got.toFixed(1)} apart`);
}
// The structures' real extents do not touch each other (a lane crossing anything is a bay failure).
for (let i = 0; i < KEEP.length; i++) for (let j = i + 1; j < KEEP.length; j++) {
  const a = KEEP[i], b = KEEP[j];
  if (['boss arena', 'arena corridor'].includes(a.name) && ['boss arena', 'arena corridor'].includes(b.name)) continue;
  if (a.owner && a.owner === b.owner) continue;           // one host's own pieces and its own lane
  if (a.mayMeet.includes(b.name) || b.mayMeet.includes(a.name) || a.mayMeet.includes(b.owner) || b.mayMeet.includes(a.owner)) continue;
  if (a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ) bad(`${a.name} and ${b.name} extents overlap`);
}
// The boss's ground is open: nothing's circle reaches the arena disc or the corridor.
for (const l of L) {
  if (dist([l.pos[0], l.pos[2]], ARENA.boss) < l.radius + ARENA.radius) bad(`${nm(l)} stands on the boss's ground`);
  if (rectDist(l.pos[0], l.pos[2], ARENA.corridor) < l.radius) bad(`${nm(l)} stands in the arena corridor`);
}
// Nothing but the roof evaporators and the long spans stands in the sub-level or its stair.
for (const l of L) {
  if (l.on === 'roof') {
    if (!inRect(l.pos[0], l.pos[2], { minX: SUB.room.minX + l.radius * 0.6, maxX: SUB.room.maxX - l.radius * 0.6, minZ: SUB.room.minZ + 2, maxZ: SUB.room.maxZ }, 0)) {
      bad(`${nm(l)} is declared on the roof but is not over the room`);
    }
    continue;
  }
  if (['pan-rim'].includes(l.asset)) continue;
  for (const r of [SUB.room, SUB.stair]) if (rectDist(l.pos[0], l.pos[2], r) < Math.min(l.radius, 3)) bad(`${nm(l)} stands at the sub-level`);
}
// The stair must meet the room, between the two roof vessels.
{
  const roofs = L.filter(l => l.on === 'roof').sort((a, b) => a.pos[0] - b.pos[0]);
  if (roofs.length !== 2) bad('the room carries two evaporators');
  else if (SUB.stair.minX < roofs[0].pos[0] + 3.4 || SUB.stair.maxX > roofs[1].pos[0] - 3.4) bad('the stair does not rise between the two roof evaporators');
}
// Everything stands on the terrain.
for (const l of L) if (Math.abs(l.pos[0]) > 120 || Math.abs(l.pos[2]) > 120) bad(`${nm(l)} is off the terrain`);

// Every site faces cardinally (the host colliders are axis-aligned boxes).
for (const s of sites) {
  const dx = s.approachPos[0] - s.pos[0], dz = s.approachPos[2] - s.pos[2];
  if (Math.min(Math.abs(dx), Math.abs(dz)) > 1e-6) bad(`${s.id} does not face along an axis`);
}

console.log(`${L.length} landmarks (${fixedCount} fixed, ${FREE.length} settled), ${sites.length} sites, ${fail} failures`);
if (fail) { console.log('refusing to write'); process.exit(1); }

/* --------------------------------------------------------------- the ground marks */

const approach = id => { const s = sites.find(x => x.id === id).approachPos; return [s[0], s[2]]; };
const tracks = {
  _note: prev.tracks._note,
  ruts: [
    [[300, 262], [190, 170], [110, 104], [62, 64], [42, 50]],
    [[26, 35], [10, 27], [-10, 22], [-30, 18], [-60, 14], [-110, 6], [-200, -10]],
    [[-170, 44], [-100, 20], [-60, 4], [-46, 2]],
    [[-110, -72], [-60, -74], [-20, -75], [20, -75], [50, -72], [90, -66]],
    [[-60, -74], [-80, -90], [-140, -130], [-260, -210]]
  ],
  paths: [
    [SPAWN, [10, 24], approach('site-1')],
    [approach('site-1'), [14, 10], approach('site-5')],
    [approach('site-5'), approach('site-6')],
    [approach('site-1'), [27, -4], approach('site-3')],
    [approach('site-3'), [20, -16], SUB.headPos.filter((_, i) => i !== 1)],
    [SUB.headPos.filter((_, i) => i !== 1), [10, -26], [24.5, -30], [24.5, -44], approach('site-4')]
  ]
};
// Start the walks from the spawn and the stair head rather than from the middle of anything.
tracks.paths = tracks.paths.map(p => p.map(q => [round(q[0]), round(q[1])]));

/* --------------------------------------------------------------------- write */

const data = {
  id: 'tallow',
  name: 'Tallow',
  place: 'Salt flats',
  oneLine: prev.oneLine,
  sky: prev.sky,
  terrain: prev.terrain,
  ambience: prev.ambience,
  sublevel: SUB,
  landmarks: L,
  sites,
  spawn: prev.spawn,
  // The baked tier frames each site from its approach mark, looking at the plate.
  t2: { stillCamera: Object.fromEntries(sites.map(s => [s.id, { pos: s.approachPos, lookAt: [s.pos[0], round(s.pos[1] + 1.2), s.pos[2]] }])) },
  t1: { siteOrder: sites.map(s => s.id) },
  tracks
};
writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n');
console.log('written', outPath);
